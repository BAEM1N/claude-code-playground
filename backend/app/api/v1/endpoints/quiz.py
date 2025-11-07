"""
Quiz/Exam System Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import random

from ....core.database import get_db
from ....core.security import get_current_user
from ....api.deps import require_instructor_or_assistant, require_course_member
from ....models.quiz import Quiz, Question, QuizAttempt, Answer
from ....models.course import Course, CourseMember
from ....schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizResponseStudent,
    QuestionCreate, QuestionUpdate, QuestionResponse, QuestionResponseStudent,
    QuizAttemptCreate, QuizAttemptSubmit, QuizAttemptUpdate, QuizAttemptResponse,
    AnswerCreate, AnswerResponse, ManualGradeInput, QuizStatistics
)
from ....services.notification_service import notification_service
from ....api.v1.endpoints.courses import get_or_404, update_model_from_schema

router = APIRouter()


# Helper Functions
def sanitize_question_for_student(question: Question, hide_answers: bool = True) -> dict:
    """Sanitize question data for student view"""
    question_data = {
        "id": question.id,
        "quiz_id": question.quiz_id,
        "question_type": question.question_type,
        "question_text": question.question_text,
        "points": question.points,
        "order": question.order,
        "options": question.options,
    }

    if hide_answers and question.options:
        # Remove is_correct flag from options
        sanitized_options = [
            {k: v for k, v in opt.items() if k != "is_correct"}
            for opt in question.options
        ]
        question_data["options"] = sanitized_options

    return question_data


def auto_grade_answer(question: Question, answer_data: dict) -> tuple[bool, float]:
    """Auto-grade an answer based on question type"""
    if question.question_type == "multiple_choice":
        if not question.options:
            return False, 0.0

        correct_options = [opt["id"] for opt in question.options if opt.get("is_correct", False)]
        student_answer = answer_data.get("selected", [])

        if isinstance(student_answer, str):
            student_answer = [student_answer]

        is_correct = set(correct_options) == set(student_answer)
        return is_correct, question.points if is_correct else 0.0

    elif question.question_type == "true_false":
        student_answer = str(answer_data.get("value", "")).lower()
        correct_answer = str(question.correct_answer).lower()
        is_correct = student_answer == correct_answer
        return is_correct, question.points if is_correct else 0.0

    elif question.question_type == "short_answer":
        student_answer = answer_data.get("text", "")
        correct_answer = question.correct_answer or ""

        if not question.case_sensitive:
            student_answer = student_answer.lower()
            correct_answer = correct_answer.lower()

        is_correct = student_answer.strip() == correct_answer.strip()
        return is_correct, question.points if is_correct else 0.0

    else:  # essay - requires manual grading
        return None, 0.0


# Quiz CRUD
@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a new quiz (Instructor/Assistant only)"""
    # Verify course exists
    await get_or_404(db, Course, quiz_data.course_id)

    # Create quiz
    quiz = Quiz(
        **quiz_data.model_dump(exclude={'questions'}),
        created_by=UUID(current_user["id"])
    )
    db.add(quiz)
    await db.flush()

    # Add questions if provided
    if quiz_data.questions:
        for q_data in quiz_data.questions:
            question = Question(
                **q_data.model_dump(),
                quiz_id=quiz.id
            )
            db.add(question)

    await db.commit()
    await db.refresh(quiz)

    # Notify students if published
    if quiz.is_published:
        members = await db.execute(
            select(CourseMember).where(
                and_(CourseMember.course_id == quiz.course_id,
                     CourseMember.role == "student")
            )
        )
        for member in members.scalars().all():
            await notification_service.create_notification(
                db=db,
                user_id=member.user_id,
                notification_type="quiz",
                title="새로운 퀴즈/시험",
                content=f"{quiz.title}이(가) 등록되었습니다. 기간: {quiz.start_time.strftime('%Y-%m-%d %H:%M')} ~ {quiz.end_time.strftime('%Y-%m-%d %H:%M')}"
            )

    return quiz


@router.get("/quizzes", response_model=List[QuizResponse])
async def list_quizzes(
    course_id: Optional[UUID] = None,
    quiz_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List quizzes (filtered by course and/or type)"""
    query = select(Quiz).where(Quiz.is_deleted == False)

    if course_id:
        query = query.where(Quiz.course_id == course_id)

    if quiz_type:
        query = query.where(Quiz.quiz_type == quiz_type)

    # Students only see published quizzes
    user_role = current_user.get("role", "student")
    if user_role == "student":
        query = query.where(Quiz.is_published == True)

    query = query.order_by(Quiz.start_time.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz details"""
    quiz = await get_or_404(db, Quiz, quiz_id)

    # Check if student can view
    user_role = current_user.get("role", "student")
    if user_role == "student" and not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This quiz is not yet published"
        )

    return quiz


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: UUID,
    quiz_data: QuizUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update quiz (Instructor/Assistant only)"""
    quiz = await get_or_404(db, Quiz, quiz_id)

    # Check if there are any submitted attempts
    result = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.status == "submitted")
        )
    )
    submitted_count = result.scalar()

    if submitted_count > 0:
        # Restrict what can be changed if quiz has submissions
        restricted_fields = {'total_points', 'passing_score'}
        update_fields = {k: v for k, v in quiz_data.model_dump(exclude_unset=True).items()
                        if v is not None and k not in restricted_fields}
    else:
        update_fields = quiz_data.model_dump(exclude_unset=True)

    update_model_from_schema(quiz, update_fields)
    await db.commit()
    await db.refresh(quiz)

    return quiz


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Delete quiz (Instructor/Assistant only)"""
    quiz = await get_or_404(db, Quiz, quiz_id)
    quiz.is_deleted = True
    await db.commit()


# Question CRUD
@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    quiz_id: UUID,
    question_data: QuestionCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a new question (Instructor/Assistant only)"""
    await get_or_404(db, Quiz, quiz_id)

    question = Question(
        **question_data.model_dump(),
        quiz_id=quiz_id
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)

    return question


@router.get("/quizzes/{quiz_id}/questions", response_model=List[QuestionResponse])
async def list_questions(
    quiz_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """List all questions for a quiz (Instructor/Assistant only)"""
    await get_or_404(db, Quiz, quiz_id)

    result = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order)
    )
    return result.scalars().all()


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: UUID,
    question_data: QuestionUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update question (Instructor/Assistant only)"""
    question = await get_or_404(db, Question, question_id)

    update_model_from_schema(question, question_data.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(question)

    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Delete question (Instructor/Assistant only)"""
    question = await get_or_404(db, Question, question_id)
    await db.delete(question)
    await db.commit()


# Quiz Attempts
@router.post("/quizzes/{quiz_id}/start", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    quiz_id: UUID,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new quiz attempt (Student)"""
    quiz = await get_or_404(db, Quiz, quiz_id)

    # Check if quiz is published
    if not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This quiz is not yet published"
        )

    # Check time window
    now = datetime.utcnow()
    if now < quiz.start_time or now > quiz.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz is not currently available"
        )

    # Check attempt limit
    student_id = UUID(current_user["id"])
    result = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.student_id == student_id)
        )
    )
    attempt_count = result.scalar()

    if attempt_count >= quiz.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum attempts ({quiz.max_attempts}) reached"
        )

    # Check for in-progress attempt
    result = await db.execute(
        select(QuizAttempt).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.student_id == student_id,
                 QuizAttempt.status == "in_progress")
        )
    )
    existing_attempt = result.scalar_one_or_none()

    if existing_attempt:
        return existing_attempt

    # Create new attempt
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        attempt_number=attempt_count + 1,
        started_at=now,
        status="in_progress",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    return attempt


@router.post("/attempts/{attempt_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    attempt_id: UUID,
    submit_data: QuizAttemptSubmit,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit quiz attempt (Student)"""
    attempt = await get_or_404(db, QuizAttempt, attempt_id)

    # Verify ownership
    if attempt.student_id != UUID(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Check if already submitted
    if attempt.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt already submitted"
        )

    # Get quiz and questions
    quiz = await get_or_404(db, Quiz, attempt.quiz_id)
    result = await db.execute(
        select(Question).where(Question.quiz_id == quiz.id)
    )
    questions = {q.id: q for q in result.scalars().all()}

    # Process answers
    auto_graded_score = 0.0
    manual_grading_required = False

    for answer_data in submit_data.answers:
        question = questions.get(answer_data.question_id)
        if not question:
            continue

        # Auto-grade if possible
        is_correct, points = auto_grade_answer(question, answer_data.answer)

        if is_correct is None:
            manual_grading_required = True
        else:
            auto_graded_score += points

        # Create answer record
        answer = Answer(
            attempt_id=attempt_id,
            question_id=answer_data.question_id,
            answer=answer_data.answer,
            is_correct=is_correct,
            points_earned=points,
            answered_at=datetime.utcnow()
        )
        db.add(answer)

    # Update attempt
    now = datetime.utcnow()
    attempt.submitted_at = now
    attempt.time_taken_seconds = int((now - attempt.started_at).total_seconds())
    attempt.auto_graded_score = auto_graded_score

    if not manual_grading_required:
        attempt.score = auto_graded_score
        attempt.percentage = (auto_graded_score / quiz.total_points * 100) if quiz.total_points > 0 else 0
        attempt.passed = attempt.percentage >= (quiz.passing_score or 0)
        attempt.status = "graded"
    else:
        attempt.status = "submitted"

    await db.commit()
    await db.refresh(attempt)

    return attempt


@router.patch("/attempts/{attempt_id}/track", response_model=QuizAttemptResponse)
async def track_quiz_behavior(
    attempt_id: UUID,
    track_data: QuizAttemptUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track anti-cheat metrics (Student)"""
    attempt = await get_or_404(db, QuizAttempt, attempt_id)

    # Verify ownership
    if attempt.student_id != UUID(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    if track_data.focus_lost_count is not None:
        attempt.focus_lost_count = track_data.focus_lost_count

    if track_data.tab_switch_count is not None:
        attempt.tab_switch_count = track_data.tab_switch_count

    await db.commit()
    await db.refresh(attempt)

    return attempt


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
async def get_attempt(
    attempt_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz attempt details"""
    attempt = await get_or_404(db, QuizAttempt, attempt_id)

    # Check authorization
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "student")

    if user_role == "student" and attempt.student_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return attempt


@router.get("/quizzes/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
async def list_quiz_attempts(
    quiz_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List attempts for a quiz"""
    await get_or_404(db, Quiz, quiz_id)

    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "student")

    query = select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id)

    # Students only see their own attempts
    if user_role == "student":
        query = query.where(QuizAttempt.student_id == user_id)

    query = query.order_by(QuizAttempt.started_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


# Manual Grading
@router.post("/answers/{answer_id}/grade", response_model=AnswerResponse)
async def grade_answer_manually(
    answer_id: UUID,
    grade_data: ManualGradeInput,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Manually grade an answer (Instructor/Assistant only)"""
    answer = await get_or_404(db, Answer, answer_id)

    # Update answer
    answer.points_earned = grade_data.points_earned
    answer.feedback = grade_data.feedback
    answer.graded_by = UUID(current_user["id"])
    answer.graded_at = datetime.utcnow()

    # Get question to check max points
    question = await get_or_404(db, Question, answer.question_id)
    answer.is_correct = grade_data.points_earned >= question.points

    await db.flush()

    # Recalculate attempt score
    attempt = await get_or_404(db, QuizAttempt, answer.attempt_id)

    # Sum all graded answers
    result = await db.execute(
        select(func.sum(Answer.points_earned)).where(
            Answer.attempt_id == attempt.id
        )
    )
    total_score = result.scalar() or 0.0

    attempt.manual_graded_score = total_score - (attempt.auto_graded_score or 0.0)
    attempt.score = total_score

    # Get quiz for percentage calculation
    quiz = await get_or_404(db, Quiz, attempt.quiz_id)
    attempt.percentage = (total_score / quiz.total_points * 100) if quiz.total_points > 0 else 0
    attempt.passed = attempt.percentage >= (quiz.passing_score or 0)

    # Check if all answers are graded
    result = await db.execute(
        select(func.count(Answer.id)).where(
            and_(Answer.attempt_id == attempt.id,
                 Answer.graded_at.is_(None))
        )
    )
    ungraded_count = result.scalar()

    if ungraded_count == 0:
        attempt.status = "graded"

    await db.commit()
    await db.refresh(answer)

    return answer


# Statistics
@router.get("/quizzes/{quiz_id}/statistics", response_model=QuizStatistics)
async def get_quiz_statistics(
    quiz_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz statistics (Instructor/Assistant only)"""
    await get_or_404(db, Quiz, quiz_id)

    # Total attempts
    result = await db.execute(
        select(func.count(QuizAttempt.id)).where(QuizAttempt.quiz_id == quiz_id)
    )
    total_attempts = result.scalar() or 0

    # Completed attempts
    result = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.status.in_(["submitted", "graded"]))
        )
    )
    completed_attempts = result.scalar() or 0

    # Score statistics
    result = await db.execute(
        select(
            func.avg(QuizAttempt.score),
            func.max(QuizAttempt.score),
            func.min(QuizAttempt.score)
        ).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.score.isnot(None))
        )
    )
    avg_score, max_score, min_score = result.one()

    # Pass rate
    result = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.passed == True)
        )
    )
    passed_count = result.scalar() or 0
    pass_rate = (passed_count / completed_attempts * 100) if completed_attempts > 0 else None

    # Average time
    result = await db.execute(
        select(func.avg(QuizAttempt.time_taken_seconds)).where(
            and_(QuizAttempt.quiz_id == quiz_id,
                 QuizAttempt.time_taken_seconds.isnot(None))
        )
    )
    avg_time = result.scalar()

    return QuizStatistics(
        quiz_id=quiz_id,
        total_attempts=total_attempts,
        completed_attempts=completed_attempts,
        average_score=float(avg_score) if avg_score else None,
        highest_score=float(max_score) if max_score else None,
        lowest_score=float(min_score) if min_score else None,
        pass_rate=pass_rate,
        average_time_seconds=int(avg_time) if avg_time else None
    )

"""
Assignment, submission, and grading endpoints.
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID

from ....core.database import get_db
from ....api.deps import (
    get_current_active_user,
    require_course_member,
    require_instructor_or_assistant,
    require_instructor
)
from ....models.assignment import Assignment, Submission, Grade, SubmissionFile
from ....models.course import CourseMember
from ....models.file import File as FileModel
from ....schemas.assignment import (
    Assignment as AssignmentSchema,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentWithStats,
    Submission as SubmissionSchema,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionWithGrade,
    Grade as GradeSchema,
    GradeCreate,
    GradeUpdate,
    StudentAssignmentStatus,
)
from ....services.notification_service import notification_service
from ....services.storage_service import storage_service

router = APIRouter()


# ==================== Assignment Endpoints ====================

@router.get("", response_model=List[AssignmentSchema])
async def get_course_assignments(
    course_id: UUID = Query(...),
    include_unpublished: bool = Query(False),
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """Get assignments for a course."""
    query = select(Assignment).where(
        Assignment.course_id == course_id,
        Assignment.is_deleted == False
    )

    # Students can only see published assignments
    if current_user.get("course_role") == "student" or not include_unpublished:
        query = query.where(Assignment.is_published == True)

    query = query.order_by(Assignment.due_date.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=AssignmentSchema, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    course_id: UUID = Query(...),
    assignment_data: AssignmentCreate = ...,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a new assignment."""
    assignment = Assignment(
        **assignment_data.dict(),
        course_id=course_id,
        created_by=UUID(current_user["id"])
    )

    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    # Send notification to students if published
    if assignment.is_published:
        # Get all students in the course
        members_query = select(CourseMember).where(
            CourseMember.course_id == course_id,
            CourseMember.role == "student"
        )
        result = await db.execute(members_query)
        members = result.scalars().all()

        # Create notifications
        from ....schemas.course import Course
        course_query = select(Course).where(Course.id == course_id)
        course_result = await db.execute(course_query)
        course = course_result.scalar_one()

        for member in members:
            await notification_service.create_notification(
                db,
                type="assignment",
                title=f"New assignment: {assignment.title}",
                content=f"Due: {assignment.due_date.strftime('%Y-%m-%d %H:%M')}",
                link=f"/courses/{course_id}/assignments/{assignment.id}",
                related_id=assignment.id,
                user_id=member.user_id
            )

    return assignment


@router.get("/{assignment_id}", response_model=AssignmentSchema)
async def get_assignment(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get assignment details."""
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if student can see unpublished assignment
    if not assignment.is_published and current_user.get("course_role") == "student":
        raise HTTPException(status_code=403, detail="Assignment not published yet")

    return assignment


@router.put("/{assignment_id}", response_model=AssignmentSchema)
async def update_assignment(
    assignment_id: UUID,
    assignment_data: AssignmentUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update assignment."""
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for field, value in assignment_data.dict(exclude_unset=True).items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)

    return assignment


@router.delete("/{assignment_id}", status_code=204)
async def delete_assignment(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Delete assignment (soft delete)."""
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.is_deleted = True
    await db.commit()


@router.get("/{assignment_id}/stats", response_model=AssignmentWithStats)
async def get_assignment_stats(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get assignment statistics."""
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Get statistics
    total_submissions_query = select(func.count(Submission.id)).where(
        Submission.assignment_id == assignment_id,
        Submission.is_deleted == False
    )
    total_submissions = await db.scalar(total_submissions_query)

    graded_submissions_query = select(func.count(Submission.id)).where(
        Submission.assignment_id == assignment_id,
        Submission.status == "graded",
        Submission.is_deleted == False
    )
    graded_submissions = await db.scalar(graded_submissions_query)

    # Average score
    avg_score_query = select(func.avg(Grade.percentage)).join(Submission).where(
        Submission.assignment_id == assignment_id
    )
    avg_score = await db.scalar(avg_score_query)

    return AssignmentWithStats(
        **assignment.__dict__,
        total_submissions=total_submissions or 0,
        graded_submissions=graded_submissions or 0,
        average_score=float(avg_score) if avg_score else None
    )


# ==================== Submission Endpoints ====================

@router.post("/{assignment_id}/submissions", response_model=SubmissionSchema, status_code=201)
async def submit_assignment(
    assignment_id: UUID,
    submission_data: SubmissionCreate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit assignment."""
    # Get assignment
    assignment_query = select(Assignment).where(Assignment.id == assignment_id)
    assignment_result = await db.execute(assignment_query)
    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if due date has passed
    is_late = datetime.utcnow() > assignment.due_date
    if is_late and not assignment.late_submission_allowed:
        raise HTTPException(status_code=400, detail="Late submissions not allowed")

    # Check for existing submission
    existing_query = select(Submission).where(
        Submission.assignment_id == assignment_id,
        Submission.student_id == UUID(current_user["id"]),
        Submission.is_deleted == False
    )
    existing_result = await db.execute(existing_query)
    existing_submission = existing_result.scalar_one_or_none()

    if existing_submission and not assignment.allow_resubmission:
        raise HTTPException(status_code=400, detail="Resubmission not allowed")

    # Create submission
    attempt_number = 1
    if existing_submission:
        attempt_number = existing_submission.attempt_number + 1

    submission = Submission(
        **submission_data.dict(),
        assignment_id=assignment_id,
        student_id=UUID(current_user["id"]),
        is_late=is_late,
        attempt_number=attempt_number
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # Notify instructor
    await notification_service.create_notification(
        db,
        type="assignment",
        title=f"New submission for: {assignment.title}",
        content=f"Student submitted assignment",
        link=f"/assignments/{assignment_id}/submissions/{submission.id}",
        related_id=submission.id,
        user_id=assignment.created_by
    )

    return submission


@router.get("/{assignment_id}/submissions", response_model=List[SubmissionWithGrade])
async def get_assignment_submissions(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions for an assignment (instructors/assistants only)."""
    query = select(Submission).where(
        Submission.assignment_id == assignment_id,
        Submission.is_deleted == False
    ).order_by(Submission.submitted_at.desc())

    result = await db.execute(query)
    submissions = result.scalars().all()

    # Load grades
    submissions_with_grades = []
    for submission in submissions:
        grade_query = select(Grade).where(Grade.submission_id == submission.id)
        grade_result = await db.execute(grade_query)
        grade = grade_result.scalar_one_or_none()

        submissions_with_grades.append(
            SubmissionWithGrade(**submission.__dict__, grade=grade)
        )

    return submissions_with_grades


@router.get("/{assignment_id}/my-submission", response_model=SubmissionWithGrade)
async def get_my_submission(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's submission."""
    query = select(Submission).where(
        Submission.assignment_id == assignment_id,
        Submission.student_id == UUID(current_user["id"]),
        Submission.is_deleted == False
    ).order_by(Submission.submitted_at.desc())

    result = await db.execute(query)
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Get grade if exists
    grade_query = select(Grade).where(Grade.submission_id == submission.id)
    grade_result = await db.execute(grade_query)
    grade = grade_result.scalar_one_or_none()

    # Only show grade if released
    if grade and not grade.is_released:
        grade = None

    return SubmissionWithGrade(**submission.__dict__, grade=grade)


# ==================== Grading Endpoints ====================

@router.post("/submissions/{submission_id}/grade", response_model=GradeSchema, status_code=201)
async def grade_submission(
    submission_id: UUID,
    grade_data: GradeCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Grade a submission."""
    # Get submission
    submission_query = select(Submission).where(Submission.id == submission_id)
    submission_result = await db.execute(submission_query)
    submission = submission_result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Check if already graded
    existing_grade_query = select(Grade).where(Grade.submission_id == submission_id)
    existing_grade_result = await db.execute(existing_grade_query)
    existing_grade = existing_grade_result.scalar_one_or_none()

    if existing_grade:
        # Update existing grade
        for field, value in grade_data.dict(exclude_unset=True).items():
            setattr(existing_grade, field, value)

        # Calculate percentage
        existing_grade.percentage = (existing_grade.points / existing_grade.max_points) * 100

        await db.commit()
        await db.refresh(existing_grade)

        grade = existing_grade
    else:
        # Create new grade
        grade = Grade(
            **grade_data.dict(),
            submission_id=submission_id,
            graded_by=UUID(current_user["id"])
        )

        # Calculate percentage
        grade.percentage = (grade.points / grade.max_points) * 100

        db.add(grade)

    # Update submission status
    submission.status = "graded"

    await db.commit()
    await db.refresh(grade)

    # Notify student if grade is released
    if grade.is_released:
        await notification_service.create_notification(
            db,
            type="assignment",
            title="Your assignment has been graded",
            content=f"Score: {grade.points}/{grade.max_points}",
            link=f"/submissions/{submission_id}",
            related_id=grade.id,
            user_id=submission.student_id
        )

    return grade


@router.put("/submissions/{submission_id}/grade", response_model=GradeSchema)
async def update_grade(
    submission_id: UUID,
    grade_data: GradeUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update a grade."""
    query = select(Grade).where(Grade.submission_id == submission_id)
    result = await db.execute(query)
    grade = result.scalar_one_or_none()

    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    was_released = grade.is_released

    for field, value in grade_data.dict(exclude_unset=True).items():
        setattr(grade, field, value)

    # Recalculate percentage if points changed
    if grade_data.points is not None or grade_data.max_points is not None:
        grade.percentage = (grade.points / grade.max_points) * 100

    await db.commit()
    await db.refresh(grade)

    # Notify if newly released
    if grade.is_released and not was_released:
        submission_query = select(Submission).where(Submission.id == submission_id)
        submission_result = await db.execute(submission_query)
        submission = submission_result.scalar_one()

        await notification_service.create_notification(
            db,
            type="assignment",
            title="Your assignment has been graded",
            content=f"Score: {grade.points}/{grade.max_points}",
            link=f"/submissions/{submission_id}",
            related_id=grade.id,
            user_id=submission.student_id
        )

    return grade


@router.get("/submissions/{submission_id}/grade", response_model=GradeSchema)
async def get_grade(
    submission_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get grade for a submission."""
    query = select(Grade).where(Grade.submission_id == submission_id)
    result = await db.execute(query)
    grade = result.scalar_one_or_none()

    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    # Check permission
    submission_query = select(Submission).where(Submission.id == submission_id)
    submission_result = await db.execute(submission_query)
    submission = submission_result.scalar_one()

    # Students can only see released grades for their own submissions
    if str(submission.student_id) == current_user["id"]:
        if not grade.is_released:
            raise HTTPException(status_code=403, detail="Grade not released yet")
    # Instructors/assistants can see all grades
    elif current_user.get("course_role") == "student":
        raise HTTPException(status_code=403, detail="Not authorized")

    return grade

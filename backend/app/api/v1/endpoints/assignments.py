"""
Assignment, submission, and grading endpoints.
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from uuid import UUID

from ....core.database import get_db
from ....api.deps import (
    get_current_active_user,
    require_course_member,
    require_instructor_or_assistant,
    require_instructor
)
from ....api.utils import get_or_404, update_model_from_schema, soft_delete
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
from ....services.assignment_service import AssignmentService
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

    # Send notification to students if published using service
    if assignment.is_published:
        await AssignmentService.notify_students_of_assignment(
            db,
            assignment,
            course_id
        )

    return assignment


@router.get("/{assignment_id}", response_model=AssignmentSchema, status_code=status.HTTP_200_OK)
async def get_assignment(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get assignment details."""
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")

    # Check if student can see unpublished assignment
    if not assignment.is_published and current_user.get("course_role") == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assignment not published yet"
        )

    return assignment


@router.put("/{assignment_id}", response_model=AssignmentSchema, status_code=status.HTTP_200_OK)
async def update_assignment(
    assignment_id: UUID,
    assignment_data: AssignmentUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update assignment."""
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")
    assignment = await update_model_from_schema(assignment, assignment_data)

    await db.commit()
    await db.refresh(assignment)

    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Delete assignment (soft delete)."""
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")
    await soft_delete(db, assignment)


@router.get("/{assignment_id}/stats", response_model=AssignmentWithStats, status_code=status.HTTP_200_OK)
async def get_assignment_stats(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get assignment statistics."""
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")

    # Get statistics from service
    stats = await AssignmentService.get_assignment_statistics(db, assignment_id)

    return AssignmentWithStats(
        **assignment.__dict__,
        **stats
    )


# ==================== Submission Endpoints ====================

@router.post("/{assignment_id}/submissions", response_model=SubmissionSchema, status_code=status.HTTP_201_CREATED)
async def submit_assignment(
    assignment_id: UUID,
    submission_data: SubmissionCreate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit assignment."""
    # Get assignment
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")

    # Check if due date has passed using service
    submission_time = datetime.utcnow()
    is_late = await AssignmentService.check_late_submission(assignment, submission_time)

    if is_late and not assignment.late_submission_allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Late submissions not allowed"
        )

    # Check for existing submission
    existing_query = select(Submission).where(
        Submission.assignment_id == assignment_id,
        Submission.student_id == UUID(current_user["id"]),
        Submission.is_deleted == False
    )
    existing_result = await db.execute(existing_query)
    existing_submission = existing_result.scalar_one_or_none()

    if existing_submission and not assignment.allow_resubmission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resubmission not allowed"
        )

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


@router.get("/{assignment_id}/submissions", response_model=List[SubmissionWithGrade], status_code=status.HTTP_200_OK)
async def get_assignment_submissions(
    assignment_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions for an assignment (instructors/assistants only)."""
    # Use join to avoid N+1 query problem
    query = (
        select(Submission)
        .outerjoin(Grade, Grade.submission_id == Submission.id)
        .where(
            Submission.assignment_id == assignment_id,
            Submission.is_deleted == False
        )
        .options(selectinload(Submission.grade))
        .order_by(Submission.submitted_at.desc())
    )

    result = await db.execute(query)
    submissions = result.scalars().unique().all()

    # Build response with grades
    submissions_with_grades = []
    for submission in submissions:
        submissions_with_grades.append(
            SubmissionWithGrade(
                **submission.__dict__,
                grade=submission.grade if hasattr(submission, 'grade') else None
            )
        )

    return submissions_with_grades


@router.get("/{assignment_id}/my-submission", response_model=SubmissionWithGrade, status_code=status.HTTP_200_OK)
async def get_my_submission(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's submission."""
    query = (
        select(Submission)
        .outerjoin(Grade, Grade.submission_id == Submission.id)
        .where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == UUID(current_user["id"]),
            Submission.is_deleted == False
        )
        .options(selectinload(Submission.grade))
        .order_by(Submission.submitted_at.desc())
    )

    result = await db.execute(query)
    submission = result.scalars().first()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    # Get grade if exists
    grade = submission.grade if hasattr(submission, 'grade') else None

    # Only show grade if released
    if grade and not grade.is_released:
        grade = None

    return SubmissionWithGrade(**submission.__dict__, grade=grade)


# ==================== Grading Endpoints ====================

@router.post("/submissions/{submission_id}/grade", response_model=GradeSchema, status_code=status.HTTP_201_CREATED)
async def grade_submission(
    submission_id: UUID,
    grade_data: GradeCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Grade a submission."""
    # Get submission
    submission = await get_or_404(db, Submission, submission_id, "Submission not found")

    # Check if already graded
    existing_grade_query = select(Grade).where(Grade.submission_id == submission_id)
    existing_grade_result = await db.execute(existing_grade_query)
    existing_grade = existing_grade_result.scalar_one_or_none()

    if existing_grade:
        # Update existing grade
        existing_grade = await update_model_from_schema(existing_grade, grade_data)

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


@router.put("/submissions/{submission_id}/grade", response_model=GradeSchema, status_code=status.HTTP_200_OK)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    was_released = grade.is_released

    grade = await update_model_from_schema(grade, grade_data)

    # Recalculate percentage if points changed
    if grade_data.points is not None or grade_data.max_points is not None:
        grade.percentage = (grade.points / grade.max_points) * 100

    await db.commit()
    await db.refresh(grade)

    # Notify if newly released
    if grade.is_released and not was_released:
        submission = await get_or_404(db, Submission, submission_id, "Submission not found")

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


@router.get("/submissions/{submission_id}/grade", response_model=GradeSchema, status_code=status.HTTP_200_OK)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )

    # Check permission
    submission = await get_or_404(db, Submission, submission_id, "Submission not found")

    # Students can only see released grades for their own submissions
    if str(submission.student_id) == current_user["id"]:
        if not grade.is_released:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Grade not released yet"
            )
    # Instructors/assistants can see all grades
    elif current_user.get("course_role") == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return grade

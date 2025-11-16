"""
Dashboard statistics endpoints for user overview
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta

from ....core.database import get_db
from ....api.deps import get_current_active_user
from ....models.assignment import Assignment, Submission, Grade
from ....models.quiz import Quiz, QuizAttempt
from ....models.course import CourseMember
from ....models.progress import ActivityLog

router = APIRouter()


@router.get("/stats/overview", response_model=Dict[str, Any])
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get overview statistics for the dashboard

    Returns:
        - total_courses: Number of courses enrolled
        - completed_assignments: Number of completed assignments
        - ongoing_quizzes: Number of ongoing quiz attempts
        - recent_activities: List of recent activities
    """
    user_id = UUID(current_user["id"])

    # Get user's courses
    courses_query = select(func.count(CourseMember.id)).where(
        CourseMember.user_id == user_id
    )
    courses_result = await db.execute(courses_query)
    total_courses = courses_result.scalar() or 0

    # Get completed assignments (with grade)
    completed_assignments_query = (
        select(func.count(Submission.id))
        .join(Grade, Grade.submission_id == Submission.id)
        .where(
            Submission.student_id == user_id,
            Submission.is_deleted == False,
            Grade.id.isnot(None)  # Has been graded
        )
    )
    completed_result = await db.execute(completed_assignments_query)
    completed_assignments = completed_result.scalar() or 0

    # Get ongoing quizzes (started but not completed)
    ongoing_quizzes_query = (
        select(func.count(QuizAttempt.id))
        .where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.completed_at.is_(None),
            QuizAttempt.is_submitted == False
        )
    )
    ongoing_result = await db.execute(ongoing_quizzes_query)
    ongoing_quizzes = ongoing_result.scalar() or 0

    # Get recent activities (last 10)
    activities_query = (
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(10)
    )
    activities_result = await db.execute(activities_query)
    activities = activities_result.scalars().all()

    recent_activities = [
        {
            "id": str(activity.id),
            "activity_type": activity.activity_type,
            "description": activity.description or f"{activity.activity_type} activity",
            "timestamp": activity.timestamp.isoformat(),
            "course_id": str(activity.course_id) if activity.course_id else None,
            "metadata": activity.metadata
        }
        for activity in activities
    ]

    return {
        "total_courses": total_courses,
        "completed_assignments": completed_assignments,
        "ongoing_quizzes": ongoing_quizzes,
        "recent_activities": recent_activities
    }


@router.get("/stats/assignments", response_model=Dict[str, Any])
async def get_assignment_stats(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed assignment statistics
    """
    user_id = UUID(current_user["id"])

    # Total submitted
    total_query = select(func.count(Submission.id)).where(
        Submission.student_id == user_id,
        Submission.is_deleted == False
    )
    total_result = await db.execute(total_query)
    total_submitted = total_result.scalar() or 0

    # Graded (completed)
    graded_query = (
        select(func.count(Submission.id))
        .join(Grade, Grade.submission_id == Submission.id)
        .where(
            Submission.student_id == user_id,
            Submission.is_deleted == False
        )
    )
    graded_result = await db.execute(graded_query)
    graded = graded_result.scalar() or 0

    # Pending grading
    pending = total_submitted - graded

    # Average grade
    avg_query = (
        select(func.avg(Grade.score))
        .join(Submission, Submission.id == Grade.submission_id)
        .where(Submission.student_id == user_id)
    )
    avg_result = await db.execute(avg_query)
    average_grade = avg_result.scalar()

    return {
        "total_submitted": total_submitted,
        "graded": graded,
        "pending_grading": pending,
        "average_grade": float(average_grade) if average_grade else None
    }


@router.get("/stats/quizzes", response_model=Dict[str, Any])
async def get_quiz_stats(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed quiz statistics
    """
    user_id = UUID(current_user["id"])

    # Total attempts
    total_query = select(func.count(QuizAttempt.id)).where(
        QuizAttempt.user_id == user_id
    )
    total_result = await db.execute(total_query)
    total_attempts = total_result.scalar() or 0

    # Completed
    completed_query = select(func.count(QuizAttempt.id)).where(
        QuizAttempt.user_id == user_id,
        QuizAttempt.is_submitted == True
    )
    completed_result = await db.execute(completed_query)
    completed = completed_result.scalar() or 0

    # Ongoing (started but not submitted)
    ongoing = total_attempts - completed

    # Average score
    avg_query = (
        select(func.avg(QuizAttempt.score))
        .where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.score.isnot(None)
        )
    )
    avg_result = await db.execute(avg_query)
    average_score = avg_result.scalar()

    return {
        "total_attempts": total_attempts,
        "completed": completed,
        "ongoing": ongoing,
        "average_score": float(average_score) if average_score else None
    }

"""
Learning Progress Dashboard Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from ....core.database import get_db
from ....core.security import get_current_user
from ....api.deps import require_instructor_or_assistant
from ....models.progress import LearningProgress, Achievement, LearningActivity, Milestone, MilestoneCompletion
from ....models.course import Course, CourseMember
from ....models.user import UserProfile
from ....schemas.progress import (
    LearningProgressResponse, LearningProgressSummary,
    AchievementCreate, AchievementUpdate, AchievementResponse,
    LearningActivityCreate, LearningActivityResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse,
    MilestoneCompletionCreate, MilestoneCompletionResponse,
    CourseProgressStatistics, LeaderboardEntry, ProgressComparison
)
from ....api.v1.endpoints.courses import get_or_404, update_model_from_schema
from ....api.v1.endpoints.notifications import create_notification

router = APIRouter()


# Helper Functions
async def get_or_create_progress(db: AsyncSession, student_id: UUID, course_id: UUID) -> LearningProgress:
    """Get or create learning progress for a student in a course"""
    result = await db.execute(
        select(LearningProgress).where(
            and_(LearningProgress.student_id == student_id,
                 LearningProgress.course_id == course_id)
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        progress = LearningProgress(
            student_id=student_id,
            course_id=course_id
        )
        db.add(progress)
        await db.flush()

    return progress


async def update_streak(progress: LearningProgress):
    """Update learning streak"""
    now = datetime.utcnow()
    today = now.date()

    if progress.last_streak_date:
        last_date = progress.last_streak_date.date()
        days_diff = (today - last_date).days

        if days_diff == 1:
            # Continue streak
            progress.current_streak_days += 1
        elif days_diff > 1:
            # Streak broken
            progress.current_streak_days = 1
        # else days_diff == 0, same day - no change
    else:
        # First activity
        progress.current_streak_days = 1

    progress.last_streak_date = now

    # Update longest streak
    if progress.current_streak_days > progress.longest_streak_days:
        progress.longest_streak_days = progress.current_streak_days


async def award_achievement(
    db: AsyncSession,
    progress: LearningProgress,
    achievement_type: str,
    title: str,
    description: str,
    points: int = 0,
    icon: str = None
):
    """Award an achievement to a student"""
    # Check if already earned
    result = await db.execute(
        select(Achievement).where(
            and_(Achievement.progress_id == progress.id,
                 Achievement.achievement_type == achievement_type)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return existing

    # Create achievement
    achievement = Achievement(
        progress_id=progress.id,
        achievement_type=achievement_type,
        title=title,
        description=description,
        icon=icon,
        points_earned=points
    )
    db.add(achievement)

    # Add points to progress
    progress.total_points += points
    progress.experience_points += points

    # Level up logic (simple: 100 XP per level)
    new_level = (progress.experience_points // 100) + 1
    if new_level > progress.level:
        progress.level = new_level
        # Notify level up
        await create_notification(
            db=db,
            user_id=progress.student_id,
            notification_type="achievement",
            title="레벨 업!",
            content=f"축하합니다! 레벨 {new_level}에 도달했습니다!"
        )

    await db.flush()

    # Notify achievement
    await create_notification(
        db=db,
        user_id=progress.student_id,
        notification_type="achievement",
        title="새로운 업적 달성!",
        content=f"{title}: {description}"
    )

    return achievement


# Progress Endpoints
@router.get("/progress", response_model=List[LearningProgressResponse])
async def get_my_progress(
    course_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my learning progress (optionally filtered by course)"""
    student_id = UUID(current_user["id"])

    query = select(LearningProgress).where(LearningProgress.student_id == student_id)

    if course_id:
        query = query.where(LearningProgress.course_id == course_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/progress/{course_id}/summary", response_model=LearningProgressSummary)
async def get_progress_summary(
    course_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive progress summary for a course"""
    student_id = UUID(current_user["id"])

    # Get or create progress
    progress = await get_or_create_progress(db, student_id, course_id)

    # Get recent achievements (last 5)
    result = await db.execute(
        select(Achievement)
        .where(Achievement.progress_id == progress.id)
        .order_by(Achievement.earned_at.desc())
        .limit(5)
    )
    recent_achievements = result.scalars().all()

    # Get recent activities (last 10)
    result = await db.execute(
        select(LearningActivity)
        .where(LearningActivity.progress_id == progress.id)
        .order_by(LearningActivity.activity_date.desc())
        .limit(10)
    )
    recent_activities = result.scalars().all()

    # Get next milestones (incomplete, ordered)
    result = await db.execute(
        select(Milestone)
        .where(
            and_(Milestone.course_id == course_id,
                 Milestone.is_active == True)
        )
        .order_by(Milestone.order)
    )
    all_milestones = result.scalars().all()

    # Filter out completed ones
    completed_ids = await db.execute(
        select(MilestoneCompletion.milestone_id).where(
            MilestoneCompletion.student_id == student_id
        )
    )
    completed_milestone_ids = {id for (id,) in completed_ids}

    next_milestones = [m for m in all_milestones if m.id not in completed_milestone_ids][:3]

    return LearningProgressSummary(
        progress=progress,
        recent_achievements=recent_achievements,
        recent_activities=recent_activities,
        next_milestones=next_milestones
    )


@router.get("/progress/{course_id}/comparison", response_model=ProgressComparison)
async def compare_progress(
    course_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Compare my progress with course average"""
    student_id = UUID(current_user["id"])

    # Get my progress
    progress = await get_or_create_progress(db, student_id, course_id)

    # Get course averages
    result = await db.execute(
        select(
            func.avg(LearningProgress.attendance_rate),
            func.avg(LearningProgress.average_grade),
            func.count(LearningProgress.id)
        ).where(LearningProgress.course_id == course_id)
    )
    avg_attendance, avg_grade, total_students = result.one()

    # Get my rank
    result = await db.execute(
        select(func.count(LearningProgress.id))
        .where(
            and_(LearningProgress.course_id == course_id,
                 LearningProgress.total_points > progress.total_points)
        )
    )
    my_rank = result.scalar() + 1

    return ProgressComparison(
        my_progress=progress,
        course_average_attendance=float(avg_attendance) if avg_attendance else 0.0,
        course_average_grade=float(avg_grade) if avg_grade else None,
        my_rank=my_rank,
        total_students=total_students
    )


# Activity Logging
@router.post("/activities", response_model=LearningActivityResponse, status_code=status.HTTP_201_CREATED)
async def log_activity(
    activity_data: LearningActivityCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a learning activity (internal use - called by other endpoints)"""
    # Get progress
    progress = await get_or_404(db, LearningProgress, activity_data.progress_id)

    # Create activity
    activity = LearningActivity(
        **activity_data.model_dump()
    )
    db.add(activity)

    # Update progress
    progress.total_points += activity_data.points_earned
    progress.experience_points += activity_data.points_earned
    progress.last_activity_at = datetime.utcnow()

    if activity_data.duration_minutes:
        progress.total_study_time_minutes += activity_data.duration_minutes

    # Update streak
    await update_streak(progress)

    await db.commit()
    await db.refresh(activity)

    return activity


# Achievements
@router.get("/achievements", response_model=List[AchievementResponse])
async def get_achievements(
    course_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my achievements"""
    student_id = UUID(current_user["id"])

    query = select(Achievement).join(LearningProgress).where(
        LearningProgress.student_id == student_id
    )

    if course_id:
        query = query.where(LearningProgress.course_id == course_id)

    query = query.order_by(Achievement.earned_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


# Milestones (Instructor)
@router.post("/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    milestone_data: MilestoneCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a milestone (Instructor/Assistant only)"""
    await get_or_404(db, Course, milestone_data.course_id)

    milestone = Milestone(
        **milestone_data.model_dump(),
        created_by=UUID(current_user["id"])
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)

    return milestone


@router.get("/milestones", response_model=List[MilestoneResponse])
async def list_milestones(
    course_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List milestones for a course"""
    await get_or_404(db, Course, course_id)

    # Get milestones
    result = await db.execute(
        select(Milestone)
        .where(
            and_(Milestone.course_id == course_id,
                 Milestone.is_active == True)
        )
        .order_by(Milestone.order)
    )
    milestones = result.scalars().all()

    # Check completion for current user (if student)
    user_id = UUID(current_user["id"])
    result = await db.execute(
        select(MilestoneCompletion.milestone_id).where(
            MilestoneCompletion.student_id == user_id
        )
    )
    completed_milestone_ids = {id for (id,) in result}

    # Add completion status to response
    milestone_list = []
    for m in milestones:
        milestone_dict = {
            **m.__dict__,
            "is_completed": m.id in completed_milestone_ids
        }
        milestone_list.append(MilestoneResponse.model_validate(milestone_dict))

    return milestone_list


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: UUID,
    milestone_data: MilestoneUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update milestone (Instructor/Assistant only)"""
    milestone = await get_or_404(db, Milestone, milestone_id)

    update_model_from_schema(milestone, milestone_data.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(milestone)

    return milestone


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Delete milestone (Instructor/Assistant only)"""
    milestone = await get_or_404(db, Milestone, milestone_id)
    milestone.is_active = False
    await db.commit()


# Leaderboard
@router.get("/leaderboard/{course_id}", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    course_id: UUID,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get course leaderboard"""
    await get_or_404(db, Course, course_id)

    # Get top students by points
    result = await db.execute(
        select(LearningProgress, UserProfile.display_name)
        .join(UserProfile, LearningProgress.student_id == UserProfile.id)
        .where(LearningProgress.course_id == course_id)
        .order_by(desc(LearningProgress.total_points))
        .limit(limit)
    )

    leaderboard = []
    for rank, (progress, name) in enumerate(result.all(), start=1):
        leaderboard.append(LeaderboardEntry(
            student_id=progress.student_id,
            student_name=name,
            total_points=progress.total_points,
            level=progress.level,
            rank=rank
        ))

    return leaderboard


# Course Statistics (Instructor)
@router.get("/statistics/{course_id}", response_model=CourseProgressStatistics)
async def get_course_statistics(
    course_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Get course-wide progress statistics (Instructor/Assistant only)"""
    await get_or_404(db, Course, course_id)

    # Total students
    result = await db.execute(
        select(func.count(CourseMember.id)).where(
            and_(CourseMember.course_id == course_id,
                 CourseMember.role == "student")
        )
    )
    total_students = result.scalar() or 0

    # Active students (activity in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(func.count(LearningProgress.id)).where(
            and_(LearningProgress.course_id == course_id,
                 LearningProgress.last_activity_at >= week_ago)
        )
    )
    active_students = result.scalar() or 0

    # Averages
    result = await db.execute(
        select(
            func.avg(LearningProgress.attendance_rate),
            func.avg(LearningProgress.average_grade)
        ).where(LearningProgress.course_id == course_id)
    )
    avg_attendance, avg_grade = result.one()

    # Total submissions and quiz attempts (would need to query from respective tables)
    # For now, placeholder values
    total_submissions = 0
    total_quiz_attempts = 0

    return CourseProgressStatistics(
        course_id=course_id,
        total_students=total_students,
        active_students=active_students,
        average_attendance_rate=float(avg_attendance) if avg_attendance else 0.0,
        average_grade=float(avg_grade) if avg_grade else None,
        total_submissions=total_submissions,
        total_quiz_attempts=total_quiz_attempts
    )

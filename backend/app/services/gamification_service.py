"""
Gamification Helper Functions
게이미피케이션 시스템 헬퍼 함수들
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional, Dict, Any, List

from ..models.gamification import (
    UserGameProfile,
    XPTransaction,
    XPActivityType,
    BadgeDefinition,
    UserBadge,
)


async def award_xp_to_user(
    db: AsyncSession,
    user_id: UUID,
    activity_type: XPActivityType,
    xp_amount: int,
    points_amount: int = 0,
    description: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    사용자에게 XP를 부여하고 레벨업/배지 획득 처리

    Returns:
        {
            "xp_gained": int,
            "leveled_up": bool,
            "new_level": int,
            "badges_earned": List[BadgeDefinition]
        }
    """
    # Get or create game profile
    result = await db.execute(
        select(UserGameProfile).where(UserGameProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserGameProfile(user_id=user_id)
        db.add(profile)
        await db.flush()

    # Store level before
    level_before = profile.level

    # Add XP and get result
    xp_result = profile.add_xp(xp_amount)

    # Add points
    profile.total_points += points_amount
    profile.weekly_points += points_amount
    profile.monthly_points += points_amount
    profile.total_activities += 1

    # Update streak
    from datetime import datetime
    streak_result = profile.update_streak(datetime.utcnow())

    # Create transaction record
    transaction = XPTransaction(
        user_profile_id=profile.id,
        activity_type=activity_type,
        xp_amount=xp_amount,
        points_amount=points_amount,
        description=description or f"{activity_type.value} completed",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        level_before=level_before,
        level_after=profile.level,
        leveled_up=xp_result["leveled_up"]
    )
    db.add(transaction)

    await db.flush()

    # Check and award badges
    awarded_badges = await check_and_award_badges(db, profile)

    await db.commit()

    # Create gamification notifications (after commit)
    from ..services.notification_service import NotificationService

    # Level up notification
    if xp_result["leveled_up"]:
        await NotificationService.create_level_up_notification(
            db,
            user_id=user_id,
            new_level=profile.level,
            xp_gained=xp_amount
        )

    # Badge earned notifications
    for badge in awarded_badges:
        await NotificationService.create_badge_earned_notification(
            db,
            user_id=user_id,
            badge_name=badge.name,
            badge_icon=badge.icon or "🏅",
            badge_id=badge.id,
            xp_reward=badge.xp_reward,
            points_reward=badge.points_reward
        )

    # Streak milestone notification
    if streak_result.get("streak_maintained"):
        await NotificationService.create_streak_milestone_notification(
            db,
            user_id=user_id,
            streak_days=profile.current_streak
        )

    await db.commit()

    return {
        "xp_gained": xp_amount,
        "points_gained": points_amount,
        "leveled_up": xp_result["leveled_up"],
        "levels_gained": xp_result["levels_gained"],
        "new_level": profile.level,
        "current_xp": profile.current_xp,
        "xp_to_next_level": profile.xp_to_next_level,
        "badges_earned": awarded_badges,
        "streak_maintained": streak_result.get("streak_maintained", False),
        "current_streak": profile.current_streak,
    }


async def check_and_award_badges(
    db: AsyncSession,
    profile: UserGameProfile
) -> List[BadgeDefinition]:
    """배지 조건 확인 및 자동 부여 (Enhanced with prerequisites)"""
    from datetime import datetime
    from sqlalchemy import func
    awarded_badges = []

    # Get all active badge definitions
    result = await db.execute(
        select(BadgeDefinition).where(BadgeDefinition.is_active == True)
    )
    all_badges = result.scalars().all()

    # Get user's earned badge keys
    result = await db.execute(
        select(BadgeDefinition.badge_key)
        .join(UserBadge, UserBadge.badge_id == BadgeDefinition.id)
        .where(UserBadge.user_profile_id == profile.id)
    )
    earned_badge_keys = set(result.scalars().all())

    # Check each badge
    for badge in all_badges:
        if badge.badge_key in earned_badge_keys:
            continue  # Already earned

        if not badge.requirements:
            continue  # No requirements defined

        # Check if seasonal and within season dates
        if badge.is_seasonal:
            now = datetime.utcnow()
            if badge.season_start and now < badge.season_start:
                continue  # Season hasn't started
            if badge.season_end and now > badge.season_end:
                continue  # Season ended

        # Check prerequisites (NEW)
        if not await check_badge_prerequisites(db, profile, badge):
            continue  # Prerequisites not met

        # Check if limited and max earners reached (NEW)
        if badge.is_limited and badge.max_earners:
            earner_count_result = await db.execute(
                select(func.count(UserBadge.id))
                .where(UserBadge.badge_id == badge.id)
            )
            earner_count = earner_count_result.scalar()
            if earner_count >= badge.max_earners:
                continue  # Max earners reached

        # Check requirements
        if await check_badge_requirements(db, profile, badge.requirements):
            # Award badge
            user_badge = UserBadge(
                user_profile_id=profile.id,
                badge_id=badge.id,
                xp_earned=badge.xp_reward,
                points_earned=badge.points_reward,
                progress_data=badge.requirements
            )
            db.add(user_badge)

            # Add XP from badge
            if badge.xp_reward > 0:
                profile.add_xp(badge.xp_reward)
                profile.total_points += badge.points_reward

            profile.total_badges += 1
            awarded_badges.append(badge)

    if awarded_badges:
        await db.flush()

    return awarded_badges


async def check_badge_requirements(
    db: AsyncSession,
    profile: UserGameProfile,
    requirements: dict
) -> bool:
    """배지 요구사항 확인"""
    req_type = requirements.get("type")
    req_value = requirements.get("value")

    if req_type == "level":
        return profile.level >= req_value
    elif req_type == "xp":
        return profile.total_xp >= req_value
    elif req_type == "streak":
        return profile.current_streak >= req_value
    elif req_type == "longest_streak":
        return profile.longest_streak >= req_value
    elif req_type == "badges":
        return profile.total_badges >= req_value
    elif req_type == "activities":
        return profile.total_activities >= req_value
    elif req_type == "study_hours":
        return profile.total_study_hours >= req_value
    elif req_type == "activity":
        # Check specific activity count
        activity_value = requirements.get("value")
        activity_count = requirements.get("count", 1)

        # Count transactions of this type
        from sqlalchemy import func
        result = await db.execute(
            select(func.count(XPTransaction.id))
            .where(
                XPTransaction.user_profile_id == profile.id,
                XPTransaction.activity_type == activity_value
            )
        )
        count = result.scalar()
        return count >= activity_count

    return False


async def calculate_badge_progress(
    db: AsyncSession,
    profile: UserGameProfile,
    badge: BadgeDefinition
) -> Dict[str, Any]:
    """
    배지 획득 진행도 계산 (NEW)

    Returns:
        {
            "current_value": int,
            "target_value": int,
            "percentage": float,
            "is_completed": bool
        }
    """
    from ..models.gamification import BadgeProgress
    from sqlalchemy import func

    requirements = badge.requirements
    if not requirements:
        return {"current_value": 0, "target_value": 1, "percentage": 0.0, "is_completed": False}

    req_type = requirements.get("type")
    target_value = requirements.get("value", 1)
    current_value = 0

    if req_type == "level":
        current_value = profile.level
    elif req_type == "xp":
        current_value = profile.total_xp
    elif req_type == "streak":
        current_value = profile.current_streak
    elif req_type == "longest_streak":
        current_value = profile.longest_streak
    elif req_type == "badges":
        current_value = profile.total_badges
    elif req_type == "activities":
        current_value = profile.total_activities
    elif req_type == "study_hours":
        current_value = int(profile.total_study_hours)
    elif req_type == "activity":
        # Count specific activity
        activity_value = requirements.get("value")
        target_value = requirements.get("count", 1)

        result = await db.execute(
            select(func.count(XPTransaction.id))
            .where(
                XPTransaction.user_profile_id == profile.id,
                XPTransaction.activity_type == activity_value
            )
        )
        current_value = result.scalar() or 0

    percentage = min((current_value / target_value * 100), 100.0) if target_value > 0 else 0.0
    is_completed = current_value >= target_value

    # Update or create progress record
    progress_result = await db.execute(
        select(BadgeProgress).where(
            BadgeProgress.user_profile_id == profile.id,
            BadgeProgress.badge_id == badge.id
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not is_completed:  # Only track progress for incomplete badges
        if progress:
            progress.current_value = current_value
            progress.target_value = target_value
            progress.percentage = percentage
        else:
            progress = BadgeProgress(
                user_profile_id=profile.id,
                badge_id=badge.id,
                current_value=current_value,
                target_value=target_value,
                percentage=percentage
            )
            db.add(progress)

    return {
        "current_value": current_value,
        "target_value": target_value,
        "percentage": percentage,
        "is_completed": is_completed
    }


async def check_badge_prerequisites(
    db: AsyncSession,
    profile: UserGameProfile,
    badge: BadgeDefinition
) -> bool:
    """
    배지 선행 조건 확인 (NEW)
    Returns True if all prerequisite badges are earned
    """
    if not badge.prerequisite_badge_keys:
        return True  # No prerequisites

    # Get earned badge keys
    result = await db.execute(
        select(BadgeDefinition.badge_key)
        .join(UserBadge, UserBadge.badge_id == BadgeDefinition.id)
        .where(UserBadge.user_profile_id == profile.id)
    )
    earned_keys = set(result.scalars().all())

    # Check all prerequisites are earned
    for prereq_key in badge.prerequisite_badge_keys:
        if prereq_key not in earned_keys:
            return False

    return True


# XP amounts for different activities
XP_REWARDS = {
    "video_complete": 50,
    "markdown_complete": 30,
    "notebook_complete": 100,
    "assignment_submit": 100,
    "quiz_complete": 50,
    "quiz_perfect": 150,  # 100% score
    "daily_login": 10,
    "attendance_mark": 20,
    "message_post": 5,
    "forum_post": 20,
    "forum_reply": 10,
    "helpful_answer": 50,
    "code_execute": 5,
    "code_share": 30,
    "competition_join": 50,
    "competition_win": 500,
    "first_course_enroll": 100,
}


def get_xp_for_activity(activity_type: str, bonus: float = 1.0) -> int:
    """활동 타입에 따른 기본 XP 획득"""
    base_xp = XP_REWARDS.get(activity_type, 10)
    return int(base_xp * bonus)

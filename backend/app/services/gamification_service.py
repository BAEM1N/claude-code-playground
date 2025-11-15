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
    """배지 조건 확인 및 자동 부여"""
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

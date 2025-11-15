"""
Gamification API Endpoints
게이미피케이션 시스템 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta, date
from uuid import UUID

from ....db.session import get_db
from ....core.deps import get_current_active_user
from ....models.gamification import (
    UserGameProfile,
    BadgeDefinition,
    UserBadge,
    XPTransaction,
    DailyQuestDefinition,
    UserDailyQuest,
    Leaderboard,
    BadgeType,
    BadgeCategory,
    XPActivityType,
)
from ....models.user import UserProfile
from ....schemas.gamification import (
    UserGameProfileResponse,
    UserGameProfileWithBadges,
    UserGameProfileUpdate,
    BadgeDefinitionResponse,
    BadgeDefinitionCreate,
    BadgeDefinitionUpdate,
    UserBadgeResponse,
    UserBadgeWithDefinition,
    UserBadgeUpdate,
    XPTransactionResponse,
    DailyQuestDefinitionResponse,
    DailyQuestDefinitionCreate,
    DailyQuestDefinitionUpdate,
    UserDailyQuestWithDefinition,
    LeaderboardResponse,
    LeaderboardEntry,
    GamificationStats,
    ActivityLogEntry,
    XPAwardRequest,
    XPAwardResponse,
    BadgeAwardRequest,
    BadgeAwardResponse,
)

router = APIRouter()


# ==================== Helper Functions ====================

async def get_or_create_game_profile(
    user_id: UUID,
    db: AsyncSession
) -> UserGameProfile:
    """Get or create user game profile"""
    result = await db.execute(
        select(UserGameProfile).where(UserGameProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        # Create new profile
        profile = UserGameProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def check_and_award_badges(
    profile: UserGameProfile,
    db: AsyncSession
) -> List[BadgeDefinition]:
    """Check conditions and award badges automatically"""
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
        if await check_badge_requirements(profile, badge.requirements):
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
        await db.commit()

    return awarded_badges


async def check_badge_requirements(
    profile: UserGameProfile,
    requirements: dict
) -> bool:
    """Check if user meets badge requirements"""
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

    return False


# ==================== User Game Profile Endpoints ====================

@router.get("/profile", response_model=UserGameProfileWithBadges)
async def get_my_game_profile(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's game profile"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    # Load badges
    result = await db.execute(
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_profile_id == profile.id)
        .order_by(UserBadge.earned_at.desc())
        .limit(10)
    )
    badges = result.scalars().all()

    # Load recent transactions
    result = await db.execute(
        select(XPTransaction)
        .where(XPTransaction.user_profile_id == profile.id)
        .order_by(XPTransaction.created_at.desc())
        .limit(10)
    )
    transactions = result.scalars().all()

    return {
        **profile.__dict__,
        "badges": badges,
        "recent_transactions": transactions
    }


@router.patch("/profile", response_model=UserGameProfileResponse)
async def update_my_game_profile(
    update_data: UserGameProfileUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's game profile settings"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    # Update fields
    if update_data.display_rank is not None:
        profile.display_rank = update_data.display_rank
    if update_data.display_badges is not None:
        profile.display_badges = update_data.display_badges

    await db.commit()
    await db.refresh(profile)

    return profile


@router.get("/stats", response_model=GamificationStats)
async def get_my_stats(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get gamification statistics"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    # Get recent activities
    result = await db.execute(
        select(XPTransaction)
        .where(XPTransaction.user_profile_id == profile.id)
        .order_by(XPTransaction.created_at.desc())
        .limit(20)
    )
    transactions = result.scalars().all()

    recent_activities = [
        ActivityLogEntry(
            activity_type=t.activity_type,
            xp_earned=t.xp_amount,
            description=t.description or f"{t.activity_type.value} completed",
            timestamp=t.created_at,
            leveled_up=t.leveled_up,
            new_level=t.level_after if t.leveled_up else None
        )
        for t in transactions
    ]

    # Calculate XP progress percentage
    xp_progress = (profile.current_xp / profile.xp_to_next_level * 100) if profile.xp_to_next_level > 0 else 0

    return GamificationStats(
        total_xp=profile.total_xp,
        level=profile.level,
        current_xp=profile.current_xp,
        xp_to_next_level=profile.xp_to_next_level,
        xp_progress_percentage=xp_progress,
        total_points=profile.total_points,
        global_rank=profile.global_rank,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        total_badges=profile.total_badges,
        total_activities=profile.total_activities,
        total_study_hours=profile.total_study_hours,
        recent_activities=recent_activities
    )


# ==================== XP Management ====================

@router.post("/award-xp", response_model=XPAwardResponse)
async def award_xp(
    award_request: XPAwardRequest,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Award XP to current user (called by other systems)"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    # Store level before
    level_before = profile.level

    # Add XP
    xp_result = profile.add_xp(award_request.xp_amount)

    # Add points
    profile.total_points += award_request.points_amount
    profile.total_activities += 1

    # Update streak
    streak_result = profile.update_streak(datetime.utcnow())

    # Create transaction record
    transaction = XPTransaction(
        user_profile_id=profile.id,
        activity_type=award_request.activity_type,
        xp_amount=award_request.xp_amount,
        points_amount=award_request.points_amount,
        description=award_request.description,
        related_entity_type=award_request.related_entity_type,
        related_entity_id=award_request.related_entity_id,
        level_before=level_before,
        level_after=profile.level,
        leveled_up=xp_result["leveled_up"]
    )
    db.add(transaction)

    await db.commit()

    # Check and award badges
    awarded_badges = await check_and_award_badges(profile, db)

    return XPAwardResponse(
        success=True,
        message=f"Awarded {award_request.xp_amount} XP!",
        xp_gained=award_request.xp_amount,
        points_gained=award_request.points_amount,
        leveled_up=xp_result["leveled_up"],
        levels_gained=xp_result["levels_gained"],
        new_level=profile.level,
        current_xp=profile.current_xp,
        xp_to_next_level=profile.xp_to_next_level,
        badges_earned=[BadgeDefinitionResponse.model_validate(b) for b in awarded_badges]
    )


# ==================== Badge Endpoints ====================

@router.get("/badges", response_model=List[BadgeDefinitionResponse])
async def get_all_badges(
    category: Optional[BadgeCategory] = None,
    badge_type: Optional[BadgeType] = None,
    include_secret: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all badge definitions"""
    query = select(BadgeDefinition).where(BadgeDefinition.is_active == True)

    if category:
        query = query.where(BadgeDefinition.category == category)
    if badge_type:
        query = query.where(BadgeDefinition.badge_type == badge_type)
    if not include_secret:
        query = query.where(BadgeDefinition.is_secret == False)

    query = query.order_by(BadgeDefinition.order, BadgeDefinition.name)

    result = await db.execute(query)
    badges = result.scalars().all()

    return badges


@router.get("/my-badges", response_model=List[UserBadgeWithDefinition])
async def get_my_badges(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's earned badges"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    result = await db.execute(
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_profile_id == profile.id)
        .order_by(UserBadge.earned_at.desc())
    )
    badges = result.scalars().all()

    return badges


@router.patch("/badges/{badge_id}", response_model=UserBadgeResponse)
async def update_badge(
    badge_id: UUID,
    update_data: UserBadgeUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user badge (favorite, mark as notified, etc.)"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    result = await db.execute(
        select(UserBadge).where(
            and_(
                UserBadge.id == badge_id,
                UserBadge.user_profile_id == profile.id
            )
        )
    )
    badge = result.scalar_one_or_none()

    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found"
        )

    if update_data.is_favorited is not None:
        badge.is_favorited = update_data.is_favorited
    if update_data.is_notified is not None:
        badge.is_notified = update_data.is_notified

    await db.commit()
    await db.refresh(badge)

    return badge


# ==================== Leaderboard ====================

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query("weekly", regex="^(daily|weekly|monthly|all_time)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get leaderboard"""
    user_id = UUID(current_user["id"])

    # Calculate period
    now = datetime.utcnow()
    if period == "daily":
        period_start = datetime.combine(date.today(), datetime.min.time())
        period_end = now
        points_field = UserGameProfile.total_points  # Daily points not tracked separately
    elif period == "weekly":
        period_start = now - timedelta(days=now.weekday())
        period_start = datetime.combine(period_start.date(), datetime.min.time())
        period_end = now
        points_field = UserGameProfile.weekly_points
    elif period == "monthly":
        period_start = datetime(now.year, now.month, 1)
        period_end = now
        points_field = UserGameProfile.monthly_points
    else:  # all_time
        period_start = datetime(2020, 1, 1)
        period_end = now
        points_field = UserGameProfile.total_points

    # Get top users
    query = (
        select(
            UserGameProfile,
            UserProfile.username,
            UserProfile.avatar_url
        )
        .join(UserProfile, UserProfile.id == UserGameProfile.user_id)
        .where(UserGameProfile.display_rank == True)
        .order_by(desc(points_field))
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    entries = []
    user_rank = None

    for idx, (profile, username, avatar_url) in enumerate(rows, start=1):
        points = getattr(profile, points_field.key)

        entry = LeaderboardEntry(
            rank=idx,
            user_id=profile.user_id,
            username=username,
            avatar_url=avatar_url,
            points=points,
            xp_gained=profile.total_xp,
            activities_count=profile.total_activities,
            badges_earned=profile.total_badges,
            level=profile.level
        )
        entries.append(entry)

        if profile.user_id == user_id:
            user_rank = idx

    # Get total users count
    result = await db.execute(
        select(func.count(UserGameProfile.id))
    )
    total_users = result.scalar()

    return LeaderboardResponse(
        period_type=period,
        period_start=period_start,
        period_end=period_end,
        entries=entries,
        total_users=total_users,
        user_rank=user_rank
    )


# ==================== Daily Quests ====================

@router.get("/daily-quests", response_model=List[UserDailyQuestWithDefinition])
async def get_daily_quests(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get today's daily quests for current user"""
    user_id = UUID(current_user["id"])
    profile = await get_or_create_game_profile(user_id, db)

    today = datetime.combine(date.today(), datetime.min.time())

    # Get user's quests for today
    result = await db.execute(
        select(UserDailyQuest)
        .options(selectinload(UserDailyQuest.quest_definition))
        .where(
            and_(
                UserDailyQuest.user_profile_id == profile.id,
                UserDailyQuest.quest_date >= today
            )
        )
        .order_by(UserDailyQuest.quest_date.desc())
    )
    user_quests = result.scalars().all()

    # If no quests for today, create them
    if not user_quests:
        # Get active quest definitions
        result = await db.execute(
            select(DailyQuestDefinition)
            .where(
                and_(
                    DailyQuestDefinition.is_active == True,
                    DailyQuestDefinition.is_daily == True
                )
            )
            .order_by(DailyQuestDefinition.order)
            .limit(3)  # 3 daily quests per day
        )
        quest_defs = result.scalars().all()

        # Create user quests
        for quest_def in quest_defs:
            user_quest = UserDailyQuest(
                user_profile_id=profile.id,
                quest_definition_id=quest_def.id,
                target_count=quest_def.target_count,
                quest_date=today
            )
            db.add(user_quest)

        await db.commit()

        # Reload
        result = await db.execute(
            select(UserDailyQuest)
            .options(selectinload(UserDailyQuest.quest_definition))
            .where(
                and_(
                    UserDailyQuest.user_profile_id == profile.id,
                    UserDailyQuest.quest_date >= today
                )
            )
        )
        user_quests = result.scalars().all()

    return user_quests


# ==================== Admin Endpoints (Badge Management) ====================

@router.post("/admin/badges", response_model=BadgeDefinitionResponse)
async def create_badge_definition(
    badge_data: BadgeDefinitionCreate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new badge definition (admin only)"""
    # TODO: Add admin role check

    badge = BadgeDefinition(**badge_data.model_dump())
    db.add(badge)
    await db.commit()
    await db.refresh(badge)

    return badge


@router.get("/admin/badges/{badge_id}", response_model=BadgeDefinitionResponse)
async def get_badge_definition(
    badge_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get badge definition"""
    result = await db.execute(
        select(BadgeDefinition).where(BadgeDefinition.id == badge_id)
    )
    badge = result.scalar_one_or_none()

    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found"
        )

    return badge


@router.patch("/admin/badges/{badge_id}", response_model=BadgeDefinitionResponse)
async def update_badge_definition(
    badge_id: UUID,
    update_data: BadgeDefinitionUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update badge definition (admin only)"""
    # TODO: Add admin role check

    result = await db.execute(
        select(BadgeDefinition).where(BadgeDefinition.id == badge_id)
    )
    badge = result.scalar_one_or_none()

    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found"
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(badge, field, value)

    await db.commit()
    await db.refresh(badge)

    return badge

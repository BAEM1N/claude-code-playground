"""
Gamification Pydantic Schemas
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from ..models.gamification import BadgeType, BadgeCategory, XPActivityType


# ==================== UserGameProfile Schemas ====================

class UserGameProfileBase(BaseModel):
    """Base schema for UserGameProfile"""
    display_rank: bool = True
    display_badges: bool = True


class UserGameProfileCreate(UserGameProfileBase):
    """Schema for creating UserGameProfile"""
    user_id: UUID


class UserGameProfileUpdate(BaseModel):
    """Schema for updating UserGameProfile"""
    display_rank: Optional[bool] = None
    display_badges: Optional[bool] = None


class UserGameProfileResponse(UserGameProfileBase):
    """Schema for UserGameProfile response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID

    # XP & Level
    total_xp: int
    current_xp: int
    level: int
    xp_to_next_level: int

    # Points & Rank
    total_points: int
    global_rank: Optional[int] = None
    weekly_points: int
    monthly_points: int

    # Streaks
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[datetime] = None

    # Statistics
    total_badges: int
    total_activities: int
    total_study_hours: float

    # Timestamps
    created_at: datetime
    updated_at: datetime


class UserGameProfileWithBadges(UserGameProfileResponse):
    """Schema for UserGameProfile with badges"""
    badges: List["UserBadgeResponse"] = []
    recent_transactions: List["XPTransactionResponse"] = []


# ==================== BadgeDefinition Schemas ====================

class BadgeDefinitionBase(BaseModel):
    """Base schema for BadgeDefinition"""
    badge_key: str = Field(..., max_length=100)
    name: str = Field(..., max_length=200)
    description: str
    icon_url: Optional[str] = Field(None, max_length=500)
    icon_emoji: Optional[str] = Field(None, max_length=10)
    badge_type: BadgeType = BadgeType.BRONZE
    category: BadgeCategory = BadgeCategory.LEARNING
    requirements: Optional[Dict[str, Any]] = None
    xp_reward: int = 0
    points_reward: int = 0
    order: int = 0
    is_secret: bool = False
    is_active: bool = True


class BadgeDefinitionCreate(BadgeDefinitionBase):
    """Schema for creating BadgeDefinition"""
    pass


class BadgeDefinitionUpdate(BaseModel):
    """Schema for updating BadgeDefinition"""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    icon_emoji: Optional[str] = Field(None, max_length=10)
    badge_type: Optional[BadgeType] = None
    category: Optional[BadgeCategory] = None
    requirements: Optional[Dict[str, Any]] = None
    xp_reward: Optional[int] = None
    points_reward: Optional[int] = None
    order: Optional[int] = None
    is_secret: Optional[bool] = None
    is_active: Optional[bool] = None


class BadgeDefinitionResponse(BadgeDefinitionBase):
    """Schema for BadgeDefinition response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ==================== UserBadge Schemas ====================

class UserBadgeBase(BaseModel):
    """Base schema for UserBadge"""
    is_favorited: bool = False


class UserBadgeResponse(UserBadgeBase):
    """Schema for UserBadge response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_profile_id: UUID
    badge_id: UUID
    earned_at: datetime
    xp_earned: int
    points_earned: int
    is_notified: bool
    progress_data: Optional[Dict[str, Any]] = None


class UserBadgeWithDefinition(UserBadgeResponse):
    """Schema for UserBadge with badge definition"""
    badge: BadgeDefinitionResponse


class UserBadgeUpdate(BaseModel):
    """Schema for updating UserBadge"""
    is_favorited: Optional[bool] = None
    is_notified: Optional[bool] = None


# ==================== XPTransaction Schemas ====================

class XPTransactionBase(BaseModel):
    """Base schema for XPTransaction"""
    activity_type: XPActivityType
    xp_amount: int
    points_amount: int = 0
    description: Optional[str] = None
    related_entity_type: Optional[str] = Field(None, max_length=50)
    related_entity_id: Optional[UUID] = None


class XPTransactionCreate(XPTransactionBase):
    """Schema for creating XPTransaction"""
    user_profile_id: UUID
    level_before: int
    level_after: int
    leveled_up: bool = False


class XPTransactionResponse(XPTransactionBase):
    """Schema for XPTransaction response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_profile_id: UUID
    level_before: int
    level_after: int
    leveled_up: bool
    created_at: datetime


# ==================== DailyQuest Schemas ====================

class DailyQuestDefinitionBase(BaseModel):
    """Base schema for DailyQuestDefinition"""
    quest_key: str = Field(..., max_length=100)
    title: str = Field(..., max_length=200)
    description: str
    icon_emoji: Optional[str] = Field(None, max_length=10)
    activity_type: str = Field(..., max_length=50)
    target_count: int = 1
    xp_reward: int = 50
    points_reward: int = 10
    is_daily: bool = True
    difficulty: int = Field(1, ge=1, le=3)
    order: int = 0
    is_active: bool = True


class DailyQuestDefinitionCreate(DailyQuestDefinitionBase):
    """Schema for creating DailyQuestDefinition"""
    pass


class DailyQuestDefinitionUpdate(BaseModel):
    """Schema for updating DailyQuestDefinition"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    icon_emoji: Optional[str] = Field(None, max_length=10)
    activity_type: Optional[str] = Field(None, max_length=50)
    target_count: Optional[int] = None
    xp_reward: Optional[int] = None
    points_reward: Optional[int] = None
    is_daily: Optional[bool] = None
    difficulty: Optional[int] = Field(None, ge=1, le=3)
    order: Optional[int] = None
    is_active: Optional[bool] = None


class DailyQuestDefinitionResponse(DailyQuestDefinitionBase):
    """Schema for DailyQuestDefinition response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class UserDailyQuestBase(BaseModel):
    """Base schema for UserDailyQuest"""
    current_count: int = 0
    is_completed: bool = False


class UserDailyQuestResponse(UserDailyQuestBase):
    """Schema for UserDailyQuest response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_profile_id: UUID
    quest_definition_id: UUID
    target_count: int
    xp_earned: int = 0
    points_earned: int = 0
    quest_date: datetime
    completed_at: Optional[datetime] = None


class UserDailyQuestWithDefinition(UserDailyQuestResponse):
    """Schema for UserDailyQuest with definition"""
    quest_definition: DailyQuestDefinitionResponse


# ==================== Leaderboard Schemas ====================

class LeaderboardEntry(BaseModel):
    """Schema for a single leaderboard entry"""
    model_config = ConfigDict(from_attributes=True)

    rank: int
    user_id: UUID
    username: str
    avatar_url: Optional[str] = None
    points: int
    xp_gained: int
    activities_count: int
    badges_earned: int
    level: Optional[int] = None


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response"""
    period_type: str  # "daily", "weekly", "monthly", "all_time"
    period_start: datetime
    period_end: datetime
    entries: List[LeaderboardEntry]
    total_users: int
    user_rank: Optional[int] = None  # Current user's rank


# ==================== Activity Schemas ====================

class ActivityLogEntry(BaseModel):
    """Schema for activity log entry"""
    activity_type: XPActivityType
    xp_earned: int
    description: str
    timestamp: datetime
    leveled_up: bool = False
    new_level: Optional[int] = None


class GamificationStats(BaseModel):
    """Overall gamification statistics"""
    total_xp: int
    level: int
    current_xp: int
    xp_to_next_level: int
    xp_progress_percentage: float
    total_points: int
    global_rank: Optional[int] = None
    current_streak: int
    longest_streak: int
    total_badges: int
    total_activities: int
    total_study_hours: float
    recent_activities: List[ActivityLogEntry] = []


# ==================== Badge Award Schemas ====================

class BadgeAwardRequest(BaseModel):
    """Request to award a badge"""
    badge_key: str
    progress_data: Optional[Dict[str, Any]] = None


class BadgeAwardResponse(BaseModel):
    """Response for badge award"""
    success: bool
    message: str
    badge: Optional[UserBadgeWithDefinition] = None
    xp_gained: int = 0
    points_gained: int = 0


# ==================== XP Award Schemas ====================

class XPAwardRequest(BaseModel):
    """Request to award XP"""
    activity_type: XPActivityType
    xp_amount: int
    points_amount: int = 0
    description: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None


class XPAwardResponse(BaseModel):
    """Response for XP award"""
    success: bool
    message: str
    xp_gained: int
    points_gained: int
    leveled_up: bool
    levels_gained: int = 0
    new_level: int
    current_xp: int
    xp_to_next_level: int
    badges_earned: List[BadgeDefinitionResponse] = []  # Auto-earned badges

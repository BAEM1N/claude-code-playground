"""
Pydantic schemas for Learning Path API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ProgressStatus(str, Enum):
    """Progress status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class PathItemType(str, Enum):
    """Types of learning path items"""
    COURSE = "course"
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    RESOURCE = "resource"


# Learning Path Item Schemas
class LearningPathItemBase(BaseModel):
    """Base schema for learning path item"""
    item_type: PathItemType
    item_id: int
    title: str
    description: Optional[str] = None
    order_index: int
    is_required: bool = True
    estimated_hours: Optional[int] = None
    prerequisites: Optional[List[int]] = None  # List of item IDs that must be completed first


class LearningPathItemCreate(LearningPathItemBase):
    """Schema for creating a learning path item"""
    pass


class LearningPathItemUpdate(BaseModel):
    """Schema for updating a learning path item"""
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None
    estimated_hours: Optional[int] = None
    prerequisites: Optional[List[int]] = None


class LearningPathItemResponse(LearningPathItemBase):
    """Schema for learning path item response"""
    id: int
    learning_path_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Learning Path Schemas
class LearningPathBase(BaseModel):
    """Base schema for learning path"""
    title: str
    description: Optional[str] = None
    difficulty_level: DifficultyLevel = DifficultyLevel.BEGINNER
    estimated_hours: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True


class LearningPathCreate(LearningPathBase):
    """Schema for creating a learning path"""
    tags: Optional[List[str]] = None
    items: Optional[List[LearningPathItemCreate]] = None


class LearningPathUpdate(BaseModel):
    """Schema for updating a learning path"""
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    estimated_hours: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None


class LearningPathResponse(LearningPathBase):
    """Schema for learning path response"""
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []

    class Config:
        from_attributes = True


class LearningPathDetailResponse(LearningPathResponse):
    """Schema for detailed learning path response with items"""
    items: List[LearningPathItemResponse] = []
    total_items: int = 0
    required_items: int = 0


# User Progress Schemas
class UserPathItemProgressBase(BaseModel):
    """Base schema for user path item progress"""
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    score: Optional[float] = None
    notes: Optional[str] = None


class UserPathItemProgressUpdate(UserPathItemProgressBase):
    """Schema for updating user path item progress"""
    pass


class UserPathItemProgressResponse(UserPathItemProgressBase):
    """Schema for user path item progress response"""
    id: int
    user_id: int
    path_item_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLearningProgressBase(BaseModel):
    """Base schema for user learning progress"""
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    progress_percentage: float = 0.0


class UserLearningProgressResponse(UserLearningProgressBase):
    """Schema for user learning progress response"""
    id: int
    user_id: int
    learning_path_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Combined schemas for detailed views
class LearningPathItemWithProgress(LearningPathItemResponse):
    """Learning path item with user progress"""
    user_progress: Optional[UserPathItemProgressResponse] = None
    is_locked: bool = False  # True if prerequisites not met


class LearningPathWithProgress(LearningPathDetailResponse):
    """Learning path with user progress"""
    user_progress: Optional[UserLearningProgressResponse] = None
    items_with_progress: List[LearningPathItemWithProgress] = []


# Recommendation schemas
class LearningPathRecommendation(BaseModel):
    """Schema for learning path recommendation"""
    learning_path: LearningPathResponse
    recommendation_score: float = Field(..., ge=0, le=100)
    recommendation_reason: str
    matching_tags: List[str] = []
    user_progress: Optional[UserLearningProgressResponse] = None


class RecommendationsResponse(BaseModel):
    """Schema for recommendations response"""
    recommendations: List[LearningPathRecommendation]
    total: int
    user_completed_paths: int
    user_in_progress_paths: int


# Enrollment schema
class EnrollmentRequest(BaseModel):
    """Schema for enrolling in a learning path"""
    learning_path_id: int


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response"""
    success: bool
    message: str
    user_progress: UserLearningProgressResponse

    class Config:
        from_attributes = True


# Statistics schemas
class LearningPathStats(BaseModel):
    """Statistics for a learning path"""
    learning_path_id: int
    total_enrolled: int
    total_completed: int
    total_in_progress: int
    completion_rate: float
    average_completion_time_hours: Optional[float] = None


class UserLearningStats(BaseModel):
    """Statistics for a user's learning"""
    total_paths_enrolled: int
    total_paths_completed: int
    total_paths_in_progress: int
    total_items_completed: int
    total_learning_hours: float
    completion_rate: float
    recent_activity: List[Dict[str, Any]] = []

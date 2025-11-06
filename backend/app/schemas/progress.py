"""
Learning Progress Dashboard Schemas
"""
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List


# Learning Progress Schemas
class LearningProgressBase(BaseModel):
    """Base schema for Learning Progress"""
    total_assignments: int = 0
    completed_assignments: int = 0
    total_quizzes: int = 0
    completed_quizzes: int = 0
    attendance_rate: float = 0.0
    average_grade: Optional[float] = None
    total_study_time_minutes: int = 0
    total_points: int = 0
    level: int = 1
    experience_points: int = 0
    current_streak_days: int = 0
    longest_streak_days: int = 0


class LearningProgressResponse(LearningProgressBase):
    """Schema for learning progress response"""
    id: UUID
    student_id: UUID
    course_id: UUID
    last_activity_at: Optional[datetime] = None
    last_streak_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningProgressSummary(BaseModel):
    """Summary schema for dashboard"""
    progress: LearningProgressResponse
    recent_achievements: List["AchievementResponse"] = []
    recent_activities: List["LearningActivityResponse"] = []
    next_milestones: List["MilestoneResponse"] = []


# Achievement Schemas
class AchievementBase(BaseModel):
    """Base schema for Achievement"""
    achievement_type: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    points_earned: int = 0


class AchievementCreate(AchievementBase):
    """Schema for creating achievement"""
    progress_id: UUID


class AchievementUpdate(BaseModel):
    """Schema for updating achievement"""
    is_displayed: Optional[bool] = None


class AchievementResponse(AchievementBase):
    """Schema for achievement response"""
    id: UUID
    progress_id: UUID
    earned_at: datetime
    is_displayed: bool

    class Config:
        from_attributes = True


# Learning Activity Schemas
class LearningActivityBase(BaseModel):
    """Base schema for Learning Activity"""
    activity_type: str
    activity_description: Optional[str] = None
    points_earned: int = 0
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    duration_minutes: Optional[int] = None


class LearningActivityCreate(LearningActivityBase):
    """Schema for creating learning activity"""
    progress_id: UUID


class LearningActivityResponse(LearningActivityBase):
    """Schema for learning activity response"""
    id: UUID
    progress_id: UUID
    activity_date: datetime

    class Config:
        from_attributes = True


# Milestone Schemas
class MilestoneBase(BaseModel):
    """Base schema for Milestone"""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    milestone_type: str
    target_value: float
    target_metric: str
    order: int = 0
    icon: Optional[str] = None
    reward_points: int = 0


class MilestoneCreate(MilestoneBase):
    """Schema for creating milestone"""
    course_id: UUID


class MilestoneUpdate(BaseModel):
    """Schema for updating milestone"""
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    target_metric: Optional[str] = None
    order: Optional[int] = None
    icon: Optional[str] = None
    reward_points: Optional[int] = None
    is_active: Optional[bool] = None


class MilestoneResponse(MilestoneBase):
    """Schema for milestone response"""
    id: UUID
    course_id: UUID
    created_by: UUID
    created_at: datetime
    is_active: bool
    completion_rate: Optional[float] = None  # Percentage of students who completed
    is_completed: Optional[bool] = None  # For student view

    class Config:
        from_attributes = True


# Milestone Completion Schemas
class MilestoneCompletionBase(BaseModel):
    """Base schema for Milestone Completion"""
    milestone_id: UUID
    achieved_value: Optional[float] = None


class MilestoneCompletionCreate(MilestoneCompletionBase):
    """Schema for creating milestone completion"""
    pass


class MilestoneCompletionResponse(MilestoneCompletionBase):
    """Schema for milestone completion response"""
    id: UUID
    student_id: UUID
    completed_at: datetime
    points_earned: int

    class Config:
        from_attributes = True


# Statistics Schemas
class CourseProgressStatistics(BaseModel):
    """Course-wide progress statistics"""
    course_id: UUID
    total_students: int
    active_students: int  # Students with activity in last 7 days
    average_attendance_rate: float
    average_grade: Optional[float] = None
    total_submissions: int
    total_quiz_attempts: int


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    student_id: UUID
    student_name: str
    total_points: int
    level: int
    rank: int


class ProgressComparison(BaseModel):
    """Compare student progress with course average"""
    my_progress: LearningProgressResponse
    course_average_attendance: float
    course_average_grade: Optional[float] = None
    my_rank: Optional[int] = None
    total_students: int

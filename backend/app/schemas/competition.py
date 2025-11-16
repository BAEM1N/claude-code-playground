"""
Pydantic schemas for Competition
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CompetitionType(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"


class EvaluationMetric(str, Enum):
    ACCURACY = "accuracy"
    F1_SCORE = "f1"
    RMSE = "rmse"
    MAE = "mae"
    AUC = "auc"
    LOG_LOSS = "logloss"


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MemberStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


# ===== Competition Schemas =====

class CompetitionBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    problem_statement: str
    evaluation_metric: EvaluationMetric
    competition_type: CompetitionType
    max_team_size: Optional[int] = None
    max_submissions_per_day: int = 5
    start_date: datetime
    end_date: datetime
    prize_description: Optional[str] = None
    rules: Optional[str] = None
    dataset_description: Optional[str] = None
    public_test_percentage: int = 50


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    max_submissions_per_day: Optional[int] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    prize_description: Optional[str] = None
    rules: Optional[str] = None


class CompetitionResponse(CompetitionBase):
    id: int
    is_active: bool
    participant_count: int
    submission_count: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    is_joined: bool = False
    my_team_id: Optional[int] = None

    class Config:
        from_attributes = True


# ===== Team Schemas =====

class TeamCreate(BaseModel):
    competition_id: int
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    status: MemberStatus
    joined_at: Optional[datetime] = None
    user: Optional[dict] = None

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: int
    competition_id: int
    name: str
    description: Optional[str] = None
    leader_id: int
    is_active: bool
    created_at: datetime
    member_count: int = 0
    members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True


# ===== Submission Schemas =====

class SubmissionCreate(BaseModel):
    competition_id: int


class SubmissionResponse(BaseModel):
    id: int
    competition_id: int
    user_id: int
    team_id: Optional[int] = None
    public_score: Optional[float] = None
    private_score: Optional[float] = None
    status: SubmissionStatus
    error_message: Optional[str] = None
    is_selected: bool
    submission_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Leaderboard Schemas =====

class LeaderboardEntry(BaseModel):
    rank_public: int
    participant_name: str
    user_id: Optional[int] = None
    team_id: Optional[int] = None
    best_public_score: float
    submission_count: int
    last_submission_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    competition_id: int
    entries: List[LeaderboardEntry]
    total: int


class PrivateLeaderboardEntry(LeaderboardEntry):
    rank_private: int
    best_private_score: float


# ===== Statistics =====

class CompetitionStats(BaseModel):
    total_competitions: int
    active_competitions: int
    total_participants: int
    total_submissions: int


class UserCompetitionStats(BaseModel):
    joined_competitions: int
    total_submissions: int
    best_rank: Optional[int] = None
    medals_gold: int = 0
    medals_silver: int = 0
    medals_bronze: int = 0

"""
Competition models
"""
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..db.base_class import Base


class CompetitionType(str, enum.Enum):
    """Type of competition"""
    INDIVIDUAL = "individual"
    TEAM = "team"


class EvaluationMetric(str, enum.Enum):
    """Evaluation metrics"""
    ACCURACY = "accuracy"
    F1_SCORE = "f1"
    RMSE = "rmse"
    MAE = "mae"
    AUC = "auc"
    LOG_LOSS = "logloss"


class SubmissionStatus(str, enum.Enum):
    """Status of submission"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MemberStatus(str, enum.Enum):
    """Status of team member"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Competition(Base):
    """Competition/Contest"""
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=False)
    evaluation_metric = Column(String(50), nullable=False)
    competition_type = Column(String(20), nullable=False)
    max_team_size = Column(Integer)
    max_submissions_per_day = Column(Integer, default=5, nullable=False)

    # Dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Prize and rules
    prize_description = Column(Text)
    rules = Column(Text)

    # Dataset
    dataset_description = Column(Text)
    train_data_path = Column(String(500))
    test_data_path = Column(String(500))
    sample_submission_path = Column(String(500))
    public_test_percentage = Column(Integer, default=50, nullable=False)

    # Stats
    participant_count = Column(Integer, default=0, nullable=False)
    submission_count = Column(Integer, default=0, nullable=False)

    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    teams = relationship("CompetitionTeam", back_populates="competition", cascade="all, delete-orphan")
    participants = relationship("CompetitionParticipant", back_populates="competition", cascade="all, delete-orphan")
    submissions = relationship("CompetitionSubmission", back_populates="competition", cascade="all, delete-orphan")
    leaderboard = relationship("CompetitionLeaderboard", back_populates="competition", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Competition(id={self.id}, title='{self.title}', type='{self.competition_type}')>"


class CompetitionTeam(Base):
    """Team for team-based competitions"""
    __tablename__ = "competition_teams"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    leader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="teams")
    leader = relationship("User", foreign_keys=[leader_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    submissions = relationship("CompetitionSubmission", back_populates="team")

    def __repr__(self):
        return f"<CompetitionTeam(id={self.id}, name='{self.name}')>"


class TeamMember(Base):
    """Member of a competition team"""
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint('team_id', 'user_id', name='uix_team_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("competition_teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # leader, member
    status = Column(String(20), nullable=False)  # pending, accepted, rejected
    joined_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("CompetitionTeam", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<TeamMember(team_id={self.team_id}, user_id={self.user_id}, status='{self.status}')>"


class CompetitionParticipant(Base):
    """Participant in a competition"""
    __tablename__ = "competition_participants"
    __table_args__ = (
        UniqueConstraint('competition_id', 'user_id', name='uix_competition_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("competition_teams.id", ondelete="SET NULL"))

    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])
    team = relationship("CompetitionTeam", foreign_keys=[team_id])

    def __repr__(self):
        return f"<CompetitionParticipant(competition_id={self.competition_id}, user_id={self.user_id})>"


class CompetitionSubmission(Base):
    """Submission to a competition"""
    __tablename__ = "competition_submissions"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("competition_teams.id", ondelete="CASCADE"))

    submission_file_path = Column(String(500), nullable=False)
    public_score = Column(Float)
    private_score = Column(Float)
    status = Column(String(20), nullable=False)
    error_message = Column(Text)
    is_selected = Column(Boolean, default=False, nullable=False)
    submission_count = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])
    team = relationship("CompetitionTeam", back_populates="submissions")

    def __repr__(self):
        return f"<CompetitionSubmission(id={self.id}, competition_id={self.competition_id}, score={self.public_score})>"


class CompetitionLeaderboard(Base):
    """Leaderboard entry for a competition"""
    __tablename__ = "competition_leaderboard"
    __table_args__ = (
        UniqueConstraint('competition_id', 'user_id', name='uix_leaderboard_comp_user'),
        UniqueConstraint('competition_id', 'team_id', name='uix_leaderboard_comp_team'),
        CheckConstraint('(user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL)',
                       name='check_leaderboard_participant'),
    )

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    team_id = Column(Integer, ForeignKey("competition_teams.id", ondelete="CASCADE"))
    participant_name = Column(String(100), nullable=False)

    best_public_score = Column(Float, nullable=False)
    best_private_score = Column(Float)
    submission_count = Column(Integer, default=0, nullable=False)
    rank_public = Column(Integer)
    rank_private = Column(Integer)
    last_submission_at = Column(DateTime)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="leaderboard")
    user = relationship("User", foreign_keys=[user_id])
    team = relationship("CompetitionTeam", foreign_keys=[team_id])

    def __repr__(self):
        return f"<CompetitionLeaderboard(competition_id={self.competition_id}, rank={self.rank_public}, score={self.best_public_score})>"

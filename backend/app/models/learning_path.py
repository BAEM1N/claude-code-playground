"""
Learning Path models for personalized learning recommendations
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey,
    Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import enum

from ..db.base_class import Base


class DifficultyLevel(str, enum.Enum):
    """Difficulty levels for learning paths"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ProgressStatus(str, enum.Enum):
    """Progress status for learning paths and items"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class PathItemType(str, enum.Enum):
    """Types of items in a learning path"""
    COURSE = "course"
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    RESOURCE = "resource"


class LearningPath(Base):
    """Learning path model"""
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    difficulty_level = Column(String(20), nullable=False, default=DifficultyLevel.BEGINNER)
    estimated_hours = Column(Integer)
    icon = Column(String(50))  # Icon identifier (e.g., 'rocket', 'book', 'code')
    color = Column(String(20))  # Color hex code or name
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_by = relationship("User", foreign_keys=[created_by_id])

    items = relationship("LearningPathItem", back_populates="learning_path", cascade="all, delete-orphan")
    tags = relationship("LearningPathTag", back_populates="learning_path", cascade="all, delete-orphan")
    user_progress = relationship("UserLearningProgress", back_populates="learning_path", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<LearningPath(id={self.id}, title='{self.title}', difficulty='{self.difficulty_level}')>"


class LearningPathItem(Base):
    """Individual item in a learning path"""
    __tablename__ = "learning_path_items"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(20), nullable=False)  # course, assignment, quiz, resource
    item_id = Column(Integer, nullable=False)  # ID of the actual course/assignment/quiz
    title = Column(String(200), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    estimated_hours = Column(Integer)
    prerequisites = Column(JSONB)  # List of path_item IDs that must be completed first

    # Relationships
    learning_path = relationship("LearningPath", back_populates="items")
    user_progress = relationship("UserPathItemProgress", back_populates="path_item", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<LearningPathItem(id={self.id}, type='{self.item_type}', title='{self.title}')>"


class UserLearningProgress(Base):
    """User's progress on a learning path"""
    __tablename__ = "user_learning_progress"
    __table_args__ = (
        UniqueConstraint('user_id', 'learning_path_id', name='uix_user_learning_path'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default=ProgressStatus.NOT_STARTED, nullable=False)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    last_accessed_at = Column(DateTime)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    learning_path = relationship("LearningPath", back_populates="user_progress")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<UserLearningProgress(user_id={self.user_id}, path_id={self.learning_path_id}, progress={self.progress_percentage}%)>"


class UserPathItemProgress(Base):
    """User's progress on individual learning path items"""
    __tablename__ = "user_path_item_progress"
    __table_args__ = (
        UniqueConstraint('user_id', 'path_item_id', name='uix_user_path_item'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    path_item_id = Column(Integer, ForeignKey("learning_path_items.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default=ProgressStatus.NOT_STARTED, nullable=False)
    score = Column(Float)  # Score if applicable
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    path_item = relationship("LearningPathItem", back_populates="user_progress")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<UserPathItemProgress(user_id={self.user_id}, item_id={self.path_item_id}, status='{self.status}')>"


class LearningPathTag(Base):
    """Tags for learning paths (for categorization and filtering)"""
    __tablename__ = "learning_path_tags"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(50), nullable=False, index=True)

    # Relationships
    learning_path = relationship("LearningPath", back_populates="tags")

    def __repr__(self):
        return f"<LearningPathTag(path_id={self.learning_path_id}, tag='{self.tag}')>"

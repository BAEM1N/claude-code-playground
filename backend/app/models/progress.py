"""
Learning Progress Dashboard Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.base import Base


class LearningProgress(Base):
    """학습 진행도"""
    __tablename__ = "learning_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Progress metrics
    total_assignments = Column(Integer, default=0)
    completed_assignments = Column(Integer, default=0)
    total_quizzes = Column(Integer, default=0)
    completed_quizzes = Column(Integer, default=0)
    attendance_rate = Column(Float, default=0.0)  # 출석률 (%)
    average_grade = Column(Float)  # 평균 성적

    # Time tracking
    total_study_time_minutes = Column(Integer, default=0)  # 총 학습 시간
    last_activity_at = Column(DateTime)  # 마지막 활동 시간

    # Gamification
    total_points = Column(Integer, default=0)  # 총 포인트
    level = Column(Integer, default=1)  # 레벨
    experience_points = Column(Integer, default=0)  # 경험치

    # Streaks
    current_streak_days = Column(Integer, default=0)  # 현재 연속 학습 일수
    longest_streak_days = Column(Integer, default=0)  # 최장 연속 학습 일수
    last_streak_date = Column(DateTime)  # 마지막 출석 날짜

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("UserProfile", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])
    achievements = relationship("Achievement", back_populates="progress", cascade="all, delete-orphan")
    activities = relationship("LearningActivity", back_populates="progress", cascade="all, delete-orphan")


class Achievement(Base):
    """업적/배지"""
    __tablename__ = "achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    progress_id = Column(UUID(as_uuid=True), ForeignKey("learning_progress.id", ondelete="CASCADE"), nullable=False)

    # Achievement details
    achievement_type = Column(String(50), nullable=False)  # first_submission, perfect_quiz, attendance_streak, etc.
    title = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(100))  # Icon/badge identifier
    points_earned = Column(Integer, default=0)

    # Metadata
    earned_at = Column(DateTime, default=datetime.utcnow)
    is_displayed = Column(Boolean, default=True)  # Show on profile

    # Relationships
    progress = relationship("LearningProgress", back_populates="achievements")


class LearningActivity(Base):
    """학습 활동 로그"""
    __tablename__ = "learning_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    progress_id = Column(UUID(as_uuid=True), ForeignKey("learning_progress.id", ondelete="CASCADE"), nullable=False)

    # Activity details
    activity_type = Column(String(50), nullable=False)  # login, assignment_submit, quiz_complete, message_post, etc.
    activity_description = Column(Text)
    points_earned = Column(Integer, default=0)

    # Activity context
    related_entity_type = Column(String(50))  # assignment, quiz, message, etc.
    related_entity_id = Column(UUID(as_uuid=True))  # ID of related entity

    # Time tracking
    duration_minutes = Column(Integer)  # Duration of activity
    activity_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    progress = relationship("LearningProgress", back_populates="activities")


class Milestone(Base):
    """학습 마일스톤 (강의별 목표)"""
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Milestone details
    title = Column(String(200), nullable=False)
    description = Column(Text)
    milestone_type = Column(String(50), nullable=False)  # assignment, quiz, attendance, custom

    # Target criteria
    target_value = Column(Float, nullable=False)  # Target value to achieve
    target_metric = Column(String(50), nullable=False)  # What to measure (score, count, percentage, etc.)

    # Display
    order = Column(Integer, default=0)
    icon = Column(String(100))
    reward_points = Column(Integer, default=0)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    course = relationship("Course", foreign_keys=[course_id])
    creator = relationship("UserProfile", foreign_keys=[created_by])
    completions = relationship("MilestoneCompletion", back_populates="milestone", cascade="all, delete-orphan")


class MilestoneCompletion(Base):
    """마일스톤 완료 기록"""
    __tablename__ = "milestone_completions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Completion details
    completed_at = Column(DateTime, default=datetime.utcnow)
    achieved_value = Column(Float)  # Actual value achieved
    points_earned = Column(Integer, default=0)

    # Relationships
    milestone = relationship("Milestone", back_populates="completions")
    student = relationship("UserProfile", foreign_keys=[student_id])

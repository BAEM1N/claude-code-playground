"""
Notification models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..core.database import Base


class NotificationType(str, enum.Enum):
    """알림 타입 (확장됨)"""
    # 기존 타입
    MENTION = "mention"
    FILE_UPLOAD = "file_upload"
    ASSIGNMENT = "assignment"
    ANNOUNCEMENT = "announcement"

    # 게이미피케이션 타입 (NEW)
    LEVEL_UP = "level_up"
    BADGE_EARNED = "badge_earned"
    STREAK_MILESTONE = "streak_milestone"
    RANK_CHANGE = "rank_change"
    TEAM_INVITE = "team_invite"
    TEAM_MESSAGE = "team_message"
    ACHIEVEMENT = "achievement"
    QUEST_COMPLETE = "quest_complete"
    CHALLENGE_INVITE = "challenge_invite"
    FRIEND_REQUEST = "friend_request"
    SYSTEM = "system"


class NotificationPriority(str, enum.Enum):
    """알림 우선순위"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """Notification model (Enhanced for Gamification)"""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    # Enhanced type system
    type = Column(String(50), nullable=False)  # For backward compatibility
    notification_type = Column(SQLEnum(NotificationType))  # NEW: Enum type
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL)  # NEW

    title = Column(String(255), nullable=False)
    content = Column(Text)
    link = Column(Text)
    related_id = Column(UUID(as_uuid=True))  # Flexible reference to related entity

    # NEW: Additional gamification fields
    icon = Column(String(50))  # Emoji or icon name
    data = Column(JSON)  # Additional structured data
    action_url = Column(String(500))  # Action URL for click

    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)  # NEW
    is_dismissed = Column(Boolean, default=False)  # NEW
    dismissed_at = Column(DateTime)  # NEW

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime)  # NEW: Optional expiry

    def mark_as_read(self):
        """알림을 읽음으로 표시"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()

    def dismiss(self):
        """알림을 무시"""
        if not self.is_dismissed:
            self.is_dismissed = True
            self.dismissed_at = datetime.utcnow()

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, user_id={self.user_id}, is_read={self.is_read})>"


class NotificationPreference(Base):
    """
    사용자 알림 설정 (NEW)
    """
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, unique=True)

    # 알림 타입별 활성화 여부
    enable_level_up = Column(Boolean, default=True, nullable=False)
    enable_badge_earned = Column(Boolean, default=True, nullable=False)
    enable_streak_milestone = Column(Boolean, default=True, nullable=False)
    enable_rank_change = Column(Boolean, default=True, nullable=False)
    enable_team_notifications = Column(Boolean, default=True, nullable=False)
    enable_friend_notifications = Column(Boolean, default=True, nullable=False)
    enable_challenge_notifications = Column(Boolean, default=True, nullable=False)
    enable_system_notifications = Column(Boolean, default=True, nullable=False)
    enable_course_notifications = Column(Boolean, default=True, nullable=False)

    # 알림 채널
    enable_in_app = Column(Boolean, default=True, nullable=False)
    enable_email = Column(Boolean, default=False, nullable=False)

    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String(5))  # "22:00" format
    quiet_hours_end = Column(String(5))  # "08:00" format

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("UserProfile", foreign_keys=[user_id])


class Announcement(Base):
    """Announcement model."""

    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("channels.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="announcements")

    def __repr__(self):
        return f"<Announcement(id={self.id}, title={self.title}, course_id={self.course_id})>"

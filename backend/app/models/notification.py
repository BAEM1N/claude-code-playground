"""
Notification models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Notification(Base):
    """Notification model."""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # mention, file_upload, assignment, announcement
    title = Column(String(255), nullable=False)
    content = Column(Text)
    link = Column(Text)
    related_id = Column(UUID(as_uuid=True))  # Flexible reference to related entity
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, user_id={self.user_id}, is_read={self.is_read})>"


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

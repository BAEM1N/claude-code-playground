"""
Channel model.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Channel(Base):
    """Channel (chat room) model."""

    __tablename__ = "channels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(String(20), nullable=False)  # public, private, dm
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_archived = Column(Boolean, default=False)

    # Relationships
    course = relationship("Course", back_populates="channels")
    messages = relationship("Message", back_populates="channel", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Channel(id={self.id}, name={self.name}, type={self.type})>"

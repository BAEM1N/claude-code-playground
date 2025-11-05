"""
Course models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Course(Base):
    """Course model."""

    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    code = Column(String(50), unique=True, index=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    members = relationship("CourseMember", back_populates="course", cascade="all, delete-orphan")
    channels = relationship("Channel", back_populates="course", cascade="all, delete-orphan")
    files = relationship("File", back_populates="course", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="course", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course(id={self.id}, name={self.name}, code={self.code})>"


class CourseMember(Base):
    """Course membership model."""

    __tablename__ = "course_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # instructor, assistant, student
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="members")

    # Constraints
    __table_args__ = (
        UniqueConstraint("course_id", "user_id", name="unique_course_member"),
    )

    def __repr__(self):
        return f"<CourseMember(course_id={self.course_id}, user_id={self.user_id}, role={self.role})>"

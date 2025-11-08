"""
Learning Module System Models
Modular learning path: Track → Course → Chapter → Topic
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from ..db.base import Base


class ContentType(str, enum.Enum):
    """Content type enum for topics"""
    MARKDOWN = "markdown"
    NOTEBOOK = "notebook"  # Jupyter notebook (.ipynb)
    VIDEO = "video"


class TopicStatus(str, enum.Enum):
    """Topic completion status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class VideoSource(str, enum.Enum):
    """Video source type"""
    MINIO = "minio"  # Self-hosted via MinIO
    YOUTUBE = "youtube"
    VIMEO = "vimeo"


class LearningTrack(Base):
    """
    Learning Track - Top level learning path
    Example: "Full Stack Development", "Data Science Fundamentals"
    """
    __tablename__ = "learning_tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic info
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))

    # Organization
    order = Column(Integer, default=0)  # Display order
    is_published = Column(Boolean, default=False)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("UserProfile", foreign_keys=[created_by])
    modules = relationship("LearningModule", back_populates="track", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningTrack(id={self.id}, title={self.title})>"


class LearningModule(Base):
    """
    Learning Module - Connects with existing Course system
    Provides structured learning content within a track
    """
    __tablename__ = "learning_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Hierarchy
    track_id = Column(UUID(as_uuid=True), ForeignKey("learning_tracks.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"))  # Optional link to existing course

    # Basic info
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))

    # Estimates
    estimated_hours = Column(Integer)  # Estimated time to complete
    difficulty_level = Column(String(20))  # beginner, intermediate, advanced

    # Organization
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    track = relationship("LearningTrack", back_populates="modules")
    course = relationship("Course", foreign_keys=[course_id])
    creator = relationship("UserProfile", foreign_keys=[created_by])
    chapters = relationship("LearningChapter", back_populates="module", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningModule(id={self.id}, title={self.title})>"


class LearningChapter(Base):
    """
    Learning Chapter - A section within a module
    Example: "React Hooks", "State Management"
    """
    __tablename__ = "learning_chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Hierarchy
    module_id = Column(UUID(as_uuid=True), ForeignKey("learning_modules.id", ondelete="CASCADE"), nullable=False)

    # Basic info
    title = Column(String(200), nullable=False)
    description = Column(Text)

    # Organization
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    module = relationship("LearningModule", back_populates="chapters")
    topics = relationship("LearningTopic", back_populates="chapter", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningChapter(id={self.id}, title={self.title})>"


class LearningTopic(Base):
    """
    Learning Topic - Individual learning unit (lesson)
    Supports: Markdown, Jupyter Notebook, Video
    """
    __tablename__ = "learning_topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Hierarchy
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("learning_chapters.id", ondelete="CASCADE"), nullable=False)

    # Basic info
    title = Column(String(200), nullable=False)
    description = Column(Text)

    # Content type and source
    content_type = Column(Enum(ContentType), nullable=False)

    # Content storage
    # For markdown: file path in MinIO or direct content
    markdown_content = Column(Text)  # Direct markdown content
    markdown_file_url = Column(String(500))  # Or file URL

    # For notebook: JSON data (ipynb format)
    notebook_data = Column(JSON)  # Full .ipynb JSON
    notebook_kernel = Column(String(50), default="python3")  # python3, javascript, sql, etc.

    # For video: URL or file reference
    video_source = Column(Enum(VideoSource))
    video_url = Column(String(500))  # YouTube URL, Vimeo URL, or MinIO path
    video_duration_seconds = Column(Integer)
    video_thumbnail_url = Column(String(500))

    # Additional resources
    attachments = Column(JSON)  # Array of {name, url, type}

    # Estimates
    duration_minutes = Column(Integer)  # Estimated time to complete

    # Organization
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)
    is_required = Column(Boolean, default=True)  # Required for module completion

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    chapter = relationship("LearningChapter", back_populates="topics")
    progress_records = relationship("TopicProgress", back_populates="topic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningTopic(id={self.id}, title={self.title}, type={self.content_type})>"


class TopicProgress(Base):
    """
    Track individual topic progress per user
    Stores: completion status, time spent, video position, notebook state
    """
    __tablename__ = "topic_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    topic_id = Column(UUID(as_uuid=True), ForeignKey("learning_topics.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Progress status
    status = Column(Enum(TopicStatus), default=TopicStatus.NOT_STARTED, nullable=False)

    # Time tracking
    time_spent_minutes = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    # Content-specific progress
    # For video: last playback position
    video_position_seconds = Column(Integer, default=0)

    # For notebook: saved execution state
    notebook_state = Column(JSON)  # Saved cell outputs and execution state
    notebook_last_cell_index = Column(Integer)  # Last edited/executed cell

    # For markdown: reading progress (optional)
    scroll_position = Column(Integer)  # Scroll position in pixels

    # Metadata
    last_accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    topic = relationship("LearningTopic", back_populates="progress_records")
    user = relationship("UserProfile", foreign_keys=[user_id])

    def __repr__(self):
        return f"<TopicProgress(topic_id={self.topic_id}, user_id={self.user_id}, status={self.status})>"


class NotebookExecution(Base):
    """
    Track Jupyter notebook code executions
    For security and monitoring purposes
    """
    __tablename__ = "notebook_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Context
    topic_id = Column(UUID(as_uuid=True), ForeignKey("learning_topics.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Execution details
    cell_index = Column(Integer, nullable=False)  # Which cell was executed
    code = Column(Text, nullable=False)  # Code that was executed
    kernel_type = Column(String(50), default="python3")

    # Results
    output = Column(Text)  # Execution output
    error = Column(Text)  # Error message if failed
    execution_status = Column(String(20))  # success, error, timeout
    execution_time_ms = Column(Integer)  # Execution time in milliseconds

    # Metadata
    executed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    topic = relationship("LearningTopic", foreign_keys=[topic_id])
    user = relationship("UserProfile", foreign_keys=[user_id])

    def __repr__(self):
        return f"<NotebookExecution(topic_id={self.topic_id}, user_id={self.user_id}, status={self.execution_status})>"

"""
Virtual Classroom models for WebRTC-based online classrooms
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, BigInteger, DateTime, ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import enum

from ..db.base_class import Base


class ParticipantRole(str, enum.Enum):
    """Role of participant in virtual classroom"""
    HOST = "host"
    PRESENTER = "presenter"
    PARTICIPANT = "participant"


class ConnectionQuality(str, enum.Enum):
    """WebRTC connection quality"""
    EXCELLENT = "excellent"
    GOOD = "good"
    POOR = "poor"


class VirtualClassroom(Base):
    """Virtual classroom session with WebRTC support"""
    __tablename__ = "virtual_classrooms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))

    # Scheduling
    scheduled_start = Column(DateTime)
    scheduled_end = Column(DateTime)
    actual_start = Column(DateTime)
    actual_end = Column(DateTime)

    # Status
    is_active = Column(Boolean, default=False, nullable=False)
    is_recording = Column(Boolean, default=False, nullable=False)
    max_participants = Column(Integer, default=50, nullable=False)

    # Settings: {enableChat, enableWhiteboard, enableScreenShare, etc.}
    settings = Column(JSONB)

    # Relationships
    host = relationship("User", foreign_keys=[host_id])
    course = relationship("Course", foreign_keys=[course_id])
    participants = relationship("ClassroomParticipant", back_populates="classroom", cascade="all, delete-orphan")
    whiteboard_strokes = relationship("WhiteboardStroke", back_populates="classroom", cascade="all, delete-orphan")
    shared_files = relationship("SharedFile", back_populates="classroom", cascade="all, delete-orphan")
    recordings = relationship("ClassroomRecording", back_populates="classroom", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<VirtualClassroom(id={self.id}, title='{self.title}', is_active={self.is_active})>"


class ClassroomParticipant(Base):
    """Participant in a virtual classroom"""
    __tablename__ = "classroom_participants"
    __table_args__ = (
        UniqueConstraint('classroom_id', 'user_id', name='uix_classroom_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("virtual_classrooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # host, presenter, participant

    # WebRTC related
    peer_id = Column(String(100))  # WebRTC peer identifier
    is_online = Column(Boolean, default=True, nullable=False)
    is_video_enabled = Column(Boolean, default=True, nullable=False)
    is_audio_enabled = Column(Boolean, default=True, nullable=False)
    is_screen_sharing = Column(Boolean, default=False, nullable=False)
    connection_quality = Column(String(20))  # excellent, good, poor

    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime)

    # Relationships
    classroom = relationship("VirtualClassroom", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ClassroomParticipant(classroom_id={self.classroom_id}, user_id={self.user_id}, role='{self.role}')>"


class WhiteboardStroke(Base):
    """Whiteboard drawing stroke in a classroom"""
    __tablename__ = "whiteboard_strokes"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("virtual_classrooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Stroke data: {points: [{x, y}], color, width, tool: 'pen'|'eraser'|'highlighter'}
    stroke_data = Column(JSONB, nullable=False)
    stroke_order = Column(Integer, nullable=False)  # Order of strokes for replay
    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    classroom = relationship("VirtualClassroom", back_populates="whiteboard_strokes")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<WhiteboardStroke(id={self.id}, classroom_id={self.classroom_id}, order={self.stroke_order})>"


class SharedFile(Base):
    """File shared in a virtual classroom"""
    __tablename__ = "shared_files"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("virtual_classrooms.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    filename = Column(String(255), nullable=False)  # Stored filename
    original_filename = Column(String(255), nullable=False)  # Original filename
    file_size = Column(BigInteger, nullable=False)  # bytes
    mime_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    description = Column(Text)

    is_available = Column(Boolean, default=True, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    classroom = relationship("VirtualClassroom", back_populates="shared_files")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

    def __repr__(self):
        return f"<SharedFile(id={self.id}, filename='{self.original_filename}', size={self.file_size})>"


class ClassroomRecording(Base):
    """Recording of a virtual classroom session"""
    __tablename__ = "classroom_recordings"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("virtual_classrooms.id", ondelete="CASCADE"), nullable=False)

    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    duration = Column(Integer)  # seconds
    format = Column(String(50), nullable=False)  # webm, mp4, etc.

    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime)

    is_processing = Column(Boolean, default=False, nullable=False)
    is_available = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    classroom = relationship("VirtualClassroom", back_populates="recordings")

    def __repr__(self):
        return f"<ClassroomRecording(id={self.id}, classroom_id={self.classroom_id}, duration={self.duration}s)>"

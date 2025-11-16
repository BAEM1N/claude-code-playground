"""
Pydantic schemas for Virtual Classroom
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ParticipantRole(str, Enum):
    HOST = "host"
    PRESENTER = "presenter"
    PARTICIPANT = "participant"


class ConnectionQuality(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    POOR = "poor"


# ===== Virtual Classroom Schemas =====

class VirtualClassroomBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    course_id: Optional[int] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    max_participants: int = Field(default=50, ge=1, le=500)
    settings: Optional[Dict[str, Any]] = None


class VirtualClassroomCreate(VirtualClassroomBase):
    pass


class VirtualClassroomUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    max_participants: Optional[int] = Field(None, ge=1, le=500)
    settings: Optional[Dict[str, Any]] = None


class VirtualClassroomResponse(VirtualClassroomBase):
    id: int
    host_id: int
    is_active: bool
    is_recording: bool
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Classroom Participant Schemas =====

class ClassroomParticipantBase(BaseModel):
    role: ParticipantRole = ParticipantRole.PARTICIPANT


class ClassroomParticipantCreate(ClassroomParticipantBase):
    pass


class ClassroomParticipantUpdate(BaseModel):
    peer_id: Optional[str] = None
    is_video_enabled: Optional[bool] = None
    is_audio_enabled: Optional[bool] = None
    is_screen_sharing: Optional[bool] = None
    connection_quality: Optional[ConnectionQuality] = None


class ClassroomParticipantResponse(ClassroomParticipantBase):
    id: int
    classroom_id: int
    user_id: int
    peer_id: Optional[str] = None
    is_online: bool
    is_video_enabled: bool
    is_audio_enabled: bool
    is_screen_sharing: bool
    connection_quality: Optional[ConnectionQuality] = None
    joined_at: datetime
    left_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Whiteboard Stroke Schemas =====

class WhiteboardStrokeCreate(BaseModel):
    classroom_id: int
    stroke_data: Dict[str, Any] = Field(..., description="Stroke data with points, color, width, tool")
    stroke_order: int


class WhiteboardStrokeResponse(BaseModel):
    id: int
    classroom_id: int
    user_id: int
    stroke_data: Dict[str, Any]
    stroke_order: int
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Shared File Schemas =====

class SharedFileCreate(BaseModel):
    classroom_id: int
    original_filename: str
    file_size: int
    mime_type: str
    description: Optional[str] = None


class SharedFileResponse(BaseModel):
    id: int
    classroom_id: int
    uploaded_by_id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    description: Optional[str] = None
    is_available: bool
    download_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ===== Classroom Recording Schemas =====

class ClassroomRecordingResponse(BaseModel):
    id: int
    classroom_id: int
    filename: str
    file_size: Optional[int] = None
    duration: Optional[int] = None
    format: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_processing: bool
    is_available: bool
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Detailed Response with Relationships =====

class ClassroomParticipantWithUser(ClassroomParticipantResponse):
    user: Optional[Dict[str, Any]] = None


class VirtualClassroomDetail(VirtualClassroomResponse):
    participants: List[ClassroomParticipantWithUser] = []
    active_participants_count: Optional[int] = None
    recordings: List[ClassroomRecordingResponse] = []


# ===== WebRTC Signaling Schemas =====

class WebRTCOffer(BaseModel):
    """WebRTC offer for signaling"""
    classroom_id: int
    target_peer_id: str
    sdp: Dict[str, Any]


class WebRTCAnswer(BaseModel):
    """WebRTC answer for signaling"""
    classroom_id: int
    target_peer_id: str
    sdp: Dict[str, Any]


class WebRTCIceCandidate(BaseModel):
    """ICE candidate for WebRTC connection"""
    classroom_id: int
    target_peer_id: Optional[str] = None  # None for broadcast
    candidate: Dict[str, Any]


# ===== Statistics =====

class ClassroomStatistics(BaseModel):
    total_classrooms: int
    active_classrooms: int
    total_participants: int
    total_recordings: int
    total_duration_minutes: int


class UserClassroomStats(BaseModel):
    hosted_classrooms: int
    attended_classrooms: int
    total_attendance_minutes: int
    recordings_available: int

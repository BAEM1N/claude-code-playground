"""
Attendance Pydantic Schemas
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


# AttendanceSession Schemas
class AttendanceSessionBase(BaseModel):
    """Base schema for attendance session"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    session_type: str = Field(default="lecture")
    start_time: datetime
    end_time: datetime
    allow_late_minutes: int = Field(default=10, ge=0, le=60)
    password: Optional[str] = Field(None, max_length=50)
    location_required: bool = Field(default=False)
    allowed_location: Optional[Dict[str, Any]] = None

    @field_validator('end_time')
    @classmethod
    def end_time_must_be_after_start_time(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class AttendanceSessionCreate(AttendanceSessionBase):
    """Schema for creating attendance session"""
    course_id: UUID


class AttendanceSessionUpdate(BaseModel):
    """Schema for updating attendance session"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    session_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    allow_late_minutes: Optional[int] = Field(None, ge=0, le=60)
    password: Optional[str] = Field(None, max_length=50)
    location_required: Optional[bool] = None
    allowed_location: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class AttendanceSessionResponse(AttendanceSessionBase):
    """Schema for attendance session response"""
    id: UUID
    course_id: UUID
    qr_code: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool

    # Additional fields for response
    total_students: Optional[int] = None
    checked_students: Optional[int] = None
    present_count: Optional[int] = None
    late_count: Optional[int] = None
    absent_count: Optional[int] = None

    class Config:
        from_attributes = True


# AttendanceRecord Schemas
class AttendanceRecordBase(BaseModel):
    """Base schema for attendance record"""
    location: Optional[Dict[str, Any]] = None


class AttendanceCheckIn(BaseModel):
    """Schema for student check-in"""
    qr_code: Optional[str] = None
    password: Optional[str] = None
    location: Optional[Dict[str, float]] = None  # {"lat": 37.123, "lng": 127.123}


class AttendanceRecordCreate(AttendanceRecordBase):
    """Schema for creating attendance record (admin)"""
    session_id: UUID
    student_id: UUID
    status: str = Field(..., pattern="^(present|late|absent)$")
    check_method: str = Field(default="manual")
    notes: Optional[str] = None


class AttendanceRecordUpdate(BaseModel):
    """Schema for updating attendance record"""
    status: Optional[str] = Field(None, pattern="^(present|late|absent)$")
    notes: Optional[str] = None


class AttendanceRecordResponse(AttendanceRecordBase):
    """Schema for attendance record response"""
    id: UUID
    session_id: UUID
    student_id: UUID
    checked_at: datetime
    status: str
    check_method: str
    ip_address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Additional fields with student info
    student_name: Optional[str] = None
    student_username: Optional[str] = None

    class Config:
        from_attributes = True


# Statistics Schemas
class AttendanceStats(BaseModel):
    """Schema for attendance statistics"""
    total_sessions: int
    total_students: int
    overall_attendance_rate: float
    present_count: int
    late_count: int
    absent_count: int

    # Per-session stats
    sessions: list[AttendanceSessionResponse]


class StudentAttendanceStats(BaseModel):
    """Schema for individual student attendance statistics"""
    student_id: UUID
    student_name: str
    total_sessions: int
    present_count: int
    late_count: int
    absent_count: int
    attendance_rate: float
    records: list[AttendanceRecordResponse]

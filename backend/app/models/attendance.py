"""
Attendance System Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.base import Base


class AttendanceSession(Base):
    """출석 세션 (강의별 출석 체크 세션)"""
    __tablename__ = "attendance_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)  # "3주차 강의"
    description = Column(Text)
    session_type = Column(String(50), default="lecture")  # lecture, lab, seminar, etc.

    # 출석 시간 설정
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    allow_late_minutes = Column(Integer, default=10)  # 지각 허용 시간

    # 출석 방법
    qr_code = Column(String(100), unique=True, index=True)  # QR 코드 (UUID 기반)
    password = Column(String(50))  # 출석 비밀번호 (선택)
    location_required = Column(Boolean, default=False)  # 위치 기반 체크 필요 여부
    allowed_location = Column(JSON)  # {"lat": 37.123, "lng": 127.123, "radius": 100}

    # 메타데이터
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    course = relationship("Course", back_populates="attendance_sessions")
    creator = relationship("UserProfile", foreign_keys=[created_by])
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    """출석 기록 (학생별 출석 체크 기록)"""
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # 출석 정보
    checked_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(String(20), nullable=False)  # present, late, absent
    check_method = Column(String(20))  # qr, password, location, manual

    # 위치 정보 (선택)
    location = Column(JSON)  # {"lat": 37.123, "lng": 127.123}
    ip_address = Column(String(45))  # IPv4/IPv6
    user_agent = Column(Text)  # 브라우저 정보

    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text)  # 관리자 메모

    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("UserProfile", foreign_keys=[student_id])

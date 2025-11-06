"""
Calendar System Models
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.base import Base


class CalendarEvent(Base):
    """캘린더 이벤트"""
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Event details
    title = Column(String(200), nullable=False)
    description = Column(Text)
    event_type = Column(String(50), nullable=False)  # class, assignment, quiz, exam, office_hours, holiday, custom

    # Time information
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    all_day = Column(Boolean, default=False)

    # Location
    location = Column(String(200))  # Physical or virtual location
    meeting_url = Column(String(500))  # Zoom, Teams, etc.

    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(JSON)  # iCal RRULE format: {"freq": "WEEKLY", "interval": 1, "byday": ["MO", "WE"], "until": "2024-12-31"}

    # Related entities
    related_entity_type = Column(String(50))  # assignment, quiz, attendance, etc.
    related_entity_id = Column(UUID(as_uuid=True))  # ID of related entity

    # Display
    color = Column(String(20))  # Event color for calendar display
    is_visible = Column(Boolean, default=True)

    # Reminders
    reminder_enabled = Column(Boolean, default=True)
    reminder_minutes_before = Column(Integer, default=60)  # Remind 60 minutes before

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # Relationships
    course = relationship("Course", foreign_keys=[course_id])
    creator = relationship("UserProfile", foreign_keys=[created_by])
    reminders = relationship("EventReminder", back_populates="event", cascade="all, delete-orphan")
    attendees = relationship("EventAttendee", back_populates="event", cascade="all, delete-orphan")


class EventReminder(Base):
    """이벤트 리마인더 (발송 기록)"""
    __tablename__ = "event_reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("calendar_events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Reminder details
    reminder_type = Column(String(20), default="notification")  # notification, email, both
    scheduled_time = Column(DateTime, nullable=False)
    sent_at = Column(DateTime)

    # Status
    is_sent = Column(Boolean, default=False)
    send_error = Column(Text)  # Error message if sending failed

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("CalendarEvent", back_populates="reminders")
    user = relationship("UserProfile", foreign_keys=[user_id])


class EventAttendee(Base):
    """이벤트 참석자"""
    __tablename__ = "event_attendees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("calendar_events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # RSVP status
    rsvp_status = Column(String(20), default="pending")  # pending, accepted, declined, maybe
    rsvp_at = Column(DateTime)

    # Attendance (for actual attendance tracking)
    attended = Column(Boolean)
    attended_at = Column(DateTime)

    # Metadata
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("CalendarEvent", back_populates="attendees")
    user = relationship("UserProfile", foreign_keys=[user_id])


class PersonalEvent(Base):
    """개인 이벤트 (학생 개인 일정)"""
    __tablename__ = "personal_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Event details
    title = Column(String(200), nullable=False)
    description = Column(Text)
    event_type = Column(String(50), default="personal")  # study, task, meeting, personal, etc.

    # Time information
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    all_day = Column(Boolean, default=False)

    # Location
    location = Column(String(200))

    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(JSON)

    # Display
    color = Column(String(20))

    # Reminders
    reminder_enabled = Column(Boolean, default=True)
    reminder_minutes_before = Column(Integer, default=30)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # Relationships
    user = relationship("UserProfile", foreign_keys=[user_id])

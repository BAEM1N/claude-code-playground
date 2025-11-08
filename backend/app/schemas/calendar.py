"""
Calendar System Schemas
"""
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any


# Calendar Event Schemas
class CalendarEventBase(BaseModel):
    """Base schema for Calendar Event"""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    event_type: str
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[Dict[str, Any]] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    color: Optional[str] = None
    is_visible: bool = True
    reminder_enabled: bool = True
    reminder_minutes_before: int = 60


class CalendarEventCreate(CalendarEventBase):
    """Schema for creating calendar event"""
    course_id: UUID


class CalendarEventUpdate(BaseModel):
    """Schema for updating calendar event"""
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[Dict[str, Any]] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    color: Optional[str] = None
    is_visible: Optional[bool] = None
    reminder_enabled: Optional[bool] = None
    reminder_minutes_before: Optional[int] = None


class CalendarEventResponse(CalendarEventBase):
    """Schema for calendar event response"""
    id: UUID
    course_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    attendee_count: Optional[int] = None
    my_rsvp_status: Optional[str] = None

    class Config:
        from_attributes = True


# Personal Event Schemas
class PersonalEventBase(BaseModel):
    """Base schema for Personal Event"""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    event_type: str = "personal"
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    reminder_enabled: bool = True
    reminder_minutes_before: int = 30


class PersonalEventCreate(PersonalEventBase):
    """Schema for creating personal event"""
    pass


class PersonalEventUpdate(BaseModel):
    """Schema for updating personal event"""
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    reminder_minutes_before: Optional[int] = None


class PersonalEventResponse(PersonalEventBase):
    """Schema for personal event response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Event Attendee Schemas
class EventAttendeeBase(BaseModel):
    """Base schema for Event Attendee"""
    rsvp_status: str = "pending"


class EventAttendeeCreate(BaseModel):
    """Schema for adding attendee"""
    event_id: UUID
    user_id: UUID


class EventAttendeeUpdate(BaseModel):
    """Schema for updating RSVP"""
    rsvp_status: str


class EventAttendeeResponse(EventAttendeeBase):
    """Schema for event attendee response"""
    id: UUID
    event_id: UUID
    user_id: UUID
    rsvp_at: Optional[datetime] = None
    attended: Optional[bool] = None
    attended_at: Optional[datetime] = None
    added_at: datetime

    class Config:
        from_attributes = True


# Event Reminder Schemas
class EventReminderBase(BaseModel):
    """Base schema for Event Reminder"""
    reminder_type: str = "notification"
    scheduled_time: datetime


class EventReminderResponse(EventReminderBase):
    """Schema for event reminder response"""
    id: UUID
    event_id: UUID
    user_id: UUID
    is_sent: bool
    sent_at: Optional[datetime] = None
    send_error: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Combined Calendar View
class CalendarView(BaseModel):
    """Combined calendar view with all events"""
    course_events: List[CalendarEventResponse] = []
    personal_events: List[PersonalEventResponse] = []


class CalendarDayView(BaseModel):
    """Day view with events"""
    date: datetime
    events: List[CalendarEventResponse | PersonalEventResponse] = []


# iCal Export Schema
class ICalExportRequest(BaseModel):
    """Schema for iCal export request"""
    course_ids: Optional[List[UUID]] = None
    include_personal: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

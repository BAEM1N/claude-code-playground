"""
Calendar System Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from ....core.database import get_db
from ....core.auth import get_current_user, require_instructor_or_assistant
from ....models.calendar import CalendarEvent, EventReminder, EventAttendee, PersonalEvent
from ....models.course import Course, CourseMember
from ....schemas.calendar import (
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse,
    PersonalEventCreate, PersonalEventUpdate, PersonalEventResponse,
    EventAttendeeCreate, EventAttendeeUpdate, EventAttendeeResponse,
    CalendarView, ICalExportRequest
)
from ....api.v1.endpoints.courses import get_or_404, update_model_from_schema
from ....api.v1.endpoints.notifications import create_notification

router = APIRouter()


# Helper Functions
def generate_ical(events: List[CalendarEvent | PersonalEvent], course_name: str = "Calendar") -> str:
    """Generate iCalendar format string"""
    ical_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Course Platform//Calendar//EN",
        f"X-WR-CALNAME:{course_name}",
        "X-WR-TIMEZONE:UTC",
    ]

    for event in events:
        # Format datetime
        dtstart = event.start_time.strftime("%Y%m%dT%H%M%SZ")
        dtend = event.end_time.strftime("%Y%m%dT%H%M%SZ")
        dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        event_lines = [
            "BEGIN:VEVENT",
            f"UID:{event.id}@courseplatform.com",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{event.title}",
        ]

        if event.description:
            event_lines.append(f"DESCRIPTION:{event.description}")

        if hasattr(event, 'location') and event.location:
            event_lines.append(f"LOCATION:{event.location}")

        if hasattr(event, 'is_recurring') and event.is_recurring and event.recurrence_rule:
            # Simple RRULE implementation
            rrule_parts = []
            rule = event.recurrence_rule
            if rule.get('freq'):
                rrule_parts.append(f"FREQ={rule['freq']}")
            if rule.get('interval'):
                rrule_parts.append(f"INTERVAL={rule['interval']}")
            if rule.get('until'):
                rrule_parts.append(f"UNTIL={rule['until']}")
            if rrule_parts:
                event_lines.append(f"RRULE:{';'.join(rrule_parts)}")

        event_lines.append("END:VEVENT")
        ical_lines.extend(event_lines)

    ical_lines.append("END:VCALENDAR")
    return "\r\n".join(ical_lines)


async def schedule_event_reminders(db: AsyncSession, event: CalendarEvent):
    """Schedule reminders for an event"""
    if not event.reminder_enabled:
        return

    # Get course members (students)
    result = await db.execute(
        select(CourseMember).where(
            and_(CourseMember.course_id == event.course_id,
                 CourseMember.role == "student")
        )
    )
    members = result.scalars().all()

    # Calculate reminder time
    reminder_time = event.start_time - timedelta(minutes=event.reminder_minutes_before)

    for member in members:
        # Check if reminder already exists
        existing = await db.execute(
            select(EventReminder).where(
                and_(EventReminder.event_id == event.id,
                     EventReminder.user_id == member.user_id)
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Create reminder
        reminder = EventReminder(
            event_id=event.id,
            user_id=member.user_id,
            scheduled_time=reminder_time
        )
        db.add(reminder)

    await db.flush()


# Calendar Events (Course-level)
@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a calendar event (Instructor/Assistant only)"""
    await get_or_404(db, Course, event_data.course_id)

    # Validate time
    if event_data.end_time <= event_data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    event = CalendarEvent(
        **event_data.model_dump(),
        created_by=UUID(current_user["id"])
    )
    db.add(event)
    await db.flush()

    # Schedule reminders
    await schedule_event_reminders(db, event)

    # Notify students
    members = await db.execute(
        select(CourseMember).where(
            and_(CourseMember.course_id == event.course_id,
                 CourseMember.role == "student")
        )
    )
    for member in members.scalars().all():
        await create_notification(
            db=db,
            user_id=member.user_id,
            notification_type="calendar",
            title="새로운 일정",
            content=f"{event.title} - {event.start_time.strftime('%Y-%m-%d %H:%M')}"
        )

    await db.commit()
    await db.refresh(event)

    return event


@router.get("/events", response_model=List[CalendarEventResponse])
async def list_calendar_events(
    course_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    event_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List calendar events"""
    query = select(CalendarEvent).where(
        and_(CalendarEvent.is_deleted == False,
             CalendarEvent.is_visible == True)
    )

    if course_id:
        query = query.where(CalendarEvent.course_id == course_id)

    if start_date:
        query = query.where(CalendarEvent.end_time >= start_date)

    if end_date:
        query = query.where(CalendarEvent.start_time <= end_date)

    if event_type:
        query = query.where(CalendarEvent.event_type == event_type)

    query = query.order_by(CalendarEvent.start_time)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_calendar_event(
    event_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get calendar event details"""
    event = await get_or_404(db, CalendarEvent, event_id)
    return event


@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: UUID,
    event_data: CalendarEventUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update calendar event (Instructor/Assistant only)"""
    event = await get_or_404(db, CalendarEvent, event_id)

    # Validate time if both provided
    update_dict = event_data.model_dump(exclude_unset=True)
    start_time = update_dict.get('start_time', event.start_time)
    end_time = update_dict.get('end_time', event.end_time)

    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    update_model_from_schema(event, update_dict)
    await db.commit()
    await db.refresh(event)

    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    event_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Delete calendar event (Instructor/Assistant only)"""
    event = await get_or_404(db, CalendarEvent, event_id)
    event.is_deleted = True
    await db.commit()


# Personal Events
@router.post("/personal-events", response_model=PersonalEventResponse, status_code=status.HTTP_201_CREATED)
async def create_personal_event(
    event_data: PersonalEventCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a personal event"""
    if event_data.end_time <= event_data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    event = PersonalEvent(
        **event_data.model_dump(),
        user_id=UUID(current_user["id"])
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return event


@router.get("/personal-events", response_model=List[PersonalEventResponse])
async def list_personal_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List my personal events"""
    user_id = UUID(current_user["id"])

    query = select(PersonalEvent).where(
        and_(PersonalEvent.user_id == user_id,
             PersonalEvent.is_deleted == False)
    )

    if start_date:
        query = query.where(PersonalEvent.end_time >= start_date)

    if end_date:
        query = query.where(PersonalEvent.start_time <= end_date)

    query = query.order_by(PersonalEvent.start_time)

    result = await db.execute(query)
    return result.scalars().all()


@router.put("/personal-events/{event_id}", response_model=PersonalEventResponse)
async def update_personal_event(
    event_id: UUID,
    event_data: PersonalEventUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update personal event"""
    event = await get_or_404(db, PersonalEvent, event_id)

    # Verify ownership
    if event.user_id != UUID(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    update_dict = event_data.model_dump(exclude_unset=True)
    start_time = update_dict.get('start_time', event.start_time)
    end_time = update_dict.get('end_time', event.end_time)

    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    update_model_from_schema(event, update_dict)
    await db.commit()
    await db.refresh(event)

    return event


@router.delete("/personal-events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personal_event(
    event_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete personal event"""
    event = await get_or_404(db, PersonalEvent, event_id)

    # Verify ownership
    if event.user_id != UUID(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    event.is_deleted = True
    await db.commit()


# Combined Calendar View
@router.get("/view", response_model=CalendarView)
async def get_calendar_view(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    course_ids: Optional[str] = None,  # Comma-separated UUIDs
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get combined calendar view (course + personal events)"""
    user_id = UUID(current_user["id"])

    # Parse course IDs
    course_id_list = []
    if course_ids:
        try:
            course_id_list = [UUID(cid.strip()) for cid in course_ids.split(',')]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid course IDs format"
            )

    # Get course events
    course_query = select(CalendarEvent).where(
        and_(CalendarEvent.is_deleted == False,
             CalendarEvent.is_visible == True)
    )

    if course_id_list:
        course_query = course_query.where(CalendarEvent.course_id.in_(course_id_list))

    if start_date:
        course_query = course_query.where(CalendarEvent.end_time >= start_date)

    if end_date:
        course_query = course_query.where(CalendarEvent.start_time <= end_date)

    course_query = course_query.order_by(CalendarEvent.start_time)

    course_events_result = await db.execute(course_query)
    course_events = course_events_result.scalars().all()

    # Get personal events
    personal_query = select(PersonalEvent).where(
        and_(PersonalEvent.user_id == user_id,
             PersonalEvent.is_deleted == False)
    )

    if start_date:
        personal_query = personal_query.where(PersonalEvent.end_time >= start_date)

    if end_date:
        personal_query = personal_query.where(PersonalEvent.start_time <= end_date)

    personal_query = personal_query.order_by(PersonalEvent.start_time)

    personal_events_result = await db.execute(personal_query)
    personal_events = personal_events_result.scalars().all()

    return CalendarView(
        course_events=course_events,
        personal_events=personal_events
    )


# Event Attendees / RSVP
@router.post("/events/{event_id}/rsvp", response_model=EventAttendeeResponse)
async def rsvp_event(
    event_id: UUID,
    rsvp_data: EventAttendeeUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """RSVP to an event"""
    event = await get_or_404(db, CalendarEvent, event_id)
    user_id = UUID(current_user["id"])

    # Check if already RSVP'd
    result = await db.execute(
        select(EventAttendee).where(
            and_(EventAttendee.event_id == event_id,
                 EventAttendee.user_id == user_id)
        )
    )
    attendee = result.scalar_one_or_none()

    if attendee:
        # Update RSVP
        attendee.rsvp_status = rsvp_data.rsvp_status
        attendee.rsvp_at = datetime.utcnow()
    else:
        # Create new RSVP
        attendee = EventAttendee(
            event_id=event_id,
            user_id=user_id,
            rsvp_status=rsvp_data.rsvp_status,
            rsvp_at=datetime.utcnow()
        )
        db.add(attendee)

    await db.commit()
    await db.refresh(attendee)

    return attendee


@router.get("/events/{event_id}/attendees", response_model=List[EventAttendeeResponse])
async def get_event_attendees(
    event_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get event attendees"""
    await get_or_404(db, CalendarEvent, event_id)

    result = await db.execute(
        select(EventAttendee).where(EventAttendee.event_id == event_id)
    )
    return result.scalars().all()


# iCal Export
@router.get("/export/ical")
async def export_ical(
    course_ids: Optional[str] = None,
    include_personal: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export calendar to iCal format"""
    user_id = UUID(current_user["id"])
    all_events = []

    # Parse course IDs
    course_id_list = []
    if course_ids:
        try:
            course_id_list = [UUID(cid.strip()) for cid in course_ids.split(',')]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid course IDs format"
            )

    # Get course events
    course_query = select(CalendarEvent).where(
        and_(CalendarEvent.is_deleted == False,
             CalendarEvent.is_visible == True)
    )

    if course_id_list:
        course_query = course_query.where(CalendarEvent.course_id.in_(course_id_list))

    course_events_result = await db.execute(course_query)
    all_events.extend(course_events_result.scalars().all())

    # Get personal events
    if include_personal:
        personal_result = await db.execute(
            select(PersonalEvent).where(
                and_(PersonalEvent.user_id == user_id,
                     PersonalEvent.is_deleted == False)
            )
        )
        all_events.extend(personal_result.scalars().all())

    # Generate iCal
    ical_content = generate_ical(all_events, "Course Platform Calendar")

    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=calendar.ics"
        }
    )

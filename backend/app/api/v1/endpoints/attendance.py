"""
Attendance API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import secrets
import string

from ....core.database import get_db
from ....api.deps import get_current_user, require_course_member, require_instructor_or_assistant
from ....api.utils import get_or_404, update_model_from_schema, soft_delete
from ....models import AttendanceSession, AttendanceRecord, Course, CourseMember, UserProfile
from ....schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionUpdate,
    AttendanceSessionResponse,
    AttendanceCheckIn,
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
    AttendanceRecordResponse,
    AttendanceStats,
    StudentAttendanceStats,
)
from ....services.notification_service import create_notification

router = APIRouter()


def generate_qr_code() -> str:
    """Generate unique QR code for attendance session"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))


@router.post("/sessions", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance_session(
    session_data: AttendanceSessionCreate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new attendance session (Instructor/Assistant only)
    """
    # Verify course exists
    course = await get_or_404(db, Course, session_data.course_id)

    # Create QR code
    qr_code = generate_qr_code()

    # Create session
    session = AttendanceSession(
        **session_data.model_dump(exclude={'course_id'}),
        course_id=session_data.course_id,
        qr_code=qr_code,
        created_by=UUID(current_user["id"])
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Notify students about new attendance session
    # Get all course students
    query = select(CourseMember).where(
        and_(
            CourseMember.course_id == session_data.course_id,
            CourseMember.role == "student"
        )
    )
    result = await db.execute(query)
    members = result.scalars().all()

    # Create notifications
    for member in members:
        await create_notification(
            db=db,
            user_id=member.user_id,
            notification_type="attendance",
            title="새로운 출석 세션",
            content=f"{session.title} 출석 체크가 시작되었습니다.",
            link=f"/courses/{session_data.course_id}/attendance/{session.id}",
            related_id=str(session.id)
        )

    return session


@router.get("/sessions", response_model=List[AttendanceSessionResponse])
async def get_attendance_sessions(
    course_id: UUID,
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance sessions for a course
    """
    query = select(AttendanceSession).where(AttendanceSession.course_id == course_id)

    if not include_inactive:
        query = query.where(AttendanceSession.is_active == True)

    query = query.order_by(AttendanceSession.start_time.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    sessions = result.scalars().all()

    # Get statistics for each session
    response_sessions = []
    for session in sessions:
        # Count total students in course
        total_query = select(func.count(CourseMember.id)).where(
            and_(
                CourseMember.course_id == course_id,
                CourseMember.role == "student"
            )
        )
        total_result = await db.execute(total_query)
        total_students = total_result.scalar()

        # Count checked students
        checked_query = select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.session_id == session.id
        )
        checked_result = await db.execute(checked_query)
        checked_students = checked_result.scalar()

        # Count by status
        present_query = select(func.count(AttendanceRecord.id)).where(
            and_(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "present"
            )
        )
        present_result = await db.execute(present_query)
        present_count = present_result.scalar()

        late_query = select(func.count(AttendanceRecord.id)).where(
            and_(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "late"
            )
        )
        late_result = await db.execute(late_query)
        late_count = late_result.scalar()

        absent_count = total_students - checked_students

        session_dict = session.__dict__.copy()
        session_dict.update({
            'total_students': total_students,
            'checked_students': checked_students,
            'present_count': present_count,
            'late_count': late_count,
            'absent_count': absent_count
        })

        response_sessions.append(AttendanceSessionResponse(**session_dict))

    return response_sessions


@router.get("/sessions/{session_id}", response_model=AttendanceSessionResponse)
async def get_attendance_session(
    session_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance session details
    """
    session = await get_or_404(db, AttendanceSession, session_id)

    # Verify user is course member
    query = select(CourseMember).where(
        and_(
            CourseMember.course_id == session.course_id,
            CourseMember.user_id == UUID(current_user["id"])
        )
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this course"
        )

    return session


@router.put("/sessions/{session_id}", response_model=AttendanceSessionResponse)
async def update_attendance_session(
    session_id: UUID,
    session_data: AttendanceSessionUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """
    Update attendance session (Instructor/Assistant only)
    """
    session = await get_or_404(db, AttendanceSession, session_id)

    # Update fields
    session = await update_model_from_schema(session, session_data)

    await db.commit()
    await db.refresh(session)

    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance_session(
    session_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete attendance session (Instructor/Assistant only)
    """
    session = await get_or_404(db, AttendanceSession, session_id)

    await db.delete(session)
    await db.commit()


@router.post("/checkin", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
async def check_in(
    checkin_data: AttendanceCheckIn,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Student check-in for attendance
    """
    # Find session by QR code or password
    query = select(AttendanceSession)

    if checkin_data.qr_code:
        query = query.where(AttendanceSession.qr_code == checkin_data.qr_code)
    elif checkin_data.password:
        query = query.where(AttendanceSession.password == checkin_data.password)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code or password required"
        )

    query = query.where(AttendanceSession.is_active == True)
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid QR code or password"
        )

    # Check if session is still active (time-based)
    now = datetime.utcnow()
    if now < session.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance session has not started yet"
        )

    if now > session.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance session has ended"
        )

    # Verify student is course member
    query = select(CourseMember).where(
        and_(
            CourseMember.course_id == session.course_id,
            CourseMember.user_id == UUID(current_user["id"]),
            CourseMember.role == "student"
        )
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a student in this course"
        )

    # Check if already checked in
    query = select(AttendanceRecord).where(
        and_(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.student_id == UUID(current_user["id"])
        )
    )
    result = await db.execute(query)
    existing_record = result.scalar_one_or_none()

    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in for this session"
        )

    # Determine status (present or late)
    late_threshold = session.start_time.replace(
        minute=session.start_time.minute + session.allow_late_minutes
    )
    status_value = "late" if now > late_threshold else "present"

    # Create attendance record
    record = AttendanceRecord(
        session_id=session.id,
        student_id=UUID(current_user["id"]),
        checked_at=now,
        status=status_value,
        check_method="qr" if checkin_data.qr_code else "password",
        location=checkin_data.location,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return record


@router.get("/records", response_model=List[AttendanceRecordResponse])
async def get_attendance_records(
    session_id: UUID,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance records for a session (Instructor/Assistant only)
    """
    session = await get_or_404(db, AttendanceSession, session_id)

    query = select(AttendanceRecord).where(
        AttendanceRecord.session_id == session_id
    ).order_by(AttendanceRecord.checked_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    # Fetch student info
    response_records = []
    for record in records:
        student_query = select(UserProfile).where(UserProfile.id == record.student_id)
        student_result = await db.execute(student_query)
        student = student_result.scalar_one_or_none()

        record_dict = record.__dict__.copy()
        if student:
            record_dict['student_name'] = student.display_name
            record_dict['student_username'] = student.username

        response_records.append(AttendanceRecordResponse(**record_dict))

    return response_records


@router.get("/my-records", response_model=List[AttendanceRecordResponse])
async def get_my_attendance_records(
    course_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my attendance records for a course (Student view)
    """
    # Get all sessions for course
    sessions_query = select(AttendanceSession.id).where(
        AttendanceSession.course_id == course_id
    )
    sessions_result = await db.execute(sessions_query)
    session_ids = [row[0] for row in sessions_result.all()]

    # Get my records
    query = select(AttendanceRecord).where(
        and_(
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.student_id == UUID(current_user["id"])
        )
    ).order_by(AttendanceRecord.checked_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return records

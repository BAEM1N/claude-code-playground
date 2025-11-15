"""
Virtual Classroom API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime
import os
import uuid
import shutil

from ....db.session import get_db
from ....models.user import User
from ....models.virtual_classroom import (
    VirtualClassroom, ClassroomParticipant, WhiteboardStroke,
    SharedFile, ClassroomRecording
)
from ....schemas.virtual_classroom import (
    VirtualClassroomCreate, VirtualClassroomUpdate, VirtualClassroomResponse,
    VirtualClassroomDetail, ClassroomParticipantResponse, ClassroomParticipantUpdate,
    WhiteboardStrokeResponse, SharedFileResponse, ClassroomRecordingResponse,
    ClassroomStatistics, UserClassroomStats, ParticipantRole
)
from ....core.auth import get_current_user

router = APIRouter()

# File upload settings
UPLOAD_DIR = "uploads/classroom_files"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ===== Virtual Classroom Management =====

@router.post("/classrooms", response_model=VirtualClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    classroom_data: VirtualClassroomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new virtual classroom (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can create classrooms"
        )

    # Create classroom
    classroom = VirtualClassroom(
        title=classroom_data.title,
        description=classroom_data.description,
        host_id=current_user.id,
        course_id=classroom_data.course_id,
        scheduled_start=classroom_data.scheduled_start,
        scheduled_end=classroom_data.scheduled_end,
        max_participants=classroom_data.max_participants,
        settings=classroom_data.settings or {
            "enableChat": True,
            "enableWhiteboard": True,
            "enableScreenShare": True,
            "enableRecording": True
        }
    )

    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)

    # Add host as participant
    host_participant = ClassroomParticipant(
        classroom_id=classroom.id,
        user_id=current_user.id,
        role=ParticipantRole.HOST,
        is_online=False
    )
    db.add(host_participant)
    await db.commit()

    return classroom


@router.get("/classrooms", response_model=List[VirtualClassroomResponse])
async def list_classrooms(
    skip: int = 0,
    limit: int = 20,
    is_active: Optional[bool] = None,
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List virtual classrooms"""
    query = select(VirtualClassroom)

    # Filter by active status
    if is_active is not None:
        query = query.where(VirtualClassroom.is_active == is_active)

    # Filter by course
    if course_id:
        query = query.where(VirtualClassroom.course_id == course_id)

    # Students can only see their enrolled classrooms or public ones
    if current_user.role == "student":
        # Get classrooms where user is a participant
        participant_subquery = select(ClassroomParticipant.classroom_id).where(
            ClassroomParticipant.user_id == current_user.id
        )
        query = query.where(VirtualClassroom.id.in_(participant_subquery))

    query = query.order_by(VirtualClassroom.scheduled_start.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    classrooms = result.scalars().all()

    return classrooms


@router.get("/classrooms/{classroom_id}", response_model=VirtualClassroomDetail)
async def get_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get classroom details with participants"""
    result = await db.execute(
        select(VirtualClassroom).where(VirtualClassroom.id == classroom_id)
    )
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    # Get participants
    participants_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .order_by(ClassroomParticipant.joined_at.desc())
    )
    participants = participants_result.scalars().all()

    # Get recordings
    recordings_result = await db.execute(
        select(ClassroomRecording)
        .where(ClassroomRecording.classroom_id == classroom_id)
        .where(ClassroomRecording.is_available == True)
        .order_by(ClassroomRecording.created_at.desc())
    )
    recordings = recordings_result.scalars().all()

    # Count active participants
    active_count = sum(1 for p in participants if p.is_online)

    return {
        **classroom.__dict__,
        "participants": [
            {**p.__dict__, "user": None} for p in participants
        ],
        "active_participants_count": active_count,
        "recordings": recordings
    }


@router.put("/classrooms/{classroom_id}", response_model=VirtualClassroomResponse)
async def update_classroom(
    classroom_id: int,
    classroom_data: VirtualClassroomUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update classroom details (host only)"""
    result = await db.execute(
        select(VirtualClassroom).where(VirtualClassroom.id == classroom_id)
    )
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if classroom.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can update the classroom")

    # Update fields
    update_data = classroom_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classroom, field, value)

    await db.commit()
    await db.refresh(classroom)

    return classroom


@router.post("/classrooms/{classroom_id}/start", response_model=VirtualClassroomResponse)
async def start_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a classroom session (host only)"""
    result = await db.execute(
        select(VirtualClassroom).where(VirtualClassroom.id == classroom_id)
    )
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if classroom.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can start the classroom")

    if classroom.is_active:
        raise HTTPException(status_code=400, detail="Classroom is already active")

    classroom.is_active = True
    classroom.actual_start = datetime.utcnow()
    await db.commit()
    await db.refresh(classroom)

    return classroom


@router.post("/classrooms/{classroom_id}/end", response_model=VirtualClassroomResponse)
async def end_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """End a classroom session (host only)"""
    result = await db.execute(
        select(VirtualClassroom).where(VirtualClassroom.id == classroom_id)
    )
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if classroom.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can end the classroom")

    classroom.is_active = False
    classroom.actual_end = datetime.utcnow()
    classroom.is_recording = False

    # Mark all participants as offline
    participants_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .where(ClassroomParticipant.is_online == True)
    )
    participants = participants_result.scalars().all()

    for participant in participants:
        participant.is_online = False
        participant.left_at = datetime.utcnow()

    await db.commit()
    await db.refresh(classroom)

    return classroom


@router.delete("/classrooms/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a classroom (host only)"""
    result = await db.execute(
        select(VirtualClassroom).where(VirtualClassroom.id == classroom_id)
    )
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if classroom.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can delete the classroom")

    await db.delete(classroom)
    await db.commit()


# ===== Whiteboard =====

@router.get("/classrooms/{classroom_id}/whiteboard", response_model=List[WhiteboardStrokeResponse])
async def get_whiteboard_strokes(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all whiteboard strokes for a classroom"""
    # Verify participant
    participant_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .where(ClassroomParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this classroom")

    # Get strokes
    result = await db.execute(
        select(WhiteboardStroke)
        .where(WhiteboardStroke.classroom_id == classroom_id)
        .where(WhiteboardStroke.is_deleted == False)
        .order_by(WhiteboardStroke.stroke_order)
    )
    strokes = result.scalars().all()

    return strokes


# ===== File Sharing =====

@router.post("/classrooms/{classroom_id}/files", response_model=SharedFileResponse)
async def upload_file(
    classroom_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a file to share in classroom"""
    # Verify participant
    participant_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .where(ClassroomParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this classroom")

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE/1024/1024}MB limit")

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create database record
    shared_file = SharedFile(
        classroom_id=classroom_id,
        uploaded_by_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_path=file_path,
        description=description
    )

    db.add(shared_file)
    await db.commit()
    await db.refresh(shared_file)

    return shared_file


@router.get("/classrooms/{classroom_id}/files", response_model=List[SharedFileResponse])
async def list_files(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all shared files in classroom"""
    # Verify participant
    participant_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .where(ClassroomParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this classroom")

    # Get files
    result = await db.execute(
        select(SharedFile)
        .where(SharedFile.classroom_id == classroom_id)
        .where(SharedFile.is_available == True)
        .order_by(SharedFile.uploaded_at.desc())
    )
    files = result.scalars().all()

    return files


# ===== Recordings =====

@router.get("/classrooms/{classroom_id}/recordings", response_model=List[ClassroomRecordingResponse])
async def list_recordings(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all recordings for a classroom"""
    # Verify participant or host
    participant_result = await db.execute(
        select(ClassroomParticipant)
        .where(ClassroomParticipant.classroom_id == classroom_id)
        .where(ClassroomParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant of this classroom")

    # Get recordings
    result = await db.execute(
        select(ClassroomRecording)
        .where(ClassroomRecording.classroom_id == classroom_id)
        .where(ClassroomRecording.is_available == True)
        .order_by(ClassroomRecording.created_at.desc())
    )
    recordings = result.scalars().all()

    return recordings


# ===== Statistics =====

@router.get("/classrooms/stats/overview", response_model=ClassroomStatistics)
async def get_classroom_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall classroom statistics (admin/instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Total classrooms
    total_result = await db.execute(
        select(func.count(VirtualClassroom.id))
    )
    total_classrooms = total_result.scalar()

    # Active classrooms
    active_result = await db.execute(
        select(func.count(VirtualClassroom.id))
        .where(VirtualClassroom.is_active == True)
    )
    active_classrooms = active_result.scalar()

    # Total participants
    participants_result = await db.execute(
        select(func.count(ClassroomParticipant.id.distinct()))
    )
    total_participants = participants_result.scalar()

    # Total recordings
    recordings_result = await db.execute(
        select(func.count(ClassroomRecording.id))
        .where(ClassroomRecording.is_available == True)
    )
    total_recordings = recordings_result.scalar()

    # Total duration
    duration_result = await db.execute(
        select(func.sum(ClassroomRecording.duration))
        .where(ClassroomRecording.is_available == True)
    )
    total_duration = duration_result.scalar() or 0

    return {
        "total_classrooms": total_classrooms,
        "active_classrooms": active_classrooms,
        "total_participants": total_participants,
        "total_recordings": total_recordings,
        "total_duration_minutes": total_duration // 60
    }


@router.get("/classrooms/stats/my-stats", response_model=UserClassroomStats)
async def get_my_classroom_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's classroom statistics"""
    # Hosted classrooms
    hosted_result = await db.execute(
        select(func.count(VirtualClassroom.id))
        .where(VirtualClassroom.host_id == current_user.id)
    )
    hosted_classrooms = hosted_result.scalar()

    # Attended classrooms
    attended_result = await db.execute(
        select(func.count(ClassroomParticipant.id.distinct()))
        .where(ClassroomParticipant.user_id == current_user.id)
    )
    attended_classrooms = attended_result.scalar()

    # Total attendance time (placeholder - would need actual tracking)
    total_attendance_minutes = 0

    # Available recordings for user's classrooms
    if current_user.role == "instructor":
        recordings_result = await db.execute(
            select(func.count(ClassroomRecording.id))
            .join(VirtualClassroom, ClassroomRecording.classroom_id == VirtualClassroom.id)
            .where(VirtualClassroom.host_id == current_user.id)
            .where(ClassroomRecording.is_available == True)
        )
    else:
        recordings_result = await db.execute(
            select(func.count(ClassroomRecording.id.distinct()))
            .join(VirtualClassroom, ClassroomRecording.classroom_id == VirtualClassroom.id)
            .join(ClassroomParticipant, ClassroomParticipant.classroom_id == VirtualClassroom.id)
            .where(ClassroomParticipant.user_id == current_user.id)
            .where(ClassroomRecording.is_available == True)
        )

    recordings_available = recordings_result.scalar()

    return {
        "hosted_classrooms": hosted_classrooms,
        "attended_classrooms": attended_classrooms,
        "total_attendance_minutes": total_attendance_minutes,
        "recordings_available": recordings_available
    }

"""
Channel endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import require_course_member, require_instructor_or_assistant
from ....models.channel import Channel
from ....schemas.channel import Channel as ChannelSchema, ChannelCreate, ChannelUpdate

router = APIRouter()


@router.get("", response_model=List[ChannelSchema])
async def get_course_channels(
    course_id: UUID = Query(...),
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """Get channels for a course."""
    query = select(Channel).where(
        Channel.course_id == course_id,
        Channel.is_archived == False
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ChannelSchema, status_code=status.HTTP_201_CREATED)
async def create_channel(
    course_id: UUID = Query(...),
    channel_data: ChannelCreate = ...,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Create a new channel."""
    channel = Channel(
        **channel_data.dict(),
        course_id=course_id,
        created_by=UUID(current_user["id"])
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


@router.get("/{channel_id}", response_model=ChannelSchema)
async def get_channel(
    channel_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get channel details."""
    query = select(Channel).where(Channel.id == channel_id)
    result = await db.execute(query)
    channel = result.scalar_one_or_none()

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    return channel


@router.put("/{channel_id}", response_model=ChannelSchema)
async def update_channel(
    channel_id: UUID,
    channel_data: ChannelUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update channel."""
    query = select(Channel).where(Channel.id == channel_id)
    result = await db.execute(query)
    channel = result.scalar_one_or_none()

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    for field, value in channel_data.dict(exclude_unset=True).items():
        setattr(channel, field, value)

    await db.commit()
    await db.refresh(channel)
    return channel

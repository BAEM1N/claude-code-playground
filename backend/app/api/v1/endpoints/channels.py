"""
Channel endpoints - Refactored with helper functions.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import require_course_member, require_instructor_or_assistant
from ....api.utils.db_helpers import get_or_404, update_model_from_schema
from ....models.channel import Channel
from ....schemas.channel import Channel as ChannelSchema, ChannelCreate, ChannelUpdate

router = APIRouter()


@router.get("", response_model=List[ChannelSchema], status_code=status.HTTP_200_OK)
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


@router.get("/{channel_id}", response_model=ChannelSchema, status_code=status.HTTP_200_OK)
async def get_channel(
    channel_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get channel details."""
    # Use helper function
    channel = await get_or_404(db, Channel, channel_id, "Channel not found")
    return channel


@router.put("/{channel_id}", response_model=ChannelSchema, status_code=status.HTTP_200_OK)
async def update_channel(
    channel_id: UUID,
    channel_data: ChannelUpdate,
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """Update channel."""
    # Use helper functions
    channel = await get_or_404(db, Channel, channel_id, "Channel not found")
    channel = await update_model_from_schema(channel, channel_data)

    await db.commit()
    await db.refresh(channel)
    return channel

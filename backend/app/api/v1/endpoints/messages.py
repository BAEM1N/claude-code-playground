"""
Message endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import get_current_active_user
from ....models.message import Message, MessageReaction
from ....schemas.message import (
    Message as MessageSchema,
    MessageCreate,
    MessageUpdate
)

router = APIRouter()


@router.get("", response_model=List[MessageSchema])
async def get_channel_messages(
    channel_id: UUID = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get messages for a channel."""
    query = (
        select(Message)
        .where(
            Message.channel_id == channel_id,
            Message.is_deleted == False,
            Message.parent_message_id == None  # Only root messages
        )
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=MessageSchema, status_code=201)
async def create_message(
    channel_id: UUID = Query(...),
    message_data: MessageCreate = ...,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new message."""
    message = Message(
        **message_data.dict(),
        channel_id=channel_id,
        user_id=UUID(current_user["id"])
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.get("/{message_id}/thread", response_model=List[MessageSchema])
async def get_message_thread(
    message_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get thread (replies) for a message."""
    query = (
        select(Message)
        .where(
            Message.parent_message_id == message_id,
            Message.is_deleted == False
        )
        .order_by(Message.created_at.asc())
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{message_id}", response_model=MessageSchema)
async def update_message(
    message_id: UUID,
    message_data: MessageUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update message."""
    query = select(Message).where(Message.id == message_id)
    result = await db.execute(query)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if str(message.user_id) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    message.content = message_data.content
    message.is_edited = True

    await db.commit()
    await db.refresh(message)
    return message


@router.delete("/{message_id}", status_code=204)
async def delete_message(
    message_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete message (soft delete)."""
    query = select(Message).where(Message.id == message_id)
    result = await db.execute(query)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if str(message.user_id) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    message.is_deleted = True
    await db.commit()


@router.post("/{message_id}/reactions", status_code=201)
async def add_reaction(
    message_id: UUID,
    emoji: str = Query(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add reaction to message."""
    # Check if reaction already exists
    query = select(MessageReaction).where(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == UUID(current_user["id"]),
        MessageReaction.emoji == emoji
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        return {"message": "Reaction already exists"}

    reaction = MessageReaction(
        message_id=message_id,
        user_id=UUID(current_user["id"]),
        emoji=emoji
    )
    db.add(reaction)
    await db.commit()
    return {"message": "Reaction added"}


@router.delete("/{message_id}/reactions/{emoji}", status_code=204)
async def remove_reaction(
    message_id: UUID,
    emoji: str,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove reaction from message."""
    query = select(MessageReaction).where(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == UUID(current_user["id"]),
        MessageReaction.emoji == emoji
    )
    result = await db.execute(query)
    reaction = result.scalar_one_or_none()

    if reaction:
        await db.delete(reaction)
        await db.commit()

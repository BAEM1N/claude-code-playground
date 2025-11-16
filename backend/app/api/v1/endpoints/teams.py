"""
Team Chat/Messaging API Endpoints
팀 채팅/메시지 시스템 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, update
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from ....db.session import get_db
from ....core.deps import get_current_active_user
from ....models.gamification import (
    Team,
    TeamMember,
    TeamMessage,
    TeamMessageRead,
)
from ....models.user import UserProfile
from ....services.notification_service import NotificationService

router = APIRouter()


# ==================== Team Message Endpoints ====================

@router.get("/{team_id}/messages")
async def get_team_messages(
    team_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    before_message_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get team messages with pagination.

    Args:
        team_id: Team ID
        skip: Number of messages to skip
        limit: Maximum number of messages to return
        before_message_id: Get messages before this message (for pagination)

    Returns:
        List of messages with user info
    """
    user_id = UUID(current_user["id"])

    # Check if user is a team member
    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
    )
    member = member_result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # Build query
    query = (
        select(TeamMessage)
        .options(
            joinedload(TeamMessage.user).joinedload(UserProfile.user_profile)
        )
        .where(
            TeamMessage.team_id == team_id,
            TeamMessage.is_deleted == False
        )
        .order_by(desc(TeamMessage.created_at))
    )

    # Add before_message_id filter if provided
    if before_message_id:
        before_msg_result = await db.execute(
            select(TeamMessage.created_at).where(TeamMessage.id == before_message_id)
        )
        before_timestamp = before_msg_result.scalar_one_or_none()
        if before_timestamp:
            query = query.where(TeamMessage.created_at < before_timestamp)

    # Apply pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()

    # Update read status
    if messages:
        await _update_read_status(db, user_id, team_id, messages[0].id)

    # Format response
    return [
        {
            "id": str(msg.id),
            "team_id": str(msg.team_id),
            "user_id": str(msg.user_id),
            "user": {
                "id": str(msg.user.id),
                "email": msg.user.email if hasattr(msg.user, 'email') else None,
                "full_name": msg.user.user_profile.full_name if msg.user.user_profile else None,
            },
            "message_type": msg.message_type,
            "content": msg.content,
            "metadata": msg.metadata,
            "reply_to_id": str(msg.reply_to_id) if msg.reply_to_id else None,
            "reactions": msg.reactions or {},
            "is_edited": msg.is_edited,
            "is_pinned": msg.is_pinned,
            "created_at": msg.created_at.isoformat(),
            "updated_at": msg.updated_at.isoformat() if msg.updated_at else None,
        }
        for msg in reversed(messages)  # Reverse to show oldest first
    ]


@router.post("/{team_id}/messages")
async def send_team_message(
    team_id: UUID,
    content: str = Query(..., min_length=1, max_length=5000),
    message_type: str = Query("text"),
    reply_to_id: Optional[UUID] = Query(None),
    metadata: Optional[dict] = None,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message to a team.

    Args:
        team_id: Team ID
        content: Message content
        message_type: Message type (text, image, file, system)
        reply_to_id: Optional message ID this is replying to
        metadata: Optional metadata (file URLs, mentions, etc.)

    Returns:
        Created message
    """
    user_id = UUID(current_user["id"])

    # Check if user is a team member
    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
    )
    member = member_result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # Create message
    message = TeamMessage(
        team_id=team_id,
        user_id=user_id,
        message_type=message_type,
        content=content,
        reply_to_id=reply_to_id,
        metadata=metadata or {}
    )

    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Load user relationship
    await db.refresh(message, ["user"])

    # Send notifications to team members
    team_members_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id != user_id,  # Don't notify sender
            TeamMember.is_active == True
        )
    )
    team_members = team_members_result.scalars().all()

    for tm in team_members:
        await NotificationService.create_notification(
            db=db,
            user_id=tm.user_id,
            notification_type="team_message",
            title=f"팀 메시지",
            content=f"{content[:50]}..." if len(content) > 50 else content,
            priority="normal",
            icon="💬",
            action_url=f"/teams/{team_id}/chat"
        )

    await db.commit()

    # Format response
    return {
        "id": str(message.id),
        "team_id": str(message.team_id),
        "user_id": str(message.user_id),
        "user": {
            "id": str(message.user.id),
            "email": message.user.email if hasattr(message.user, 'email') else None,
        },
        "message_type": message.message_type,
        "content": message.content,
        "metadata": message.metadata,
        "reply_to_id": str(message.reply_to_id) if message.reply_to_id else None,
        "reactions": message.reactions or {},
        "is_edited": message.is_edited,
        "is_pinned": message.is_pinned,
        "created_at": message.created_at.isoformat(),
        "updated_at": message.updated_at.isoformat() if message.updated_at else None,
    }


@router.put("/{team_id}/messages/{message_id}")
async def edit_team_message(
    team_id: UUID,
    message_id: UUID,
    content: str = Query(..., min_length=1, max_length=5000),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Edit a team message.

    Args:
        team_id: Team ID
        message_id: Message ID
        content: New message content

    Returns:
        Updated message
    """
    user_id = UUID(current_user["id"])

    # Get message
    result = await db.execute(
        select(TeamMessage).where(
            TeamMessage.id == message_id,
            TeamMessage.team_id == team_id,
            TeamMessage.is_deleted == False
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Check if user is the message author
    if message.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages"
        )

    # Update message
    message.content = content
    message.is_edited = True
    message.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(message)

    return {
        "id": str(message.id),
        "content": message.content,
        "is_edited": message.is_edited,
        "updated_at": message.updated_at.isoformat()
    }


@router.delete("/{team_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team_message(
    team_id: UUID,
    message_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a team message (soft delete).

    Args:
        team_id: Team ID
        message_id: Message ID
    """
    user_id = UUID(current_user["id"])

    # Get message
    result = await db.execute(
        select(TeamMessage).where(
            TeamMessage.id == message_id,
            TeamMessage.team_id == team_id,
            TeamMessage.is_deleted == False
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Check permissions (author or team admin)
    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
    )
    member = member_result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # Only message author or team admin/owner can delete
    if message.user_id != user_id and member.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this message"
        )

    # Soft delete
    message.is_deleted = True
    message.deleted_at = datetime.utcnow()

    await db.commit()


@router.post("/{team_id}/messages/{message_id}/reactions")
async def add_message_reaction(
    team_id: UUID,
    message_id: UUID,
    emoji: str = Query(..., min_length=1, max_length=10),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a reaction to a message.

    Args:
        team_id: Team ID
        message_id: Message ID
        emoji: Emoji reaction

    Returns:
        Updated reactions
    """
    user_id = UUID(current_user["id"])

    # Check team membership
    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # Get message
    result = await db.execute(
        select(TeamMessage).where(
            TeamMessage.id == message_id,
            TeamMessage.team_id == team_id,
            TeamMessage.is_deleted == False
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Add reaction
    reactions = message.reactions or {}
    user_id_str = str(user_id)

    if emoji not in reactions:
        reactions[emoji] = []

    if user_id_str not in reactions[emoji]:
        reactions[emoji].append(user_id_str)

    message.reactions = reactions
    await db.commit()

    return {"reactions": reactions}


@router.delete("/{team_id}/messages/{message_id}/reactions/{emoji}")
async def remove_message_reaction(
    team_id: UUID,
    message_id: UUID,
    emoji: str,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a reaction from a message.

    Args:
        team_id: Team ID
        message_id: Message ID
        emoji: Emoji reaction to remove

    Returns:
        Updated reactions
    """
    user_id = UUID(current_user["id"])

    # Get message
    result = await db.execute(
        select(TeamMessage).where(
            TeamMessage.id == message_id,
            TeamMessage.team_id == team_id,
            TeamMessage.is_deleted == False
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Remove reaction
    reactions = message.reactions or {}
    user_id_str = str(user_id)

    if emoji in reactions and user_id_str in reactions[emoji]:
        reactions[emoji].remove(user_id_str)
        if not reactions[emoji]:  # Remove emoji key if no users
            del reactions[emoji]

    message.reactions = reactions
    await db.commit()

    return {"reactions": reactions}


@router.get("/{team_id}/unread-count")
async def get_unread_message_count(
    team_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get unread message count for a team.

    Args:
        team_id: Team ID

    Returns:
        Unread count
    """
    user_id = UUID(current_user["id"])

    # Get read status
    result = await db.execute(
        select(TeamMessageRead).where(
            TeamMessageRead.team_id == team_id,
            TeamMessageRead.user_id == user_id
        )
    )
    read_status = result.scalar_one_or_none()

    if not read_status or not read_status.last_read_message_id:
        # Count all messages
        count_result = await db.execute(
            select(func.count(TeamMessage.id)).where(
                TeamMessage.team_id == team_id,
                TeamMessage.is_deleted == False
            )
        )
        count = count_result.scalar()
    else:
        # Count messages after last read
        last_read_result = await db.execute(
            select(TeamMessage.created_at).where(
                TeamMessage.id == read_status.last_read_message_id
            )
        )
        last_read_time = last_read_result.scalar_one_or_none()

        if last_read_time:
            count_result = await db.execute(
                select(func.count(TeamMessage.id)).where(
                    TeamMessage.team_id == team_id,
                    TeamMessage.created_at > last_read_time,
                    TeamMessage.is_deleted == False
                )
            )
            count = count_result.scalar()
        else:
            count = 0

    return {"unread_count": count}


# ==================== Helper Functions ====================

async def _update_read_status(
    db: AsyncSession,
    user_id: UUID,
    team_id: UUID,
    last_message_id: UUID
):
    """Update user's read status for a team"""
    result = await db.execute(
        select(TeamMessageRead).where(
            TeamMessageRead.team_id == team_id,
            TeamMessageRead.user_id == user_id
        )
    )
    read_status = result.scalar_one_or_none()

    if not read_status:
        read_status = TeamMessageRead(
            team_id=team_id,
            user_id=user_id,
            last_read_message_id=last_message_id,
            unread_count=0
        )
        db.add(read_status)
    else:
        read_status.last_read_message_id = last_message_id
        read_status.last_read_at = datetime.utcnow()
        read_status.unread_count = 0

    await db.commit()

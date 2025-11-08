"""
Message schemas.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class MessageBase(BaseModel):
    """Base message schema."""

    content: str = Field(..., min_length=1)
    parent_message_id: Optional[UUID] = None


class MessageCreate(MessageBase):
    """Schema for creating message."""

    pass


class MessageUpdate(BaseModel):
    """Schema for updating message."""

    content: str = Field(..., min_length=1)


class MessageReaction(BaseModel):
    """Schema for message reaction."""

    id: UUID
    message_id: UUID
    user_id: UUID
    emoji: str
    created_at: datetime

    class Config:
        from_attributes = True


class Mention(BaseModel):
    """Schema for mention."""

    id: UUID
    message_id: UUID
    user_id: UUID
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True


class Message(MessageBase):
    """Schema for message response."""

    id: UUID
    channel_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    is_edited: bool
    is_deleted: bool
    is_pinned: bool
    reactions: List[MessageReaction] = []

    class Config:
        from_attributes = True

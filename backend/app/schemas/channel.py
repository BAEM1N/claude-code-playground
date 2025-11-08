"""
Channel schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class ChannelBase(BaseModel):
    """Base channel schema."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    type: str = Field(..., pattern="^(public|private|dm)$")


class ChannelCreate(ChannelBase):
    """Schema for creating channel."""

    pass


class ChannelUpdate(BaseModel):
    """Schema for updating channel."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_archived: Optional[bool] = None


class Channel(ChannelBase):
    """Schema for channel response."""

    id: UUID
    course_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    is_archived: bool

    class Config:
        from_attributes = True

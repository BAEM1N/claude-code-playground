"""
Notification schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class NotificationBase(BaseModel):
    """Base notification schema."""

    type: str = Field(..., pattern="^(mention|file_upload|assignment|announcement)$")
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    link: Optional[str] = None
    related_id: Optional[UUID] = None


class NotificationCreate(NotificationBase):
    """Schema for creating notification."""

    user_id: UUID


class Notification(NotificationBase):
    """Schema for notification response."""

    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnnouncementBase(BaseModel):
    """Base announcement schema."""

    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    channel_id: Optional[UUID] = None
    is_pinned: bool = False


class AnnouncementCreate(AnnouncementBase):
    """Schema for creating announcement."""

    pass


class Announcement(AnnouncementBase):
    """Schema for announcement response."""

    id: UUID
    course_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

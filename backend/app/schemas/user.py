"""
User schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class UserProfileBase(BaseModel):
    """Base user profile schema."""

    username: str = Field(..., min_length=3, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    """Schema for creating user profile."""

    id: UUID  # From Supabase auth


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""

    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserProfile(UserProfileBase):
    """Schema for user profile response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

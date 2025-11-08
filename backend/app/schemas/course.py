"""
Course schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class CourseBase(BaseModel):
    """Base course schema."""

    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    code: Optional[str] = Field(None, max_length=50)


class CourseCreate(CourseBase):
    """Schema for creating course."""

    pass


class CourseUpdate(BaseModel):
    """Schema for updating course."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    code: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class Course(CourseBase):
    """Schema for course response."""

    id: UUID
    instructor_id: UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class CourseMemberBase(BaseModel):
    """Base course member schema."""

    role: str = Field(..., pattern="^(instructor|assistant|student)$")


class CourseMemberCreate(CourseMemberBase):
    """Schema for adding course member."""

    user_id: UUID


class CourseMember(CourseMemberBase):
    """Schema for course member response."""

    id: UUID
    course_id: UUID
    user_id: UUID
    joined_at: datetime

    class Config:
        from_attributes = True

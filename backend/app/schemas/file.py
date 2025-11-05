"""
File schemas.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class FolderBase(BaseModel):
    """Base folder schema."""

    name: str = Field(..., min_length=1, max_length=255)
    parent_folder_id: Optional[UUID] = None


class FolderCreate(FolderBase):
    """Schema for creating folder."""

    pass


class Folder(FolderBase):
    """Schema for folder response."""

    id: UUID
    course_id: UUID
    created_by: UUID
    created_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class FileBase(BaseModel):
    """Base file schema."""

    original_name: str = Field(..., min_length=1, max_length=255)
    folder_id: Optional[UUID] = None


class FileCreate(FileBase):
    """Schema for creating file."""

    pass


class FileUpdate(BaseModel):
    """Schema for updating file."""

    original_name: Optional[str] = Field(None, min_length=1, max_length=255)
    folder_id: Optional[UUID] = None


class FileTag(BaseModel):
    """Schema for file tag."""

    id: UUID
    file_id: UUID
    tag: str
    created_at: datetime

    class Config:
        from_attributes = True


class File(FileBase):
    """Schema for file response."""

    id: UUID
    course_id: UUID
    uploaded_by: UUID
    stored_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    version: int
    parent_file_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    tags: List[FileTag] = []

    class Config:
        from_attributes = True

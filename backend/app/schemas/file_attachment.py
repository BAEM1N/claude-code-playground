"""
Pydantic schemas for file attachments.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FileAttachmentResponse(BaseModel):
    """Response for file attachment operations."""
    message: str
    file_id: UUID
    filename: str
    file_path: str

    class Config:
        from_attributes = True


class AssignmentFileInfo(BaseModel):
    """Assignment file information."""
    id: UUID
    filename: str
    file_size: int
    mime_type: Optional[str] = None
    file_type: str = Field(..., description="Type: material, solution, or rubric")
    created_at: datetime
    download_url: str

    class Config:
        from_attributes = True


class SubmissionFileInfo(BaseModel):
    """Submission file information."""
    id: UUID
    filename: str
    file_size: int
    mime_type: Optional[str] = None
    created_at: datetime
    download_url: str

    class Config:
        from_attributes = True

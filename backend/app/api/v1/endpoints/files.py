"""
File endpoints - Refactored with helper functions and service layer.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import io

from ....core.database import get_db
from ....api.deps import get_current_active_user, require_course_member
from ....api.utils.db_helpers import get_or_404, soft_delete
from ....models.file import File, Folder, FileTag
from ....schemas.file import (
    File as FileSchema,
    Folder as FolderSchema,
    FolderCreate
)
from ....services.storage_service import storage_service
from ....services.file_service import file_service

router = APIRouter()


# ==================== Folder Endpoints ====================

@router.get("/folders", response_model=List[FolderSchema], status_code=status.HTTP_200_OK)
async def get_course_folders(
    course_id: UUID = Query(...),
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """Get folders for a course."""
    query = select(Folder).where(
        Folder.course_id == course_id,
        Folder.is_deleted == False
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/folders", response_model=FolderSchema, status_code=status.HTTP_201_CREATED)
async def create_folder(
    course_id: UUID = Query(...),
    folder_data: FolderCreate = ...,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new folder."""
    folder = Folder(
        **folder_data.dict(),
        course_id=course_id,
        created_by=UUID(current_user["id"])
    )
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return folder


# ==================== File Endpoints ====================

@router.get("", response_model=List[FileSchema], status_code=status.HTTP_200_OK)
async def get_course_files(
    course_id: UUID = Query(...),
    folder_id: UUID = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """Get files for a course."""
    query = select(File).where(
        File.course_id == course_id,
        File.is_deleted == False
    )

    if folder_id:
        query = query.where(File.folder_id == folder_id)

    query = query.order_by(File.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=FileSchema, status_code=status.HTTP_201_CREATED)
async def upload_file(
    course_id: UUID = Query(...),
    folder_id: UUID = Query(None),
    file: UploadFile = FastAPIFile(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file using FileService.

    Returns:
        File: Created file record
    """
    # Use FileService for centralized file handling
    db_file = await file_service.create_and_upload_file(
        db=db,
        file=file,
        course_id=course_id,
        uploaded_by=UUID(current_user["id"]),
        folder="shared",
        folder_id=folder_id
    )

    await db.commit()
    await db.refresh(db_file)

    return db_file


@router.get("/{file_id}", response_model=FileSchema, status_code=status.HTTP_200_OK)
async def get_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get file details."""
    # Use helper function instead of manual query + check
    file = await get_or_404(db, File, file_id, "File not found")
    return file


@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a file."""
    # Use helper function
    file = await get_or_404(db, File, file_id, "File not found")

    # Get file from MinIO
    file_data = storage_service.download_file(file.file_path)

    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=file.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={file.original_name}"
        }
    )


@router.get("/{file_id}/preview", status_code=status.HTTP_200_OK)
async def get_file_preview_url(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get presigned URL for file preview."""
    # Use helper function
    file = await get_or_404(db, File, file_id, "File not found")

    # Get presigned URL
    url = storage_service.get_presigned_url(file.file_path)

    return {"url": url}


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete file using soft delete."""
    # Use helper function
    file = await get_or_404(db, File, file_id, "File not found")

    # Use soft delete helper
    await soft_delete(db, file)


@router.get("/{file_id}/versions", response_model=List[FileSchema], status_code=status.HTTP_200_OK)
async def get_file_versions(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all versions of a file."""
    # Verify parent file exists
    await get_or_404(db, File, file_id, "File not found")

    query = (
        select(File)
        .where(File.parent_file_id == file_id)
        .order_by(File.version.desc())
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{file_id}/tags", status_code=status.HTTP_201_CREATED)
async def add_file_tag(
    file_id: UUID,
    tag: str = Query(..., min_length=1, max_length=50, regex="^[a-zA-Z0-9_-]+$"),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add tag to file.

    Tags must be 1-50 characters and contain only alphanumeric characters, hyphens, and underscores.
    """
    # Verify file exists
    await get_or_404(db, File, file_id, "File not found")

    # Normalize tag (lowercase for consistency)
    normalized_tag = tag.lower().strip()

    file_tag = FileTag(
        file_id=file_id,
        tag=normalized_tag
    )
    db.add(file_tag)

    try:
        await db.commit()
        return {"message": "Tag added successfully", "tag": normalized_tag}
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists or invalid"
        )

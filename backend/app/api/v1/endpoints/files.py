"""
File endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import io

from ....core.database import get_db
from ....api.deps import get_current_active_user, require_course_member
from ....models.file import File, Folder, FileTag
from ....schemas.file import (
    File as FileSchema,
    Folder as FolderSchema,
    FolderCreate
)
from ....services.storage_service import storage_service

router = APIRouter()


# Folder endpoints
@router.get("/folders", response_model=List[FolderSchema])
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


@router.post("/folders", response_model=FolderSchema, status_code=201)
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


# File endpoints
@router.get("", response_model=List[FileSchema])
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


@router.post("", response_model=FileSchema, status_code=201)
async def upload_file(
    course_id: UUID = Query(...),
    folder_id: UUID = Query(None),
    file: UploadFile = FastAPIFile(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a file."""
    # Upload to MinIO
    file_path = storage_service.upload_file(
        file.file,
        file.filename,
        str(course_id),
        folder="shared",
        content_type=file.content_type
    )

    # Create database record
    db_file = File(
        course_id=course_id,
        folder_id=folder_id,
        uploaded_by=UUID(current_user["id"]),
        original_name=file.filename,
        stored_name=file_path.split("/")[-1],
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type
    )

    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    return db_file


@router.get("/{file_id}", response_model=FileSchema)
async def get_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get file details."""
    query = select(File).where(File.id == file_id)
    result = await db.execute(query)
    file = result.scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    return file


@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a file."""
    query = select(File).where(File.id == file_id)
    result = await db.execute(query)
    file = result.scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Get file from MinIO
    file_data = storage_service.download_file(file.file_path)

    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=file.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={file.original_name}"
        }
    )


@router.get("/{file_id}/preview")
async def get_file_preview_url(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get presigned URL for file preview."""
    query = select(File).where(File.id == file_id)
    result = await db.execute(query)
    file = result.scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Get presigned URL
    url = storage_service.get_presigned_url(file.file_path)

    return {"url": url}


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete file (soft delete)."""
    query = select(File).where(File.id == file_id)
    result = await db.execute(query)
    file = result.scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.is_deleted = True
    await db.commit()


@router.get("/{file_id}/versions", response_model=List[FileSchema])
async def get_file_versions(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all versions of a file."""
    query = (
        select(File)
        .where(File.parent_file_id == file_id)
        .order_by(File.version.desc())
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{file_id}/tags", status_code=201)
async def add_file_tag(
    file_id: UUID,
    tag: str = Query(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add tag to file."""
    file_tag = FileTag(
        file_id=file_id,
        tag=tag
    )
    db.add(file_tag)

    try:
        await db.commit()
        return {"message": "Tag added"}
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Tag already exists")

"""
File management service for centralized file operations.

This service provides a unified interface for file upload, download,
and management operations across the application.
"""
from typing import Optional
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.services.storage_service import storage_service


class FileService:
    """Service for file management operations."""

    @staticmethod
    async def create_and_upload_file(
        db: AsyncSession,
        file: UploadFile,
        course_id: UUID,
        uploaded_by: UUID,
        folder: str = "shared",
        folder_id: Optional[UUID] = None
    ) -> FileModel:
        """
        Upload file to storage and create database record.

        This method handles both the physical file upload to MinIO storage
        and the creation of the corresponding database record.

        Args:
            db: Database session
            file: Uploaded file from FastAPI
            course_id: Course ID the file belongs to
            uploaded_by: User ID who uploaded the file
            folder: Storage folder path (default: "shared")
            folder_id: Optional folder ID in database

        Returns:
            Created file model instance

        Raises:
            Exception: If file upload or database operation fails

        Example:
            >>> db_file = await FileService.create_and_upload_file(
            ...     db=db,
            ...     file=file,
            ...     course_id=course_id,
            ...     uploaded_by=current_user["id"],
            ...     folder="assignments"
            ... )
        """
        # Upload to MinIO storage
        file_path = storage_service.upload_file(
            file.file,
            file.filename,
            str(course_id),
            folder=folder,
            content_type=file.content_type
        )

        # Create database record
        db_file = FileModel(
            course_id=course_id,
            folder_id=folder_id,
            uploaded_by=uploaded_by,
            original_name=file.filename,
            stored_name=file_path.split("/")[-1],
            file_path=file_path,
            file_size=file.size,
            mime_type=file.content_type
        )

        db.add(db_file)
        await db.flush()

        return db_file

    @staticmethod
    async def create_assignment_file(
        db: AsyncSession,
        file: UploadFile,
        course_id: UUID,
        uploaded_by: UUID,
        file_type: str = "material"
    ) -> FileModel:
        """
        Upload file for assignment with specific folder structure.

        Args:
            db: Database session
            file: Uploaded file
            course_id: Course ID
            uploaded_by: User ID
            file_type: Type of file (material, solution, rubric)

        Returns:
            Created file model instance

        Example:
            >>> db_file = await FileService.create_assignment_file(
            ...     db=db,
            ...     file=file,
            ...     course_id=course_id,
            ...     uploaded_by=user_id,
            ...     file_type="material"
            ... )
        """
        folder_mapping = {
            "material": "assignments/materials",
            "solution": "assignments/solutions",
            "rubric": "assignments/rubrics"
        }

        folder = folder_mapping.get(file_type, "assignments/other")

        return await FileService.create_and_upload_file(
            db=db,
            file=file,
            course_id=course_id,
            uploaded_by=uploaded_by,
            folder=folder
        )

    @staticmethod
    async def create_submission_file(
        db: AsyncSession,
        file: UploadFile,
        course_id: UUID,
        uploaded_by: UUID
    ) -> FileModel:
        """
        Upload file for student submission.

        Args:
            db: Database session
            file: Uploaded file
            course_id: Course ID
            uploaded_by: Student user ID

        Returns:
            Created file model instance

        Example:
            >>> db_file = await FileService.create_submission_file(
            ...     db=db,
            ...     file=file,
            ...     course_id=course_id,
            ...     uploaded_by=student_id
            ... )
        """
        return await FileService.create_and_upload_file(
            db=db,
            file=file,
            course_id=course_id,
            uploaded_by=uploaded_by,
            folder="submissions"
        )

    @staticmethod
    def get_download_url(file_path: str) -> str:
        """
        Get download URL for a file.

        Args:
            file_path: File path in storage

        Returns:
            Download URL

        Example:
            >>> url = FileService.get_download_url(db_file.file_path)
        """
        return storage_service.get_download_url(file_path)

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from storage.

        Args:
            file_path: File path in storage

        Returns:
            True if successful

        Example:
            >>> success = FileService.delete_file(db_file.file_path)
        """
        return storage_service.delete_file(file_path)


# Create singleton instance
file_service = FileService()

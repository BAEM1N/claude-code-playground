"""
MinIO object storage service.
"""
from typing import Optional, BinaryIO
from datetime import timedelta
import uuid
from pathlib import Path
from minio import Minio
from minio.error import S3Error
from ..core.config import settings


class StorageService:
    """MinIO storage service for file management."""

    def __init__(self):
        """Initialize MinIO client."""
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def ensure_bucket(self):
        """Ensure bucket exists, create if not."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            print(f"Error ensuring bucket: {e}")
            raise

    def upload_file(
        self,
        file: BinaryIO,
        file_name: str,
        course_id: str,
        folder: str = "shared",
        content_type: Optional[str] = None,
    ) -> str:
        """
        Upload file to MinIO.

        Args:
            file: File object
            file_name: Original file name
            course_id: Course ID
            folder: Folder name (materials, assignments, submissions, shared)
            content_type: MIME type

        Returns:
            str: File path in storage
        """
        try:
            # Generate unique file name
            file_extension = Path(file_name).suffix
            stored_name = f"{uuid.uuid4()}{file_extension}"

            # Construct object path
            object_path = f"{course_id}/{folder}/{stored_name}"

            # Get file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning

            # Upload file
            self.client.put_object(
                self.bucket_name,
                object_path,
                file,
                length=file_size,
                content_type=content_type,
            )

            return object_path

        except S3Error as e:
            print(f"Error uploading file: {e}")
            raise

    def download_file(self, file_path: str) -> bytes:
        """
        Download file from MinIO.

        Args:
            file_path: Path to file in storage

        Returns:
            bytes: File content
        """
        try:
            response = self.client.get_object(self.bucket_name, file_path)
            data = response.read()
            response.close()
            response.release_conn()
            return data

        except S3Error as e:
            print(f"Error downloading file: {e}")
            raise

    def get_presigned_url(
        self,
        file_path: str,
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Get presigned URL for file access.

        Args:
            file_path: Path to file in storage
            expires: URL expiration time

        Returns:
            str: Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                file_path,
                expires=expires,
            )
            return url

        except S3Error as e:
            print(f"Error getting presigned URL: {e}")
            raise

    def get_presigned_upload_url(
        self,
        file_path: str,
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Get presigned URL for file upload.

        Args:
            file_path: Path to file in storage
            expires: URL expiration time

        Returns:
            str: Presigned upload URL
        """
        try:
            url = self.client.presigned_put_object(
                self.bucket_name,
                file_path,
                expires=expires,
            )
            return url

        except S3Error as e:
            print(f"Error getting presigned upload URL: {e}")
            raise

    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from MinIO.

        Args:
            file_path: Path to file in storage

        Returns:
            bool: True if successful
        """
        try:
            self.client.remove_object(self.bucket_name, file_path)
            return True

        except S3Error as e:
            print(f"Error deleting file: {e}")
            return False

    def list_files(self, prefix: str) -> list:
        """
        List files in folder.

        Args:
            prefix: Folder prefix

        Returns:
            list: List of file objects
        """
        try:
            objects = self.client.list_objects(
                self.bucket_name,
                prefix=prefix,
                recursive=True,
            )
            return [obj for obj in objects]

        except S3Error as e:
            print(f"Error listing files: {e}")
            return []

    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists.

        Args:
            file_path: Path to file in storage

        Returns:
            bool: True if file exists
        """
        try:
            self.client.stat_object(self.bucket_name, file_path)
            return True
        except S3Error:
            return False


# Global storage service instance
storage_service = StorageService()

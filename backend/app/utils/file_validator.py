"""
File validation utilities for secure file uploads.
"""
import re
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status


# Maximum file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'txt', 'md',  # Documents
    'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',  # Images
    'mp4', 'avi', 'mov', 'webm',  # Videos
    'mp3', 'wav', 'ogg',  # Audio
    'zip', 'tar', 'gz', '7z',  # Archives
    'py', 'js', 'ts', 'java', 'cpp', 'c', 'h',  # Code files
    'json', 'xml', 'yaml', 'yml', 'csv',  # Data files
    'ppt', 'pptx', 'xls', 'xlsx',  # Office files
}

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    # Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    # Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    # Videos
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/webm',
    # Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    # Archives
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
    # Code files
    'text/x-python',
    'application/javascript',
    'text/javascript',
    'application/json',
    'text/x-java',
    'text/x-c',
    'text/x-c++',
    # Data files
    'application/json',
    'application/xml',
    'text/xml',
    'text/yaml',
    'text/csv',
    # Office files
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    # Generic types that might be used
    'application/octet-stream',
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove any path components
    filename = Path(filename).name

    # Remove or replace dangerous characters
    # Keep only alphanumeric, dots, hyphens, and underscores
    filename = re.sub(r'[^\w\.-]', '_', filename)

    # Prevent multiple dots (possible double extension attacks)
    filename = re.sub(r'\.{2,}', '.', filename)

    # Ensure filename isn't empty after sanitization
    if not filename or filename == '.':
        filename = 'unnamed_file'

    return filename


def validate_file_extension(filename: str) -> Tuple[bool, str]:
    """
    Validate file extension.

    Args:
        filename: File name to validate

    Returns:
        Tuple of (is_valid, extension)
    """
    file_ext = Path(filename).suffix.lstrip('.').lower()

    if not file_ext:
        return False, ''

    if file_ext not in ALLOWED_EXTENSIONS:
        return False, file_ext

    return True, file_ext


def validate_mime_type(content_type: str) -> bool:
    """
    Validate MIME type.

    Args:
        content_type: MIME type to validate

    Returns:
        True if valid, False otherwise
    """
    if not content_type:
        return False

    # Handle MIME types with parameters (e.g., "text/plain; charset=utf-8")
    base_type = content_type.split(';')[0].strip().lower()

    return base_type in ALLOWED_MIME_TYPES


def validate_file_size(size: int) -> bool:
    """
    Validate file size.

    Args:
        size: File size in bytes

    Returns:
        True if valid, False otherwise
    """
    return 0 < size <= MAX_FILE_SIZE


async def validate_upload_file(file: UploadFile) -> Tuple[str, str]:
    """
    Validate uploaded file for security.

    Args:
        file: FastAPI UploadFile object

    Returns:
        Tuple of (sanitized_filename, file_extension)

    Raises:
        HTTPException: If file validation fails
    """
    # Validate file exists
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    # Sanitize filename
    sanitized_name = sanitize_filename(file.filename)

    # Validate extension
    is_valid_ext, file_ext = validate_file_extension(sanitized_name)
    if not is_valid_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{file_ext}' is not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate MIME type
    if file.content_type and not validate_mime_type(file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{file.content_type}' is not allowed"
        )

    # Validate file size
    if file.size is not None:
        if not validate_file_size(file.size):
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            if file.size == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File is empty (0 bytes)"
                )
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {max_size_mb}MB"
            )

    return sanitized_name, file_ext

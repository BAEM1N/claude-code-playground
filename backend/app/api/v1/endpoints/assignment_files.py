"""
File attachment endpoints for assignments and submissions.

This module has been refactored to use:
- HTTP status code constants (status.HTTP_*)
- Pydantic response schemas instead of dicts
- Database helper functions (get_or_404)
- FileService for centralized file operations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import require_instructor_or_assistant, get_current_active_user
from ....api.utils.db_helpers import get_or_404
from ....models.assignment import Assignment, Submission, AssignmentFile, SubmissionFile
from ....models.file import File as FileModel
from ....schemas.file_attachment import (
    FileAttachmentResponse,
    AssignmentFileInfo,
    SubmissionFileInfo
)
from ....services.file_service import file_service

router = APIRouter()


@router.post(
    "/assignments/{assignment_id}/files",
    response_model=FileAttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def attach_file_to_assignment(
    assignment_id: UUID,
    file: UploadFile = File(...),
    file_type: str = Query("material", regex="^(material|solution|rubric)$"),
    current_user: dict = Depends(require_instructor_or_assistant),
    db: AsyncSession = Depends(get_db)
):
    """
    Attach a file to an assignment.

    File types:
    - material: Course materials, instructions
    - solution: Solution files (shown after due date if enabled)
    - rubric: Grading rubric files

    Returns:
        FileAttachmentResponse with file details
    """
    # Use helper function instead of manual query + check
    assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")

    # Use FileService for centralized file handling
    db_file = await file_service.create_assignment_file(
        db=db,
        file=file,
        course_id=assignment.course_id,
        uploaded_by=UUID(current_user["id"]),
        file_type=file_type
    )

    # Link to assignment
    assignment_file = AssignmentFile(
        assignment_id=assignment_id,
        file_id=db_file.id,
        file_type=file_type
    )
    db.add(assignment_file)
    await db.commit()

    # Return Pydantic schema instead of dict
    return FileAttachmentResponse(
        message="File attached successfully",
        file_id=db_file.id,
        filename=file.filename,
        file_path=db_file.file_path
    )


@router.get(
    "/assignments/{assignment_id}/files",
    response_model=List[AssignmentFileInfo],
    status_code=status.HTTP_200_OK
)
async def get_assignment_files(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all files attached to an assignment.

    Returns:
        List of AssignmentFileInfo
    """
    # Verify assignment exists
    await get_or_404(db, Assignment, assignment_id, "Assignment not found")

    query = (
        select(FileModel, AssignmentFile.file_type)
        .join(AssignmentFile)
        .where(AssignmentFile.assignment_id == assignment_id)
    )

    result = await db.execute(query)
    files = result.all()

    # Return list of Pydantic models
    return [
        AssignmentFileInfo(
            id=file.id,
            filename=file.original_name,
            file_size=file.file_size,
            mime_type=file.mime_type,
            file_type=file_type,
            created_at=file.created_at,
            download_url=f"/api/v1/files/{file.id}/download"
        )
        for file, file_type in files
    ]


@router.post(
    "/submissions/{submission_id}/files",
    response_model=FileAttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def attach_file_to_submission(
    submission_id: UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Attach a file to a submission.

    Returns:
        FileAttachmentResponse with file details
    """
    # Use helper function
    submission = await get_or_404(db, Submission, submission_id, "Submission not found")

    # Verify ownership
    if str(submission.student_id) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to attach files to this submission"
        )

    # Get assignment for course_id
    assignment = await get_or_404(
        db,
        Assignment,
        submission.assignment_id,
        "Assignment not found"
    )

    # Use FileService
    db_file = await file_service.create_submission_file(
        db=db,
        file=file,
        course_id=assignment.course_id,
        uploaded_by=UUID(current_user["id"])
    )

    # Link to submission
    submission_file = SubmissionFile(
        submission_id=submission_id,
        file_id=db_file.id
    )
    db.add(submission_file)
    await db.commit()

    # Return Pydantic schema
    return FileAttachmentResponse(
        message="File attached successfully",
        file_id=db_file.id,
        filename=file.filename,
        file_path=db_file.file_path
    )


@router.get(
    "/submissions/{submission_id}/files",
    response_model=List[SubmissionFileInfo],
    status_code=status.HTTP_200_OK
)
async def get_submission_files(
    submission_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all files attached to a submission.

    Returns:
        List of SubmissionFileInfo
    """
    # Verify submission exists
    await get_or_404(db, Submission, submission_id, "Submission not found")

    query = (
        select(FileModel)
        .join(SubmissionFile)
        .where(SubmissionFile.submission_id == submission_id)
    )

    result = await db.execute(query)
    files = result.scalars().all()

    # Return list of Pydantic models
    return [
        SubmissionFileInfo(
            id=file.id,
            filename=file.original_name,
            file_size=file.file_size,
            mime_type=file.mime_type,
            created_at=file.created_at,
            download_url=f"/api/v1/files/{file.id}/download"
        )
        for file in files
    ]

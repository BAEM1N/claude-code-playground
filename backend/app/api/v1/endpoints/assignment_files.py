/**
 * File attachment endpoints for assignments
 */
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import require_instructor_or_assistant, get_current_active_user
from ....models.assignment import AssignmentFile, SubmissionFile
from ....models.file import File as FileModel
from ....services.storage_service import storage_service

router = APIRouter()


@router.post("/assignments/{assignment_id}/files", status_code=201)
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
    """
    # Upload to storage
    from ....models.assignment import Assignment
    assignment_query = select(Assignment).where(Assignment.id == assignment_id)
    assignment_result = await db.execute(assignment_query)
    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    file_path = storage_service.upload_file(
        file.file,
        file.filename,
        str(assignment.course_id),
        folder="assignments",
        content_type=file.content_type
    )

    # Create file record
    db_file = FileModel(
        course_id=assignment.course_id,
        uploaded_by=UUID(current_user["id"]),
        original_name=file.filename,
        stored_name=file_path.split("/")[-1],
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type
    )
    db.add(db_file)
    await db.flush()

    # Link to assignment
    assignment_file = AssignmentFile(
        assignment_id=assignment_id,
        file_id=db_file.id,
        file_type=file_type
    )
    db.add(assignment_file)
    await db.commit()

    return {
        "message": "File attached successfully",
        "file_id": str(db_file.id),
        "filename": file.filename
    }


@router.get("/assignments/{assignment_id}/files")
async def get_assignment_files(
    assignment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all files attached to an assignment."""
    query = (
        select(FileModel, AssignmentFile.file_type)
        .join(AssignmentFile)
        .where(AssignmentFile.assignment_id == assignment_id)
    )

    result = await db.execute(query)
    files = result.all()

    return [
        {
            "id": str(file.id),
            "filename": file.original_name,
            "file_size": file.file_size,
            "mime_type": file.mime_type,
            "file_type": file_type,
            "created_at": file.created_at.isoformat(),
            "download_url": f"/api/v1/files/{file.id}/download"
        }
        for file, file_type in files
    ]


@router.post("/submissions/{submission_id}/files", status_code=201)
async def attach_file_to_submission(
    submission_id: UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Attach a file to a submission."""
    from ....models.assignment import Submission

    # Verify submission belongs to user
    submission_query = select(Submission).where(Submission.id == submission_id)
    submission_result = await db.execute(submission_query)
    submission = submission_result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if str(submission.student_id) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get assignment for course_id
    from ....models.assignment import Assignment
    assignment_query = select(Assignment).where(Assignment.id == submission.assignment_id)
    assignment_result = await db.execute(assignment_query)
    assignment = assignment_result.scalar_one()

    # Upload to storage
    file_path = storage_service.upload_file(
        file.file,
        file.filename,
        str(assignment.course_id),
        folder="submissions",
        content_type=file.content_type
    )

    # Create file record
    db_file = FileModel(
        course_id=assignment.course_id,
        uploaded_by=UUID(current_user["id"]),
        original_name=file.filename,
        stored_name=file_path.split("/")[-1],
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type
    )
    db.add(db_file)
    await db.flush()

    # Link to submission
    submission_file = SubmissionFile(
        submission_id=submission_id,
        file_id=db_file.id
    )
    db.add(submission_file)
    await db.commit()

    return {
        "message": "File attached successfully",
        "file_id": str(db_file.id),
        "filename": file.filename
    }


@router.get("/submissions/{submission_id}/files")
async def get_submission_files(
    submission_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all files attached to a submission."""
    query = (
        select(FileModel)
        .join(SubmissionFile)
        .where(SubmissionFile.submission_id == submission_id)
    )

    result = await db.execute(query)
    files = result.scalars().all()

    return [
        {
            "id": str(file.id),
            "filename": file.original_name,
            "file_size": file.file_size,
            "mime_type": file.mime_type,
            "created_at": file.created_at.isoformat(),
            "download_url": f"/api/v1/files/{file.id}/download"
        }
        for file in files
    ]

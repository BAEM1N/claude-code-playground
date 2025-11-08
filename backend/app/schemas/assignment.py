"""
Assignment and grading schemas.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


# Assignment Schemas
class AssignmentBase(BaseModel):
    """Base assignment schema."""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: datetime
    start_date: Optional[datetime] = None
    max_points: float = Field(default=100.0, gt=0)
    late_submission_allowed: bool = False
    late_penalty_percent: int = Field(default=0, ge=0, le=100)
    allow_resubmission: bool = False
    show_solutions_after_due: bool = False
    rubric: Optional[Dict[str, Any]] = None


class AssignmentCreate(AssignmentBase):
    """Schema for creating assignment."""

    pass


class AssignmentUpdate(BaseModel):
    """Schema for updating assignment."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    max_points: Optional[float] = Field(None, gt=0)
    late_submission_allowed: Optional[bool] = None
    late_penalty_percent: Optional[int] = Field(None, ge=0, le=100)
    allow_resubmission: Optional[bool] = None
    show_solutions_after_due: Optional[bool] = None
    is_published: Optional[bool] = None
    rubric: Optional[Dict[str, Any]] = None


class Assignment(AssignmentBase):
    """Schema for assignment response."""

    id: UUID
    course_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    is_published: bool
    is_deleted: bool

    class Config:
        from_attributes = True


# Submission Schemas
class SubmissionBase(BaseModel):
    """Base submission schema."""

    content: Optional[str] = None
    submission_text: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    """Schema for creating submission."""

    pass


class SubmissionUpdate(BaseModel):
    """Schema for updating submission."""

    content: Optional[str] = None
    submission_text: Optional[str] = None


class Submission(SubmissionBase):
    """Schema for submission response."""

    id: UUID
    assignment_id: UUID
    student_id: UUID
    submitted_at: datetime
    is_late: bool
    attempt_number: int
    status: str

    class Config:
        from_attributes = True


# Grade Schemas
class GradeBase(BaseModel):
    """Base grade schema."""

    points: float = Field(..., ge=0)
    max_points: float = Field(..., gt=0)
    feedback: Optional[str] = None
    rubric_scores: Optional[Dict[str, Any]] = None
    letter_grade: Optional[str] = Field(None, max_length=5)


class GradeCreate(GradeBase):
    """Schema for creating grade."""

    is_released: bool = False


class GradeUpdate(BaseModel):
    """Schema for updating grade."""

    points: Optional[float] = Field(None, ge=0)
    max_points: Optional[float] = Field(None, gt=0)
    feedback: Optional[str] = None
    rubric_scores: Optional[Dict[str, Any]] = None
    letter_grade: Optional[str] = Field(None, max_length=5)
    is_released: Optional[bool] = None


class Grade(GradeBase):
    """Schema for grade response."""

    id: UUID
    submission_id: UUID
    graded_by: UUID
    percentage: Optional[float] = None
    graded_at: datetime
    updated_at: datetime
    is_released: bool

    class Config:
        from_attributes = True


# Combined/Extended Schemas
class SubmissionWithGrade(Submission):
    """Submission with grade information."""

    grade: Optional[Grade] = None


class AssignmentWithStats(Assignment):
    """Assignment with statistics."""

    total_submissions: Optional[int] = 0
    graded_submissions: Optional[int] = 0
    average_score: Optional[float] = None


class StudentAssignmentStatus(BaseModel):
    """Student's status for an assignment."""

    assignment: Assignment
    submission: Optional[Submission] = None
    grade: Optional[Grade] = None
    is_submitted: bool
    is_graded: bool
    is_late: bool
    can_submit: bool  # Based on due date and late submission policy

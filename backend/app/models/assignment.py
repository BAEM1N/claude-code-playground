"""
Assignment and grading models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Assignment(Base):
    """Assignment model."""

    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    instructions = Column(Text)

    # Dates
    start_date = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True), nullable=False)
    late_submission_allowed = Column(Boolean, default=False)
    late_penalty_percent = Column(Integer, default=0)  # Percentage deduction for late submission

    # Grading
    max_points = Column(Float, nullable=False, default=100.0)
    rubric = Column(JSON)  # JSON structure for grading criteria

    # Settings
    allow_resubmission = Column(Boolean, default=False)
    show_solutions_after_due = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_published = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # Relationships
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")
    assignment_files = relationship("AssignmentFile", back_populates="assignment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Assignment(id={self.id}, title={self.title})>"


class Submission(Base):
    """Student submission model."""

    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)

    # Submission content
    content = Column(Text)  # Text submission
    submission_text = Column(Text)  # Additional text/comments

    # Submission metadata
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    is_late = Column(Boolean, default=False)
    attempt_number = Column(Integer, default=1)

    # Status
    status = Column(String(20), default="submitted")  # submitted, graded, returned
    is_deleted = Column(Boolean, default=False)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    grade = relationship("Grade", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    submission_files = relationship("SubmissionFile", back_populates="submission", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Submission(id={self.id}, assignment_id={self.assignment_id}, student_id={self.student_id})>"


class Grade(Base):
    """Grade/evaluation model."""

    __tablename__ = "grades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))

    # Grading
    points = Column(Float, nullable=False)
    max_points = Column(Float, nullable=False)
    percentage = Column(Float)  # Auto-calculated
    letter_grade = Column(String(5))  # A+, A, B+, etc.

    # Feedback
    feedback = Column(Text)
    rubric_scores = Column(JSON)  # Detailed scores per rubric item

    # Metadata
    graded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_released = Column(Boolean, default=False)  # Whether student can see the grade

    # Relationships
    submission = relationship("Submission", back_populates="grade")

    def __repr__(self):
        return f"<Grade(id={self.id}, points={self.points}/{self.max_points})>"


class AssignmentFile(Base):
    """Files attached to assignments (instructions, materials)."""

    __tablename__ = "assignment_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    file_type = Column(String(50), default="material")  # material, solution, rubric
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    assignment = relationship("Assignment", back_populates="assignment_files")

    def __repr__(self):
        return f"<AssignmentFile(assignment_id={self.assignment_id}, file_id={self.file_id})>"


class SubmissionFile(Base):
    """Files submitted by students."""

    __tablename__ = "submission_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submission = relationship("Submission", back_populates="submission_files")

    def __repr__(self):
        return f"<SubmissionFile(submission_id={self.submission_id}, file_id={self.file_id})>"

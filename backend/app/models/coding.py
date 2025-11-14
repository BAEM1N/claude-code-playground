"""
Coding Environment models for online code execution and practice
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import enum

from ..db.base_class import Base


class DifficultyLevel(str, enum.Enum):
    """Difficulty levels for coding problems"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ProgrammingLanguage(str, enum.Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    GO = "go"
    RUST = "rust"


class SubmissionStatus(str, enum.Enum):
    """Status of code submission"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    TIMEOUT = "timeout"


class ExecutionStatus(str, enum.Enum):
    """Status of code execution"""
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


class CodingProblem(Base):
    """Coding problem/exercise model"""
    __tablename__ = "coding_problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False, default=DifficultyLevel.EASY)
    language = Column(String(50), nullable=False)
    starter_code = Column(Text)
    solution_code = Column(Text)  # Reference solution (hidden from students)
    time_limit = Column(Integer, nullable=False, default=5)  # seconds
    memory_limit = Column(Integer, nullable=False, default=128)  # MB
    tags = Column(JSONB)  # ["array", "sorting", etc.]
    hints = Column(JSONB)  # ["hint1", "hint2", etc.]
    is_public = Column(Boolean, default=True, nullable=False)

    # Relationships
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    course = relationship("Course", foreign_keys=[course_id])
    assignment = relationship("Assignment", foreign_keys=[assignment_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("CodeSubmission", back_populates="problem", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CodingProblem(id={self.id}, title='{self.title}', difficulty='{self.difficulty}')>"


class TestCase(Base):
    """Test case for coding problems"""
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_sample = Column(Boolean, default=False, nullable=False)  # Sample cases shown to users
    is_hidden = Column(Boolean, default=False, nullable=False)  # Hidden test cases
    points = Column(Integer, default=1, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    description = Column(String(200))

    # Relationships
    problem = relationship("CodingProblem", back_populates="test_cases")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TestCase(id={self.id}, problem_id={self.problem_id}, is_sample={self.is_sample})>"


class CodeSubmission(Base):
    """Student code submission for a problem"""
    __tablename__ = "code_submissions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default=SubmissionStatus.PENDING)
    score = Column(Float)  # Percentage or points
    total_test_cases = Column(Integer)
    passed_test_cases = Column(Integer)
    execution_time = Column(Float)  # milliseconds
    memory_used = Column(Float)  # MB
    error_message = Column(Text)
    output = Column(Text)
    test_results = Column(JSONB)  # Detailed results per test case

    # Relationships
    problem = relationship("CodingProblem", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CodeSubmission(id={self.id}, problem_id={self.problem_id}, status='{self.status}')>"


class CodeExecution(Base):
    """Code execution for playground/practice mode"""
    __tablename__ = "code_executions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    input_data = Column(Text)
    output = Column(Text)
    error = Column(Text)
    execution_time = Column(Float)  # milliseconds
    memory_used = Column(Float)  # MB
    status = Column(String(20), nullable=False, default=ExecutionStatus.SUCCESS)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CodeExecution(id={self.id}, language='{self.language}', status='{self.status}')>"


class SavedCode(Base):
    """Saved code snippets"""
    __tablename__ = "saved_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("coding_problems.id", ondelete="SET NULL"))
    title = Column(String(200), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)
    notes = Column(Text)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    problem = relationship("CodingProblem", foreign_keys=[problem_id])

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SavedCode(id={self.id}, title='{self.title}', language='{self.language}')>"


class CollaborativeCodingSession(Base):
    """Collaborative coding session for real-time code editing"""
    __tablename__ = "collaborative_coding_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False, default="")
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    is_active = Column(Boolean, default=True, nullable=False)
    max_participants = Column(Integer, default=10, nullable=False)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)

    # Relationships
    host = relationship("User", foreign_keys=[host_id])
    course = relationship("Course", foreign_keys=[course_id])
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CollaborativeCodingSession(id={self.id}, title='{self.title}', is_active={self.is_active})>"


class SessionParticipant(Base):
    """Participant in a collaborative coding session"""
    __tablename__ = "session_participants"
    __table_args__ = (
        UniqueConstraint('session_id', 'user_id', name='uix_session_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("collaborative_coding_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # host, participant
    cursor_position = Column(JSONB)  # {line: 1, column: 0}
    is_active = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime)

    # Relationships
    session = relationship("CollaborativeCodingSession", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<SessionParticipant(session_id={self.session_id}, user_id={self.user_id}, role='{self.role}')>"

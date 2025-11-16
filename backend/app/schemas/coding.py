"""
Pydantic schemas for Coding Environment API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ProgrammingLanguage(str, Enum):
    """Programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    GO = "go"
    RUST = "rust"


class SubmissionStatus(str, Enum):
    """Submission status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    TIMEOUT = "timeout"


class ExecutionStatus(str, Enum):
    """Execution status"""
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


# Test Case Schemas
class TestCaseBase(BaseModel):
    """Base schema for test case"""
    input_data: str
    expected_output: str
    is_sample: bool = False
    is_hidden: bool = False
    points: int = 1
    order_index: int = 0
    description: Optional[str] = None


class TestCaseCreate(TestCaseBase):
    """Schema for creating a test case"""
    pass


class TestCaseUpdate(BaseModel):
    """Schema for updating a test case"""
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    is_sample: Optional[bool] = None
    is_hidden: Optional[bool] = None
    points: Optional[int] = None
    order_index: Optional[int] = None
    description: Optional[str] = None


class TestCaseResponse(TestCaseBase):
    """Schema for test case response"""
    id: int
    problem_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Coding Problem Schemas
class CodingProblemBase(BaseModel):
    """Base schema for coding problem"""
    title: str
    description: str
    difficulty: DifficultyLevel = DifficultyLevel.EASY
    language: ProgrammingLanguage
    starter_code: Optional[str] = None
    time_limit: int = 5
    memory_limit: int = 128
    tags: Optional[List[str]] = None
    hints: Optional[List[str]] = None
    is_public: bool = True


class CodingProblemCreate(CodingProblemBase):
    """Schema for creating a coding problem"""
    solution_code: Optional[str] = None
    course_id: Optional[int] = None
    assignment_id: Optional[int] = None
    test_cases: Optional[List[TestCaseCreate]] = None


class CodingProblemUpdate(BaseModel):
    """Schema for updating a coding problem"""
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    language: Optional[ProgrammingLanguage] = None
    starter_code: Optional[str] = None
    solution_code: Optional[str] = None
    time_limit: Optional[int] = None
    memory_limit: Optional[int] = None
    tags: Optional[List[str]] = None
    hints: Optional[List[str]] = None
    is_public: Optional[bool] = None


class CodingProblemResponse(CodingProblemBase):
    """Schema for coding problem response"""
    id: int
    course_id: Optional[int] = None
    assignment_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodingProblemDetail(CodingProblemResponse):
    """Schema for detailed coding problem with test cases"""
    test_cases: List[TestCaseResponse] = []
    sample_test_cases: List[TestCaseResponse] = []
    total_submissions: int = 0
    user_best_submission: Optional['CodeSubmissionResponse'] = None


# Code Execution Schemas
class CodeExecutionRequest(BaseModel):
    """Schema for code execution request (playground mode)"""
    code: str
    language: ProgrammingLanguage
    input_data: Optional[str] = None


class CodeExecutionResponse(BaseModel):
    """Schema for code execution response"""
    id: int
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    status: ExecutionStatus
    executed_at: datetime

    class Config:
        from_attributes = True


# Code Submission Schemas
class CodeSubmissionRequest(BaseModel):
    """Schema for code submission request"""
    problem_id: int
    code: str
    language: ProgrammingLanguage


class TestCaseResult(BaseModel):
    """Schema for individual test case result"""
    test_case_id: int
    passed: bool
    input_data: str
    expected_output: str
    actual_output: Optional[str] = None
    execution_time: Optional[float] = None
    error: Optional[str] = None
    points: int
    earned_points: int


class CodeSubmissionResponse(BaseModel):
    """Schema for code submission response"""
    id: int
    problem_id: int
    user_id: int
    code: str
    language: str
    status: SubmissionStatus
    score: Optional[float] = None
    total_test_cases: Optional[int] = None
    passed_test_cases: Optional[int] = None
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    error_message: Optional[str] = None
    output: Optional[str] = None
    test_results: Optional[List[Dict[str, Any]]] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class CodeSubmissionDetail(CodeSubmissionResponse):
    """Schema for detailed code submission with test results"""
    test_case_results: List[TestCaseResult] = []


# Saved Code Schemas
class SavedCodeBase(BaseModel):
    """Base schema for saved code"""
    title: str
    code: str
    language: ProgrammingLanguage
    is_favorite: bool = False
    notes: Optional[str] = None


class SavedCodeCreate(SavedCodeBase):
    """Schema for creating saved code"""
    problem_id: Optional[int] = None


class SavedCodeUpdate(BaseModel):
    """Schema for updating saved code"""
    title: Optional[str] = None
    code: Optional[str] = None
    language: Optional[ProgrammingLanguage] = None
    is_favorite: Optional[bool] = None
    notes: Optional[str] = None


class SavedCodeResponse(SavedCodeBase):
    """Schema for saved code response"""
    id: int
    user_id: int
    problem_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas
class ProblemStatistics(BaseModel):
    """Statistics for a coding problem"""
    problem_id: int
    total_submissions: int
    unique_users: int
    passed_submissions: int
    failed_submissions: int
    average_execution_time: Optional[float] = None
    acceptance_rate: float


class UserCodingStatistics(BaseModel):
    """Statistics for a user's coding activity"""
    total_submissions: int
    problems_solved: int
    problems_attempted: int
    total_execution_time: float
    favorite_language: Optional[str] = None
    difficulty_breakdown: Dict[str, int] = {}
    recent_submissions: List[CodeSubmissionResponse] = []


# Language Config
class LanguageConfig(BaseModel):
    """Configuration for programming language"""
    language: ProgrammingLanguage
    display_name: str
    file_extension: str
    template: str
    comment_syntax: str

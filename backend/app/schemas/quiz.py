"""
Quiz/Exam System Schemas
"""
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any


# Question Schemas
class QuestionBase(BaseModel):
    """Base schema for Question"""
    question_type: str = Field(..., description="multiple_choice, true_false, short_answer, essay")
    question_text: str
    points: float = 1.0
    order: int
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    case_sensitive: bool = False
    explanation: Optional[str] = None


class QuestionCreate(QuestionBase):
    """Schema for creating a question"""
    pass


class QuestionUpdate(BaseModel):
    """Schema for updating a question"""
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    points: Optional[float] = None
    order: Optional[int] = None
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    case_sensitive: Optional[bool] = None
    explanation: Optional[str] = None


class QuestionResponse(QuestionBase):
    """Schema for question response"""
    id: UUID
    quiz_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionResponseStudent(BaseModel):
    """Schema for question response (student view - without answers)"""
    id: UUID
    quiz_id: UUID
    question_type: str
    question_text: str
    points: float
    order: int
    options: Optional[List[Dict[str, Any]]] = None  # Without is_correct flag
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


# Quiz Schemas
class QuizBase(BaseModel):
    """Base schema for Quiz"""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    quiz_type: str = "quiz"
    start_time: datetime
    end_time: datetime
    duration_minutes: Optional[int] = None
    total_points: float = 100.0
    passing_score: Optional[float] = None
    randomize_questions: bool = False
    randomize_options: bool = False
    show_results_immediately: bool = True
    allow_review: bool = True
    max_attempts: int = 1


class QuizCreate(QuizBase):
    """Schema for creating a quiz"""
    course_id: UUID
    questions: Optional[List[QuestionCreate]] = None


class QuizUpdate(BaseModel):
    """Schema for updating a quiz"""
    title: Optional[str] = None
    description: Optional[str] = None
    quiz_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_points: Optional[float] = None
    passing_score: Optional[float] = None
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    allow_review: Optional[bool] = None
    max_attempts: Optional[int] = None
    is_published: Optional[bool] = None


class QuizResponse(QuizBase):
    """Schema for quiz response"""
    id: UUID
    course_id: UUID
    is_published: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    questions: Optional[List[QuestionResponse]] = None

    class Config:
        from_attributes = True


class QuizResponseStudent(BaseModel):
    """Schema for quiz response (student view)"""
    id: UUID
    course_id: UUID
    title: str
    description: Optional[str] = None
    quiz_type: str
    start_time: datetime
    end_time: datetime
    duration_minutes: Optional[int] = None
    total_points: float
    passing_score: Optional[float] = None
    show_results_immediately: bool
    allow_review: bool
    max_attempts: int
    created_at: datetime
    questions: Optional[List[QuestionResponseStudent]] = None

    class Config:
        from_attributes = True


# Answer Schemas
class AnswerBase(BaseModel):
    """Base schema for Answer"""
    question_id: UUID
    answer: Dict[str, Any]


class AnswerCreate(AnswerBase):
    """Schema for creating an answer"""
    pass


class AnswerUpdate(BaseModel):
    """Schema for updating an answer"""
    answer: Optional[Dict[str, Any]] = None


class AnswerResponse(AnswerBase):
    """Schema for answer response"""
    id: UUID
    attempt_id: UUID
    is_correct: Optional[bool] = None
    points_earned: float
    feedback: Optional[str] = None
    graded_by: Optional[UUID] = None
    answered_at: datetime
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Quiz Attempt Schemas
class QuizAttemptBase(BaseModel):
    """Base schema for QuizAttempt"""
    quiz_id: UUID


class QuizAttemptCreate(QuizAttemptBase):
    """Schema for starting a quiz attempt"""
    pass


class QuizAttemptSubmit(BaseModel):
    """Schema for submitting a quiz attempt"""
    answers: List[AnswerCreate]


class QuizAttemptUpdate(BaseModel):
    """Schema for updating quiz attempt (for tracking)"""
    focus_lost_count: Optional[int] = None
    tab_switch_count: Optional[int] = None


class QuizAttemptResponse(QuizAttemptBase):
    """Schema for quiz attempt response"""
    id: UUID
    student_id: UUID
    attempt_number: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None
    score: Optional[float] = None
    auto_graded_score: Optional[float] = None
    manual_graded_score: Optional[float] = None
    percentage: Optional[float] = None
    passed: Optional[bool] = None
    focus_lost_count: int
    tab_switch_count: int
    status: str
    answers: Optional[List[AnswerResponse]] = None

    class Config:
        from_attributes = True


# Grading Schemas
class ManualGradeInput(BaseModel):
    """Schema for manual grading"""
    answer_id: UUID
    points_earned: float
    feedback: Optional[str] = None


class QuizStatistics(BaseModel):
    """Schema for quiz statistics"""
    quiz_id: UUID
    total_attempts: int
    completed_attempts: int
    average_score: Optional[float] = None
    highest_score: Optional[float] = None
    lowest_score: Optional[float] = None
    pass_rate: Optional[float] = None
    average_time_seconds: Optional[int] = None

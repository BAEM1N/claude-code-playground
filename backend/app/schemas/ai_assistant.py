"""
AI Assistant Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


# Enums
AIProvider = Literal["openai", "claude", "gemini", "openrouter"]
AITaskType = Literal["code_review", "explain_concept", "generate_quiz", "summarize", "answer_question", "chat", "custom"]
MessageRole = Literal["system", "user", "assistant"]


# Message schemas
class MessageCreate(BaseModel):
    role: MessageRole
    content: str


class MessageResponse(BaseModel):
    id: int
    role: MessageRole
    content: str
    tokens_used: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Conversation schemas
class ConversationCreate(BaseModel):
    course_id: Optional[int] = None
    title: Optional[str] = None
    task_type: AITaskType = "chat"
    provider: AIProvider = "openai"
    model: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    user_id: str
    course_id: Optional[int]
    title: Optional[str]
    task_type: AITaskType
    provider: AIProvider
    model: str
    message_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ConversationDetail(ConversationResponse):
    messages: List[MessageResponse] = []


# Chat request/response
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    course_id: Optional[int] = None
    provider: Optional[AIProvider] = None
    model: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0, le=1)


class ChatResponse(BaseModel):
    conversation_id: int
    message: MessageResponse
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None


# Code review schemas
class CodeReviewRequest(BaseModel):
    code: str
    language: str = "python"
    context: Optional[str] = None
    submission_id: Optional[int] = None
    provider: Optional[AIProvider] = None
    model: Optional[str] = None


class CodeReviewResponse(BaseModel):
    review: str
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None
    review_id: Optional[int] = None


class CodeReviewFeedback(BaseModel):
    review_id: int
    was_helpful: bool


# Concept explanation schemas
class ExplainConceptRequest(BaseModel):
    concept: str
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    context: Optional[str] = None
    provider: Optional[AIProvider] = None
    model: Optional[str] = None


class ExplainConceptResponse(BaseModel):
    explanation: str
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None


# Quiz generation schemas
class QuizGenerationRequest(BaseModel):
    topic: str
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_types: List[Literal["multiple_choice", "short_answer", "true_false", "coding"]] = [
        "multiple_choice", "short_answer"
    ]
    course_id: int
    provider: Optional[AIProvider] = None
    model: Optional[str] = None


class QuizQuestion(BaseModel):
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    sample_answer: Optional[str] = None
    key_points: Optional[List[str]] = None
    explanation: Optional[str] = None
    points: int = 1


class QuizGenerationResponse(BaseModel):
    generation_id: int
    questions: List[QuizQuestion]
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None


# Summarization schemas
class SummarizeRequest(BaseModel):
    content: str
    length: Literal["short", "medium", "long"] = "medium"
    provider: Optional[AIProvider] = None
    model: Optional[str] = None


class SummarizeResponse(BaseModel):
    summary: str
    provider: AIProvider
    model: str
    tokens_used: Optional[int] = None


# Usage statistics schemas
class UsageStats(BaseModel):
    total_requests: int
    total_tokens: int
    requests_by_provider: Dict[str, int]
    requests_by_task: Dict[str, int]
    average_response_time_ms: Optional[float] = None


class UserUsageStats(UsageStats):
    user_id: str
    period_start: datetime
    period_end: datetime


class CourseUsageStats(UsageStats):
    course_id: int
    period_start: datetime
    period_end: datetime


# AI provider info
class AIProviderInfo(BaseModel):
    provider: AIProvider
    models: List[str]
    is_available: bool
    description: str


class AIProvidersListResponse(BaseModel):
    providers: List[AIProviderInfo]
    default_provider: AIProvider

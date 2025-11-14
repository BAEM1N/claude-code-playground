"""
AI Assistant database models
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.base import Base


class AIProvider(str, enum.Enum):
    """AI Provider enum"""
    OPENAI = "openai"
    CLAUDE = "claude"
    GEMINI = "gemini"
    OPENROUTER = "openrouter"


class AITaskType(str, enum.Enum):
    """AI Task Type enum"""
    CODE_REVIEW = "code_review"
    EXPLAIN_CONCEPT = "explain_concept"
    GENERATE_QUIZ = "generate_quiz"
    SUMMARIZE = "summarize"
    ANSWER_QUESTION = "answer_question"
    CHAT = "chat"
    CUSTOM = "custom"


class AIConversation(Base):
    """
    AI Conversation - tracks chat sessions
    """
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)

    # Conversation metadata
    title = Column(String(255), nullable=True)
    task_type = Column(Enum(AITaskType), default=AITaskType.CHAT)
    provider = Column(Enum(AIProvider), nullable=False)
    model = Column(String(100), nullable=False)

    # Status
    is_archived = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")
    course = relationship("Course", backref="ai_conversations")


class AIMessage(Base):
    """
    AI Message - individual messages in a conversation
    """
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("ai_conversations.id"), nullable=False, index=True)

    # Message content
    role = Column(String(20), nullable=False)  # system, user, assistant
    content = Column(Text, nullable=False)

    # Metadata
    tokens_used = Column(Integer, nullable=True)
    finish_reason = Column(String(50), nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional metadata

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")


class AICodeReview(Base):
    """
    AI Code Review - stores code reviews for assignments
    """
    __tablename__ = "ai_code_reviews"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)

    # Review details
    provider = Column(Enum(AIProvider), nullable=False)
    model = Column(String(100), nullable=False)

    # Input
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    context = Column(Text, nullable=True)

    # Output
    review = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)

    # Feedback
    was_helpful = Column(Boolean, nullable=True)  # User feedback

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submission = relationship("Submission", backref="ai_reviews")


class AIQuizGeneration(Base):
    """
    AI Quiz Generation - stores AI-generated quizzes
    """
    __tablename__ = "ai_quiz_generations"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    created_by = Column(String, nullable=False, index=True)

    # Generation details
    provider = Column(Enum(AIProvider), nullable=False)
    model = Column(String(100), nullable=False)

    # Input
    topic = Column(String(255), nullable=False)
    num_questions = Column(Integer, nullable=False)
    difficulty = Column(String(50), nullable=False)
    question_types = Column(JSON, nullable=False)  # List of question types

    # Output
    generated_questions = Column(JSON, nullable=False)  # JSON array of questions
    tokens_used = Column(Integer, nullable=True)

    # Status
    was_used = Column(Boolean, default=False)  # Whether questions were added to a quiz

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    quiz = relationship("Quiz", backref="ai_generations")
    course = relationship("Course", backref="ai_quiz_generations")


class AIUsageLog(Base):
    """
    AI Usage Log - tracks all AI API calls for billing and analytics
    """
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)

    # Request details
    provider = Column(Enum(AIProvider), nullable=False, index=True)
    model = Column(String(100), nullable=False)
    task_type = Column(Enum(AITaskType), nullable=False, index=True)

    # Usage metrics
    tokens_used = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds

    # Status
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    course = relationship("Course", backref="ai_usage_logs")

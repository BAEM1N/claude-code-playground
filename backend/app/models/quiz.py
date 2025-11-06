"""
Quiz/Exam System Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..db.base import Base


class Quiz(Base):
    """퀴즈/시험"""
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    quiz_type = Column(String(50), default="quiz")  # quiz, midterm, final, practice

    # 시간 설정
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer)  # 제한 시간 (분)

    # 채점 설정
    total_points = Column(Float, default=100.0)
    passing_score = Column(Float)  # 합격 점수

    # 퀴즈 설정
    randomize_questions = Column(Boolean, default=False)
    randomize_options = Column(Boolean, default=False)
    show_results_immediately = Column(Boolean, default=True)
    allow_review = Column(Boolean, default=True)
    max_attempts = Column(Integer, default=1)

    # 메타데이터
    is_published = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    creator = relationship("UserProfile", foreign_keys=[created_by])
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    """퀴즈 문제"""
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, true_false, short_answer, essay
    question_text = Column(Text, nullable=False)
    points = Column(Float, default=1.0)
    order = Column(Integer, nullable=False)

    # 문제 설정
    options = Column(JSON)  # [{"id": "a", "text": "답1", "is_correct": true}] for multiple_choice
    correct_answer = Column(Text)  # For short_answer, true_false
    case_sensitive = Column(Boolean, default=False)  # For short_answer
    explanation = Column(Text)  # 해설

    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class QuizAttempt(Base):
    """퀴즈 응시 기록"""
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # 시도 정보
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    submitted_at = Column(DateTime)
    time_taken_seconds = Column(Integer)

    # 채점 정보
    score = Column(Float)  # 총점
    auto_graded_score = Column(Float)  # 자동 채점 점수
    manual_graded_score = Column(Float)  # 수동 채점 점수
    percentage = Column(Float)  # 백분율
    passed = Column(Boolean)

    # 부정행위 감지
    focus_lost_count = Column(Integer, default=0)
    tab_switch_count = Column(Integer, default=0)

    # 상태
    status = Column(String(20), default="in_progress")  # in_progress, submitted, graded
    ip_address = Column(String(45))
    user_agent = Column(Text)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("UserProfile", foreign_keys=[student_id])
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    """학생 답안"""
    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)

    # 답안 내용
    answer = Column(JSON)  # Flexible format based on question type
    is_correct = Column(Boolean)  # For auto-graded questions
    points_earned = Column(Float, default=0.0)

    # 채점 정보
    graded_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))  # For manual grading
    feedback = Column(Text)  # 피드백

    # 메타데이터
    answered_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    grader = relationship("UserProfile", foreign_keys=[graded_by])

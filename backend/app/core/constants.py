"""
Centralized constants and enums for the application.

This module contains all status values, types, and other constants
used throughout the application to maintain consistency and avoid
hardcoded strings.
"""
from enum import Enum


# ============================================
# User & Authentication
# ============================================

class UserRole(str, Enum):
    """User roles in the system."""
    INSTRUCTOR = "instructor"
    ASSISTANT = "assistant"
    STUDENT = "student"


# ============================================
# Attendance System
# ============================================

class AttendanceStatus(str, Enum):
    """Attendance check-in status."""
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"


class CheckInMethod(str, Enum):
    """Methods for checking in to attendance."""
    QR_CODE = "qr_code"
    PASSWORD = "password"
    MANUAL = "manual"  # Marked by instructor


# ============================================
# Quiz & Exam System
# ============================================

class QuizType(str, Enum):
    """Types of quizzes/exams."""
    QUIZ = "quiz"
    MIDTERM = "midterm"
    FINAL = "final"
    PRACTICE = "practice"


class QuizStatus(str, Enum):
    """Quiz attempt status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"
    EXPIRED = "expired"


class QuestionType(str, Enum):
    """Question types in quizzes."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class GradingStatus(str, Enum):
    """Grading status for answers."""
    PENDING = "pending"
    AUTO_GRADED = "auto_graded"
    MANUALLY_GRADED = "manually_graded"


# ============================================
# Assignment System
# ============================================

class AssignmentStatus(str, Enum):
    """Assignment submission status."""
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    GRADED = "graded"
    LATE = "late"
    RESUBMITTED = "resubmitted"


class SubmissionType(str, Enum):
    """Types of assignment submissions."""
    FILE = "file"
    TEXT = "text"
    URL = "url"
    BOTH = "both"  # File and text


# ============================================
# Progress & Gamification
# ============================================

class AchievementType(str, Enum):
    """Types of achievements."""
    FIRST_SUBMISSION = "first_submission"
    PERFECT_QUIZ = "perfect_quiz"
    ATTENDANCE_STREAK = "attendance_streak"
    EARLY_BIRD = "early_bird"
    PARTICIPATION = "participation"
    COMPLETION = "completion"
    PERFECT_ATTENDANCE = "perfect_attendance"
    TOP_PERFORMER = "top_performer"


class AchievementRarity(str, Enum):
    """Rarity levels for achievements."""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class ActivityType(str, Enum):
    """Types of user activities."""
    LOGIN = "login"
    LOGOUT = "logout"
    ASSIGNMENT_SUBMIT = "assignment_submit"
    QUIZ_START = "quiz_start"
    QUIZ_COMPLETE = "quiz_complete"
    MESSAGE_POST = "message_post"
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    ATTENDANCE_CHECKIN = "attendance_checkin"
    COMMENT = "comment"
    REPLY = "reply"


class MilestoneStatus(str, Enum):
    """Status of course milestones."""
    LOCKED = "locked"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# ============================================
# Calendar System
# ============================================

class EventType(str, Enum):
    """Types of calendar events."""
    CLASS = "class"
    ASSIGNMENT = "assignment"
    QUIZ = "quiz"
    EXAM = "exam"
    OFFICE_HOURS = "office_hours"
    HOLIDAY = "holiday"
    PERSONAL = "personal"
    CUSTOM = "custom"


class RSVPStatus(str, Enum):
    """RSVP response status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    MAYBE = "maybe"
    TENTATIVE = "tentative"


class ReminderType(str, Enum):
    """Reminder notification types."""
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"
    SMS = "sms"


# ============================================
# Communication System
# ============================================

class ChannelType(str, Enum):
    """Types of communication channels."""
    ANNOUNCEMENT = "announcement"
    GENERAL = "general"
    DISCUSSION = "discussion"
    QA = "qa"
    PROJECT = "project"
    PRIVATE = "private"


class MessageType(str, Enum):
    """Types of messages."""
    TEXT = "text"
    FILE = "file"
    POLL = "poll"
    ANNOUNCEMENT = "announcement"
    SYSTEM = "system"


class NotificationType(str, Enum):
    """Types of notifications."""
    ASSIGNMENT_POSTED = "assignment_posted"
    ASSIGNMENT_GRADED = "assignment_graded"
    QUIZ_AVAILABLE = "quiz_available"
    QUIZ_GRADED = "quiz_graded"
    MESSAGE = "message"
    MENTION = "mention"
    REPLY = "reply"
    ANNOUNCEMENT = "announcement"
    CALENDAR_EVENT = "calendar_event"
    DEADLINE_REMINDER = "deadline_reminder"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"


class NotificationPriority(str, Enum):
    """Priority levels for notifications."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ============================================
# File System
# ============================================

class FileCategory(str, Enum):
    """Categories for uploaded files."""
    DOCUMENT = "document"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    ARCHIVE = "archive"
    CODE = "code"
    OTHER = "other"


class FileAccessLevel(str, Enum):
    """Access levels for files."""
    PUBLIC = "public"
    COURSE = "course"
    PRIVATE = "private"
    INSTRUCTOR_ONLY = "instructor_only"


# ============================================
# Course Management
# ============================================

class CourseStatus(str, Enum):
    """Status of a course."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    ENDED = "ended"


class EnrollmentStatus(str, Enum):
    """Student enrollment status."""
    PENDING = "pending"
    ACTIVE = "active"
    DROPPED = "dropped"
    COMPLETED = "completed"
    SUSPENDED = "suspended"


class CourseMemberRole(str, Enum):
    """Roles within a specific course."""
    INSTRUCTOR = "instructor"
    ASSISTANT = "assistant"
    STUDENT = "student"


# ============================================
# System Constants
# ============================================

class SortOrder(str, Enum):
    """Sort order for queries."""
    ASC = "asc"
    DESC = "desc"


class DateFormat(str, Enum):
    """Standard date formats."""
    ISO = "iso"
    US = "us"
    EU = "eu"
    TIMESTAMP = "timestamp"


# ============================================
# Business Logic Constants
# ============================================

# Points and XP
DEFAULT_LOGIN_XP = 10
DEFAULT_ASSIGNMENT_SUBMIT_XP = 50
DEFAULT_QUIZ_COMPLETE_XP = 100
DEFAULT_PERFECT_SCORE_BONUS_XP = 50

# Level progression (XP required for each level)
XP_PER_LEVEL = 100
MAX_LEVEL = 100

# Streak bonuses
STREAK_BONUS_DAYS = [7, 30, 60, 100]  # Days for streak achievements
STREAK_BONUS_XP = [50, 200, 500, 1000]  # XP rewards

# File size limits (bytes)
MAX_FILE_SIZE_BYTES = 104857600  # 100MB
MAX_IMAGE_SIZE_BYTES = 10485760  # 10MB
MAX_VIDEO_SIZE_BYTES = 524288000  # 500MB

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cache keys prefix
CACHE_PREFIX_USER = "user:"
CACHE_PREFIX_COURSE = "course:"
CACHE_PREFIX_QUIZ = "quiz:"
CACHE_PREFIX_ASSIGNMENT = "assignment:"

# Time constants (seconds)
MINUTE = 60
HOUR = 3600
DAY = 86400
WEEK = 604800

# ============================================
# Helper Functions
# ============================================

def get_file_category_by_extension(extension: str) -> FileCategory:
    """
    Determine file category based on file extension.

    Args:
        extension: File extension (e.g., 'pdf', 'jpg')

    Returns:
        FileCategory enum value
    """
    extension = extension.lower().lstrip('.')

    document_types = {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'}
    image_types = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'}
    video_types = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'}
    audio_types = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}
    archive_types = {'zip', 'rar', '7z', 'tar', 'gz'}
    code_types = {'py', 'js', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'}

    if extension in document_types:
        return FileCategory.DOCUMENT
    elif extension in image_types:
        return FileCategory.IMAGE
    elif extension in video_types:
        return FileCategory.VIDEO
    elif extension in audio_types:
        return FileCategory.AUDIO
    elif extension in archive_types:
        return FileCategory.ARCHIVE
    elif extension in code_types:
        return FileCategory.CODE
    else:
        return FileCategory.OTHER


def calculate_level_from_xp(xp: int) -> int:
    """
    Calculate user level based on XP.

    Args:
        xp: Total experience points

    Returns:
        Current level (1-based)
    """
    level = (xp // XP_PER_LEVEL) + 1
    return min(level, MAX_LEVEL)


def calculate_xp_for_next_level(current_xp: int) -> int:
    """
    Calculate XP required to reach next level.

    Args:
        current_xp: Current experience points

    Returns:
        XP needed for next level
    """
    current_level = calculate_level_from_xp(current_xp)
    if current_level >= MAX_LEVEL:
        return 0

    next_level_xp = current_level * XP_PER_LEVEL
    return next_level_xp - current_xp

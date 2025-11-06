"""
Database models package.
"""
from .user import UserProfile
from .course import Course, CourseMember
from .channel import Channel
from .message import Message, MessageReaction, Mention
from .file import File, Folder, FileTag, MessageFile
from .notification import Notification, Announcement
from .assignment import Assignment, Submission, Grade, AssignmentFile, SubmissionFile
from .attendance import AttendanceSession, AttendanceRecord
from .quiz import Quiz, Question, QuizAttempt, Answer
from .progress import LearningProgress, Achievement, LearningActivity, Milestone, MilestoneCompletion
from .calendar import CalendarEvent, EventReminder, EventAttendee, PersonalEvent

__all__ = [
    "UserProfile",
    "Course",
    "CourseMember",
    "Channel",
    "Message",
    "MessageReaction",
    "Mention",
    "File",
    "Folder",
    "FileTag",
    "MessageFile",
    "Notification",
    "Announcement",
    "Assignment",
    "Submission",
    "Grade",
    "AssignmentFile",
    "SubmissionFile",
    "AttendanceSession",
    "AttendanceRecord",
    "Quiz",
    "Question",
    "QuizAttempt",
    "Answer",
    "LearningProgress",
    "Achievement",
    "LearningActivity",
    "Milestone",
    "MilestoneCompletion",
    "CalendarEvent",
    "EventReminder",
    "EventAttendee",
    "PersonalEvent",
]

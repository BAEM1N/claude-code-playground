"""
Pydantic schemas package.
"""
from .user import UserProfile, UserProfileCreate, UserProfileUpdate
from .course import Course, CourseCreate, CourseUpdate, CourseMember, CourseMemberCreate
from .channel import Channel, ChannelCreate, ChannelUpdate
from .message import Message, MessageCreate, MessageUpdate, MessageReaction, Mention
from .file import File, FileCreate, FileUpdate, Folder, FolderCreate, FileTag
from .notification import Notification, NotificationCreate, Announcement, AnnouncementCreate

__all__ = [
    "UserProfile",
    "UserProfileCreate",
    "UserProfileUpdate",
    "Course",
    "CourseCreate",
    "CourseUpdate",
    "CourseMember",
    "CourseMemberCreate",
    "Channel",
    "ChannelCreate",
    "ChannelUpdate",
    "Message",
    "MessageCreate",
    "MessageUpdate",
    "MessageReaction",
    "Mention",
    "File",
    "FileCreate",
    "FileUpdate",
    "Folder",
    "FolderCreate",
    "FileTag",
    "Notification",
    "NotificationCreate",
    "Announcement",
    "AnnouncementCreate",
]

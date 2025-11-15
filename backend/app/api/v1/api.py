"""
API v1 router.
"""
from fastapi import APIRouter
from .endpoints import auth, courses, channels, messages, files, notifications, assignments, assignment_files, attendance, quiz, progress, calendar, learning, ai_assistant, learning_paths, coding, virtual_classroom, forum, competition, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(channels.router, prefix="/channels", tags=["channels"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(assignment_files.router, prefix="/assignments", tags=["assignment-files"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(ai_assistant.router, prefix="/ai", tags=["ai-assistant"])
api_router.include_router(learning_paths.router, prefix="/learning-paths", tags=["learning-paths"])
api_router.include_router(coding.router, prefix="/coding", tags=["coding"])
api_router.include_router(virtual_classroom.router, prefix="/virtual-classroom", tags=["virtual-classroom"])
api_router.include_router(forum.router, prefix="/forum", tags=["forum"])
api_router.include_router(competition.router, prefix="/competition", tags=["competition"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

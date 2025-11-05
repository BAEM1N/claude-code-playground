"""
API v1 router.
"""
from fastapi import APIRouter
from .endpoints import auth, courses, channels, messages, files, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(channels.router, prefix="/channels", tags=["channels"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

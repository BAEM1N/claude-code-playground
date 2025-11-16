"""
Notification endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ....core.database import get_db
from ....api.deps import get_current_active_user
from ....models.notification import Notification
from ....schemas.notification import Notification as NotificationSchema
from ....services.notification_service import notification_service

router = APIRouter()


@router.get("", response_model=List[NotificationSchema])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user notifications.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records
        unread_only: Only return unread notifications

    Returns:
        List[Notification]: List of notifications
    """
    user_id = UUID(current_user["id"])

    notifications = await notification_service.get_user_notifications(
        db, user_id, skip, limit, unread_only
    )

    return notifications


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get count of unread notifications.

    Returns:
        dict: Unread count
    """
    user_id = UUID(current_user["id"])

    count = await notification_service.get_unread_count(db, user_id)

    return {"count": count}


@router.put("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark notification as read.

    Args:
        notification_id: Notification ID
    """
    user_id = UUID(current_user["id"])

    success = await notification_service.mark_as_read(db, notification_id, user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all notifications as read.
    """
    user_id = UUID(current_user["id"])

    await notification_service.mark_all_as_read(db, user_id)


@router.delete("/{notification_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_notification(
    notification_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dismiss notification.

    Args:
        notification_id: Notification ID
    """
    from sqlalchemy import select, update
    from ....models.notification import Notification
    from datetime import datetime

    user_id = UUID(current_user["id"])

    query = (
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .values(is_dismissed=True, dismissed_at=datetime.utcnow())
    )

    result = await db.execute(query)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )


@router.get("/preferences")
async def get_notification_preferences(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user notification preferences.

    Returns:
        dict: Notification preferences
    """
    from sqlalchemy import select
    from ....models.notification import NotificationPreference

    user_id = UUID(current_user["id"])

    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        # Create default preferences
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return {
        "enable_level_up": prefs.enable_level_up,
        "enable_badge_earned": prefs.enable_badge_earned,
        "enable_streak_milestone": prefs.enable_streak_milestone,
        "enable_rank_change": prefs.enable_rank_change,
        "enable_team_notifications": prefs.enable_team_notifications,
        "enable_friend_notifications": prefs.enable_friend_notifications,
        "enable_challenge_notifications": prefs.enable_challenge_notifications,
        "enable_system_notifications": prefs.enable_system_notifications,
        "enable_course_notifications": prefs.enable_course_notifications,
        "enable_in_app": prefs.enable_in_app,
        "enable_email": prefs.enable_email,
        "quiet_hours_enabled": prefs.quiet_hours_enabled,
        "quiet_hours_start": prefs.quiet_hours_start,
        "quiet_hours_end": prefs.quiet_hours_end,
    }


@router.put("/preferences")
async def update_notification_preferences(
    enable_level_up: bool = Query(None),
    enable_badge_earned: bool = Query(None),
    enable_streak_milestone: bool = Query(None),
    enable_rank_change: bool = Query(None),
    enable_team_notifications: bool = Query(None),
    enable_friend_notifications: bool = Query(None),
    enable_challenge_notifications: bool = Query(None),
    enable_system_notifications: bool = Query(None),
    enable_course_notifications: bool = Query(None),
    enable_in_app: bool = Query(None),
    enable_email: bool = Query(None),
    quiet_hours_enabled: bool = Query(None),
    quiet_hours_start: str = Query(None),
    quiet_hours_end: str = Query(None),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user notification preferences.

    Returns:
        dict: Updated notification preferences
    """
    from sqlalchemy import select
    from ....models.notification import NotificationPreference

    user_id = UUID(current_user["id"])

    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)

    # Update only provided fields
    if enable_level_up is not None:
        prefs.enable_level_up = enable_level_up
    if enable_badge_earned is not None:
        prefs.enable_badge_earned = enable_badge_earned
    if enable_streak_milestone is not None:
        prefs.enable_streak_milestone = enable_streak_milestone
    if enable_rank_change is not None:
        prefs.enable_rank_change = enable_rank_change
    if enable_team_notifications is not None:
        prefs.enable_team_notifications = enable_team_notifications
    if enable_friend_notifications is not None:
        prefs.enable_friend_notifications = enable_friend_notifications
    if enable_challenge_notifications is not None:
        prefs.enable_challenge_notifications = enable_challenge_notifications
    if enable_system_notifications is not None:
        prefs.enable_system_notifications = enable_system_notifications
    if enable_course_notifications is not None:
        prefs.enable_course_notifications = enable_course_notifications
    if enable_in_app is not None:
        prefs.enable_in_app = enable_in_app
    if enable_email is not None:
        prefs.enable_email = enable_email
    if quiet_hours_enabled is not None:
        prefs.quiet_hours_enabled = quiet_hours_enabled
    if quiet_hours_start is not None:
        prefs.quiet_hours_start = quiet_hours_start
    if quiet_hours_end is not None:
        prefs.quiet_hours_end = quiet_hours_end

    await db.commit()
    await db.refresh(prefs)

    return {
        "enable_level_up": prefs.enable_level_up,
        "enable_badge_earned": prefs.enable_badge_earned,
        "enable_streak_milestone": prefs.enable_streak_milestone,
        "enable_rank_change": prefs.enable_rank_change,
        "enable_team_notifications": prefs.enable_team_notifications,
        "enable_friend_notifications": prefs.enable_friend_notifications,
        "enable_challenge_notifications": prefs.enable_challenge_notifications,
        "enable_system_notifications": prefs.enable_system_notifications,
        "enable_course_notifications": prefs.enable_course_notifications,
        "enable_in_app": prefs.enable_in_app,
        "enable_email": prefs.enable_email,
        "quiet_hours_enabled": prefs.quiet_hours_enabled,
        "quiet_hours_start": prefs.quiet_hours_start,
        "quiet_hours_end": prefs.quiet_hours_end,
    }

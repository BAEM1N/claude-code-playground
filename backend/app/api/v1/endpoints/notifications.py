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

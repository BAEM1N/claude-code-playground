"""
Notification service.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.notification import Notification
from ..schemas.notification import NotificationCreate
from .cache_service import cache_service


class NotificationService:
    """Service for managing notifications."""

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        notification: NotificationCreate
    ) -> Notification:
        """
        Create a new notification.

        Args:
            db: Database session
            notification: Notification data

        Returns:
            Created notification
        """
        db_notification = Notification(**notification.dict())
        db.add(db_notification)
        await db.commit()
        await db.refresh(db_notification)

        # Invalidate cache
        await cache_service.delete(f"notifications:{notification.user_id}:unread")

        return db_notification

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        """
        Get user notifications.

        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records
            unread_only: Only return unread notifications

        Returns:
            List of notifications
        """
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Mark notification as read.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for verification)

        Returns:
            True if successful
        """
        query = (
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
            .values(is_read=True)
        )

        result = await db.execute(query)
        await db.commit()

        # Invalidate cache
        await cache_service.delete(f"notifications:{user_id}:unread")

        return result.rowcount > 0

    @staticmethod
    async def mark_all_as_read(
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        """
        Mark all notifications as read.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Number of notifications marked as read
        """
        query = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
            .values(is_read=True)
        )

        result = await db.execute(query)
        await db.commit()

        # Invalidate cache
        await cache_service.delete(f"notifications:{user_id}:unread")

        return result.rowcount

    @staticmethod
    async def get_unread_count(
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        """
        Get count of unread notifications.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Count of unread notifications
        """
        # Try cache first
        cached_count = await cache_service.get_unread_notifications_count(str(user_id))
        if cached_count is not None:
            return cached_count

        # Query database
        from sqlalchemy import func
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )

        result = await db.execute(query)
        count = result.scalar()

        # Cache the result
        await cache_service.set_unread_notifications_count(str(user_id), count)

        return count

    @staticmethod
    async def create_mention_notification(
        db: AsyncSession,
        mentioned_user_id: UUID,
        message_id: UUID,
        channel_name: str,
        mentioner_name: str
    ):
        """
        Create notification for user mention.

        Args:
            db: Database session
            mentioned_user_id: ID of mentioned user
            message_id: Message ID
            channel_name: Channel name
            mentioner_name: Name of user who mentioned
        """
        notification = NotificationCreate(
            user_id=mentioned_user_id,
            type="mention",
            title=f"{mentioner_name} mentioned you in #{channel_name}",
            content=f"You were mentioned in a message",
            link=f"/channels/{message_id}",
            related_id=message_id
        )

        await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_file_upload_notification(
        db: AsyncSession,
        user_ids: List[UUID],
        file_name: str,
        course_name: str,
        file_id: UUID,
        uploader_name: str
    ):
        """
        Create notifications for file upload.

        Args:
            db: Database session
            user_ids: List of user IDs to notify
            file_name: Uploaded file name
            course_name: Course name
            file_id: File ID
            uploader_name: Name of uploader
        """
        for user_id in user_ids:
            notification = NotificationCreate(
                user_id=user_id,
                type="file_upload",
                title=f"New file uploaded in {course_name}",
                content=f"{uploader_name} uploaded {file_name}",
                link=f"/files/{file_id}",
                related_id=file_id
            )

            await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_announcement_notification(
        db: AsyncSession,
        user_ids: List[UUID],
        announcement_title: str,
        course_name: str,
        announcement_id: UUID
    ):
        """
        Create notifications for announcement.

        Args:
            db: Database session
            user_ids: List of user IDs to notify
            announcement_title: Announcement title
            course_name: Course name
            announcement_id: Announcement ID
        """
        for user_id in user_ids:
            notification = NotificationCreate(
                user_id=user_id,
                type="announcement",
                title=f"New announcement in {course_name}",
                content=announcement_title,
                link=f"/announcements/{announcement_id}",
                related_id=announcement_id
            )

            await NotificationService.create_notification(db, notification)


# Global notification service instance
notification_service = NotificationService()

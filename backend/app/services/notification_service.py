"""
Notification service.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from datetime import datetime

from ..models.notification import (
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationPreference
)
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

    # ==================== Gamification Notifications (NEW) ====================

    @staticmethod
    async def create_level_up_notification(
        db: AsyncSession,
        user_id: UUID,
        new_level: int,
        xp_gained: int
    ) -> Optional[Notification]:
        """레벨업 알림 생성"""
        # Check preferences
        prefs = await NotificationService._get_or_create_preferences(db, user_id)
        if not prefs.enable_level_up or not prefs.enable_in_app:
            return None

        notification = Notification(
            user_id=user_id,
            type="level_up",
            notification_type=NotificationType.LEVEL_UP,
            priority=NotificationPriority.HIGH,
            title=f"🎉 레벨 {new_level} 달성!",
            content=f"축하합니다! 레벨 {new_level}에 도달했습니다. (+{xp_gained} XP)",
            icon="👑",
            data={"new_level": new_level, "xp_gained": xp_gained},
            action_url="/gamification",
        )

        db.add(notification)
        await db.flush()

        # Invalidate cache
        await cache_service.delete(f"notifications:{user_id}:unread")

        return notification

    @staticmethod
    async def create_badge_earned_notification(
        db: AsyncSession,
        user_id: UUID,
        badge_name: str,
        badge_icon: str,
        badge_id: UUID,
        xp_reward: int,
        points_reward: int
    ) -> Optional[Notification]:
        """배지 획득 알림 생성"""
        # Check preferences
        prefs = await NotificationService._get_or_create_preferences(db, user_id)
        if not prefs.enable_badge_earned or not prefs.enable_in_app:
            return None

        notification = Notification(
            user_id=user_id,
            type="badge_earned",
            notification_type=NotificationType.BADGE_EARNED,
            priority=NotificationPriority.HIGH,
            title="🏅 새 배지 획득!",
            content=f'"{badge_name}" 배지를 획득했습니다! (+{xp_reward} XP, +{points_reward} P)',
            icon=badge_icon,
            data={
                "badge_id": str(badge_id),
                "badge_name": badge_name,
                "xp_reward": xp_reward,
                "points_reward": points_reward,
            },
            action_url="/gamification/badges",
            related_id=badge_id,
        )

        db.add(notification)
        await db.flush()

        # Invalidate cache
        await cache_service.delete(f"notifications:{user_id}:unread")

        return notification

    @staticmethod
    async def create_streak_milestone_notification(
        db: AsyncSession,
        user_id: UUID,
        streak_days: int
    ) -> Optional[Notification]:
        """스트릭 마일스톤 알림 생성"""
        milestones = [3, 7, 14, 30, 50, 100]
        if streak_days not in milestones:
            return None

        # Check preferences
        prefs = await NotificationService._get_or_create_preferences(db, user_id)
        if not prefs.enable_streak_milestone or not prefs.enable_in_app:
            return None

        emoji = "🔥"
        if streak_days >= 100:
            emoji = "🔥👑"
        elif streak_days >= 30:
            emoji = "🔥🔥🔥"
        elif streak_days >= 7:
            emoji = "🔥🔥"

        notification = Notification(
            user_id=user_id,
            type="streak_milestone",
            notification_type=NotificationType.STREAK_MILESTONE,
            priority=NotificationPriority.NORMAL,
            title=f"{emoji} {streak_days}일 연속 학습!",
            content=f"대단합니다! {streak_days}일 연속으로 학습하고 계십니다!",
            icon=emoji,
            data={"streak_days": streak_days},
            action_url="/gamification",
        )

        db.add(notification)
        await db.flush()

        # Invalidate cache
        await cache_service.delete(f"notifications:{user_id}:unread")

        return notification

    @staticmethod
    async def _get_or_create_preferences(
        db: AsyncSession,
        user_id: UUID
    ) -> NotificationPreference:
        """사용자 알림 설정 조회 또는 생성"""
        result = await db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
        prefs = result.scalar_one_or_none()

        if not prefs:
            prefs = NotificationPreference(user_id=user_id)
            db.add(prefs)
            await db.flush()

        return prefs


# Global notification service instance
notification_service = NotificationService()

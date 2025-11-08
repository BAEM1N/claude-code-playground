"""
Course management service for business logic.

This service handles course-related operations including member management,
notifications, and statistics.
"""
from typing import List, Dict, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseMember
from app.models.user import UserProfile
from app.services.notification_service import notification_service


class CourseService:
    """Service for course-related business logic."""

    @staticmethod
    async def get_course_statistics(
        db: AsyncSession,
        course_id: UUID
    ) -> Dict:
        """
        Calculate course statistics.

        Args:
            db: Database session
            course_id: Course ID

        Returns:
            Dictionary with:
            - total_members: int
            - instructors_count: int
            - assistants_count: int
            - students_count: int
            - active_members: int

        Example:
            >>> stats = await CourseService.get_course_statistics(db, course_id)
            >>> print(f"Total: {stats['total_members']}")
        """
        # Count members by role
        role_counts_query = (
            select(
                CourseMember.role,
                func.count(CourseMember.id).label('count')
            )
            .where(CourseMember.course_id == course_id)
            .group_by(CourseMember.role)
        )

        result = await db.execute(role_counts_query)
        role_counts = {row.role: row.count for row in result}

        total_members = sum(role_counts.values())

        return {
            'total_members': total_members,
            'instructors_count': role_counts.get('instructor', 0),
            'assistants_count': role_counts.get('assistant', 0),
            'students_count': role_counts.get('student', 0),
            'active_members': total_members
        }

    @staticmethod
    async def add_member_with_notification(
        db: AsyncSession,
        course_id: UUID,
        user_id: UUID,
        role: str,
        added_by_id: UUID
    ) -> CourseMember:
        """
        Add member to course and send notification.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID to add
            role: Member role (instructor, assistant, student)
            added_by_id: User ID who added the member

        Returns:
            Created CourseMember instance

        Example:
            >>> member = await CourseService.add_member_with_notification(
            ...     db, course_id, user_id, "student", instructor_id
            ... )
        """
        # Create member
        member = CourseMember(
            course_id=course_id,
            user_id=user_id,
            role=role
        )
        db.add(member)
        await db.flush()

        # Get course details
        course_query = select(Course).where(Course.id == course_id)
        course_result = await db.execute(course_query)
        course = course_result.scalar_one_or_none()

        if course:
            # Send notification to new member
            await notification_service.create_notification(
                db,
                type="course",
                title=f"강좌 추가됨: {course.name}",
                content=f"역할: {role}",
                link=f"/courses/{course_id}",
                related_id=course_id,
                user_id=user_id
            )

        await db.commit()
        return member

    @staticmethod
    async def remove_member_with_cleanup(
        db: AsyncSession,
        course_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Remove member from course and cleanup related data.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID to remove

        Returns:
            True if member was removed

        Example:
            >>> removed = await CourseService.remove_member_with_cleanup(
            ...     db, course_id, user_id
            ... )
        """
        # Get member
        member_query = select(CourseMember).where(
            CourseMember.course_id == course_id,
            CourseMember.user_id == user_id
        )
        result = await db.execute(member_query)
        member = result.scalar_one_or_none()

        if not member:
            return False

        # Delete member
        await db.delete(member)
        await db.commit()

        return True

    @staticmethod
    async def notify_course_members(
        db: AsyncSession,
        course_id: UUID,
        title: str,
        content: str,
        link: Optional[str] = None,
        roles: Optional[List[str]] = None
    ) -> int:
        """
        Send notification to all course members or specific roles.

        Args:
            db: Database session
            course_id: Course ID
            title: Notification title
            content: Notification content
            link: Optional link URL
            roles: Optional list of roles to notify (default: all)

        Returns:
            Number of notifications sent

        Example:
            >>> count = await CourseService.notify_course_members(
            ...     db, course_id, "공지사항", "새 공지가 있습니다",
            ...     roles=["student"]
            ... )
        """
        # Get members
        query = select(CourseMember).where(CourseMember.course_id == course_id)

        if roles:
            query = query.where(CourseMember.role.in_(roles))

        result = await db.execute(query)
        members = result.scalars().all()

        # Send notifications
        count = 0
        for member in members:
            await notification_service.create_notification(
                db,
                type="course",
                title=title,
                content=content,
                link=link or f"/courses/{course_id}",
                related_id=course_id,
                user_id=member.user_id
            )
            count += 1

        return count

    @staticmethod
    async def check_member_role(
        db: AsyncSession,
        course_id: UUID,
        user_id: UUID
    ) -> Optional[str]:
        """
        Check user's role in a course.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID

        Returns:
            Role string or None if not a member

        Example:
            >>> role = await CourseService.check_member_role(
            ...     db, course_id, user_id
            ... )
            >>> if role == "instructor":
            ...     # User is instructor
        """
        query = select(CourseMember.role).where(
            CourseMember.course_id == course_id,
            CourseMember.user_id == user_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def is_course_member(
        db: AsyncSession,
        course_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Check if user is a member of the course.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID

        Returns:
            True if user is a member

        Example:
            >>> is_member = await CourseService.is_course_member(
            ...     db, course_id, user_id
            ... )
        """
        query = select(CourseMember).where(
            CourseMember.course_id == course_id,
            CourseMember.user_id == user_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def get_course_members_by_role(
        db: AsyncSession,
        course_id: UUID,
        role: str
    ) -> List[CourseMember]:
        """
        Get all members of a specific role in a course.

        Args:
            db: Database session
            course_id: Course ID
            role: Role to filter by

        Returns:
            List of CourseMember instances

        Example:
            >>> students = await CourseService.get_course_members_by_role(
            ...     db, course_id, "student"
            ... )
        """
        query = select(CourseMember).where(
            CourseMember.course_id == course_id,
            CourseMember.role == role
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_user_courses(
        db: AsyncSession,
        user_id: UUID,
        role: Optional[str] = None
    ) -> List[Course]:
        """
        Get all courses for a user, optionally filtered by role.

        Args:
            db: Database session
            user_id: User ID
            role: Optional role filter

        Returns:
            List of Course instances

        Example:
            >>> courses = await CourseService.get_user_courses(
            ...     db, user_id, role="instructor"
            ... )
        """
        query = (
            select(Course)
            .join(CourseMember)
            .where(
                CourseMember.user_id == user_id,
                Course.is_active == True
            )
        )

        if role:
            query = query.where(CourseMember.role == role)

        query = query.order_by(Course.created_at.desc())

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_course_code(
        db: AsyncSession,
        course_id: UUID,
        new_code: str
    ) -> bool:
        """
        Update course code ensuring uniqueness.

        Args:
            db: Database session
            course_id: Course ID
            new_code: New course code

        Returns:
            True if updated successfully

        Raises:
            ValueError: If code already exists

        Example:
            >>> success = await CourseService.update_course_code(
            ...     db, course_id, "CS101-2025"
            ... )
        """
        # Check if code exists
        existing_query = select(Course).where(
            Course.code == new_code,
            Course.id != course_id
        )
        result = await db.execute(existing_query)
        if result.scalar_one_or_none():
            raise ValueError(f"Course code '{new_code}' already exists")

        # Update code
        course_query = select(Course).where(Course.id == course_id)
        course_result = await db.execute(course_query)
        course = course_result.scalar_one_or_none()

        if not course:
            return False

        course.code = new_code
        await db.commit()
        return True


# Create singleton instance
course_service = CourseService()

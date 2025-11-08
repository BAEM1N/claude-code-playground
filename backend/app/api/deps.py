"""
API dependencies.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.course import CourseMember
from sqlalchemy import select


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Get current active user.

    Args:
        current_user: Current user from token

    Returns:
        dict: User information
    """
    return current_user


async def get_user_course_role(
    course_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Optional[str]:
    """
    Get user's role in a course.

    Args:
        course_id: Course ID
        current_user: Current user
        db: Database session

    Returns:
        str: User's role or None
    """
    user_id = UUID(current_user["id"])

    query = select(CourseMember).where(
        CourseMember.course_id == course_id,
        CourseMember.user_id == user_id
    )

    result = await db.execute(query)
    member = result.scalar_one_or_none()

    return member.role if member else None


async def require_course_member(
    course_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Require user to be a course member.

    Args:
        course_id: Course ID
        current_user: Current user
        db: Database session

    Returns:
        dict: User with role information

    Raises:
        HTTPException: If user is not a course member
    """
    role = await get_user_course_role(course_id, current_user, db)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this course"
        )

    return {**current_user, "course_role": role}


async def require_instructor_or_assistant(
    course_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Require user to be instructor or assistant.

    Args:
        course_id: Course ID
        current_user: Current user
        db: Database session

    Returns:
        dict: User with role information

    Raises:
        HTTPException: If user is not instructor or assistant
    """
    role = await get_user_course_role(course_id, current_user, db)

    if role not in ["instructor", "assistant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an instructor or assistant"
        )

    return {**current_user, "course_role": role}


async def require_instructor(
    course_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Require user to be instructor.

    Args:
        course_id: Course ID
        current_user: Current user
        db: Database session

    Returns:
        dict: User with role information

    Raises:
        HTTPException: If user is not instructor
    """
    role = await get_user_course_role(course_id, current_user, db)

    if role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an instructor"
        )

    return {**current_user, "course_role": role}

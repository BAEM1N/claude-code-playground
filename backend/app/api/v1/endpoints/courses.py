"""
Course endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import get_current_active_user, require_course_member, require_instructor
from ....models.course import Course, CourseMember
from ....models.file import Folder
from ....schemas.course import (
    Course as CourseSchema,
    CourseCreate,
    CourseUpdate,
    CourseMember as CourseMemberSchema,
    CourseMemberCreate
)
from ....services.cache_service import cache_service

router = APIRouter()


@router.get("", response_model=List[CourseSchema])
async def get_my_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get courses that current user is a member of.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records

    Returns:
        List[Course]: List of courses
    """
    user_id = UUID(current_user["id"])

    # Query courses through membership
    query = (
        select(Course)
        .join(CourseMember)
        .where(CourseMember.user_id == user_id)
        .where(Course.is_active == True)
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    courses = result.scalars().all()

    return courses


@router.post("", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new course.

    Args:
        course_data: Course data

    Returns:
        Course: Created course
    """
    user_id = UUID(current_user["id"])

    # Create course
    course = Course(
        **course_data.dict(),
        instructor_id=user_id
    )
    db.add(course)
    await db.flush()

    # Add creator as instructor member
    member = CourseMember(
        course_id=course.id,
        user_id=user_id,
        role="instructor"
    )
    db.add(member)

    # Create default folders
    default_folders = [
        {"name": "강의자료", "parent": None},
        {"name": "과제", "parent": None},
        {"name": "공지", "parent": None},
    ]

    for folder_data in default_folders:
        folder = Folder(
            course_id=course.id,
            name=folder_data["name"],
            created_by=user_id
        )
        db.add(folder)

    await db.commit()
    await db.refresh(course)

    return course


@router.get("/{course_id}", response_model=CourseSchema)
async def get_course(
    course_id: UUID,
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get course details.

    Args:
        course_id: Course ID

    Returns:
        Course: Course details
    """
    # Try cache first
    cached_course = await cache_service.get_course(str(course_id))
    if cached_course:
        return cached_course

    query = select(Course).where(Course.id == course_id)
    result = await db.execute(query)
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Cache the result
    course_dict = {
        "id": str(course.id),
        "name": course.name,
        "description": course.description,
        "code": course.code,
        "instructor_id": str(course.instructor_id),
        "is_active": course.is_active,
        "created_at": course.created_at.isoformat(),
        "updated_at": course.updated_at.isoformat()
    }
    await cache_service.set_course(str(course_id), course_dict)

    return course


@router.put("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Update course.

    Args:
        course_id: Course ID
        course_data: Updated course data

    Returns:
        Course: Updated course
    """
    query = select(Course).where(Course.id == course_id)
    result = await db.execute(query)
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Update course
    for field, value in course_data.dict(exclude_unset=True).items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)

    # Invalidate cache
    await cache_service.invalidate_course(str(course_id))

    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete (deactivate) course.

    Args:
        course_id: Course ID
    """
    query = select(Course).where(Course.id == course_id)
    result = await db.execute(query)
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Soft delete
    course.is_active = False
    await db.commit()

    # Invalidate cache
    await cache_service.invalidate_course(str(course_id))


@router.get("/{course_id}/members", response_model=List[CourseMemberSchema])
async def get_course_members(
    course_id: UUID,
    current_user: dict = Depends(require_course_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get course members.

    Args:
        course_id: Course ID

    Returns:
        List[CourseMember]: List of course members
    """
    query = select(CourseMember).where(CourseMember.course_id == course_id)
    result = await db.execute(query)
    members = result.scalars().all()

    return members


@router.post("/{course_id}/members", response_model=CourseMemberSchema, status_code=status.HTTP_201_CREATED)
async def add_course_member(
    course_id: UUID,
    member_data: CourseMemberCreate,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Add member to course.

    Args:
        course_id: Course ID
        member_data: Member data

    Returns:
        CourseMember: Added member
    """
    # Check if member already exists
    query = select(CourseMember).where(
        CourseMember.course_id == course_id,
        CourseMember.user_id == member_data.user_id
    )
    result = await db.execute(query)
    existing_member = result.scalar_one_or_none()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this course"
        )

    # Add member
    member = CourseMember(
        course_id=course_id,
        **member_data.dict()
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    # Invalidate cache
    await cache_service.delete(f"course:{course_id}:members")

    return member


@router.delete("/{course_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_course_member(
    course_id: UUID,
    user_id: UUID,
    current_user: dict = Depends(require_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove member from course.

    Args:
        course_id: Course ID
        user_id: User ID to remove
    """
    query = select(CourseMember).where(
        CourseMember.course_id == course_id,
        CourseMember.user_id == user_id
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    await db.delete(member)
    await db.commit()

    # Invalidate cache
    await cache_service.delete(f"course:{course_id}:members")

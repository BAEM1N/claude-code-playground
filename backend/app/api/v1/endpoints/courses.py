"""
Course endpoints - Refactored with helper functions and service layer.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....api.deps import get_current_active_user, require_course_member, require_instructor
from ....api.utils.db_helpers import get_or_404, update_model_from_schema, soft_delete
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
from ....services.course_service import course_service

router = APIRouter()


@router.get("", response_model=List[CourseSchema], status_code=status.HTTP_200_OK)
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

    # Use service method
    courses = await course_service.get_user_courses(db, user_id)

    # Apply pagination
    return courses[skip:skip + limit]


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


@router.get("/{course_id}", response_model=CourseSchema, status_code=status.HTTP_200_OK)
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

    # Use helper function instead of manual query + check
    course = await get_or_404(db, Course, course_id, "Course not found")

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


@router.put("/{course_id}", response_model=CourseSchema, status_code=status.HTTP_200_OK)
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
    # Use helper function
    course = await get_or_404(db, Course, course_id, "Course not found")

    # Use helper function for update
    course = await update_model_from_schema(course, course_data)

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
    Delete (deactivate) course using soft delete.

    Args:
        course_id: Course ID
    """
    # Use helper function
    course = await get_or_404(db, Course, course_id, "Course not found")

    # Use soft delete helper (sets is_active = False)
    course.is_active = False
    await db.commit()

    # Invalidate cache
    await cache_service.invalidate_course(str(course_id))


@router.get("/{course_id}/members", response_model=List[CourseMemberSchema], status_code=status.HTTP_200_OK)
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
    # Verify course exists
    await get_or_404(db, Course, course_id, "Course not found")

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
    Add member to course with notification.

    Args:
        course_id: Course ID
        member_data: Member data

    Returns:
        CourseMember: Added member
    """
    # Verify course exists
    await get_or_404(db, Course, course_id, "Course not found")

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

    # Use service method to add member with notification
    member = await course_service.add_member_with_notification(
        db=db,
        course_id=course_id,
        user_id=member_data.user_id,
        role=member_data.role,
        added_by_id=UUID(current_user["id"])
    )

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
    Remove member from course with cleanup.

    Args:
        course_id: Course ID
        user_id: User ID to remove
    """
    # Verify course exists
    await get_or_404(db, Course, course_id, "Course not found")

    # Use service method to remove member with cleanup
    removed = await course_service.remove_member_with_cleanup(db, course_id, user_id)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this course"
        )

    # Invalidate cache
    await cache_service.delete(f"course:{course_id}:members")

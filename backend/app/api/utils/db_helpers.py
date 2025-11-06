"""
Database helper utilities for common operations.

This module provides reusable functions for common database patterns
to reduce code duplication and improve consistency.
"""
from typing import Type, TypeVar, Optional
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase


T = TypeVar('T', bound=DeclarativeBase)


async def get_or_404(
    db: AsyncSession,
    model: Type[T],
    id: UUID,
    error_message: Optional[str] = None
) -> T:
    """
    Get object by ID or raise 404 error.

    Args:
        db: Database session
        model: SQLAlchemy model class
        id: Object ID
        error_message: Custom error message (default: "{ModelName} not found")

    Returns:
        Model instance

    Raises:
        HTTPException: 404 if object not found

    Example:
        >>> assignment = await get_or_404(db, Assignment, assignment_id)
        >>> course = await get_or_404(db, Course, course_id, "Course not found")
    """
    query = select(model).where(model.id == id)
    result = await db.execute(query)
    obj = result.scalar_one_or_none()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message or f"{model.__name__} not found"
        )

    return obj


async def get_or_none(
    db: AsyncSession,
    model: Type[T],
    id: UUID
) -> Optional[T]:
    """
    Get object by ID or return None.

    Args:
        db: Database session
        model: SQLAlchemy model class
        id: Object ID

    Returns:
        Model instance or None

    Example:
        >>> assignment = await get_or_none(db, Assignment, assignment_id)
        >>> if assignment is None:
        ...     # Handle not found case
    """
    query = select(model).where(model.id == id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_model_from_schema(
    obj: T,
    schema: BaseModel,
    exclude_unset: bool = True,
    exclude_none: bool = False
) -> T:
    """
    Update model instance from Pydantic schema.

    Args:
        obj: SQLAlchemy model instance to update
        schema: Pydantic schema with update data
        exclude_unset: Only update fields that were explicitly set (default: True)
        exclude_none: Exclude None values from update (default: False)

    Returns:
        Updated model instance

    Example:
        >>> assignment = await get_or_404(db, Assignment, assignment_id)
        >>> assignment = await update_model_from_schema(assignment, assignment_data)
        >>> await db.commit()
    """
    update_data = schema.dict(exclude_unset=exclude_unset, exclude_none=exclude_none)

    for field, value in update_data.items():
        setattr(obj, field, value)

    return obj


async def soft_delete(
    db: AsyncSession,
    obj: T
) -> None:
    """
    Soft delete an object by setting is_deleted flag.

    Args:
        db: Database session
        obj: Model instance to soft delete

    Raises:
        AttributeError: If model doesn't have is_deleted field

    Example:
        >>> assignment = await get_or_404(db, Assignment, assignment_id)
        >>> await soft_delete(db, assignment)
    """
    if not hasattr(obj, 'is_deleted'):
        raise AttributeError(
            f"{obj.__class__.__name__} does not have 'is_deleted' field"
        )

    obj.is_deleted = True
    await db.commit()


async def bulk_soft_delete(
    db: AsyncSession,
    objects: list[T]
) -> None:
    """
    Soft delete multiple objects.

    Args:
        db: Database session
        objects: List of model instances to soft delete

    Example:
        >>> submissions = await get_submissions(db, assignment_id)
        >>> await bulk_soft_delete(db, submissions)
    """
    for obj in objects:
        if not hasattr(obj, 'is_deleted'):
            raise AttributeError(
                f"{obj.__class__.__name__} does not have 'is_deleted' field"
            )
        obj.is_deleted = True

    await db.commit()


async def check_exists(
    db: AsyncSession,
    model: Type[T],
    id: UUID
) -> bool:
    """
    Check if object exists by ID.

    Args:
        db: Database session
        model: SQLAlchemy model class
        id: Object ID

    Returns:
        True if exists, False otherwise

    Example:
        >>> exists = await check_exists(db, Course, course_id)
        >>> if not exists:
        ...     raise HTTPException(status_code=404, detail="Course not found")
    """
    query = select(model).where(model.id == id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None

"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from ....core.database import get_db
from ....core.security import get_current_user
from ....api.utils import get_or_404, update_model_from_schema
from ....models.user import UserProfile
from ....schemas.user import UserProfile as UserProfileSchema, UserProfileCreate, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfileSchema, status_code=status.HTTP_200_OK)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user profile.

    Returns:
        UserProfile: Current user profile
    """
    user_id = UUID(current_user["id"])
    profile = await get_or_404(db, UserProfile, user_id, "User profile not found")
    return profile


@router.post("/profile", response_model=UserProfileSchema, status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create user profile (usually after first Supabase login).

    Args:
        profile_data: User profile data

    Returns:
        UserProfile: Created user profile
    """
    # Check if profile already exists
    query = select(UserProfile).where(UserProfile.id == profile_data.id)
    result = await db.execute(query)
    existing_profile = result.scalar_one_or_none()

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile already exists"
        )

    # Create new profile
    profile = UserProfile(**profile_data.dict())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile


@router.put("/profile", response_model=UserProfileSchema, status_code=status.HTTP_200_OK)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user profile.

    Args:
        profile_data: Updated profile data

    Returns:
        UserProfile: Updated user profile
    """
    user_id = UUID(current_user["id"])
    profile = await get_or_404(db, UserProfile, user_id, "User profile not found")

    # Update profile
    profile = await update_model_from_schema(profile, profile_data)

    await db.commit()
    await db.refresh(profile)

    return profile

"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel

from ....core.database import get_db
from ....core.security import (
    get_current_user,
    verify_supabase_token,
    generate_csrf_token,
    set_auth_cookies,
    clear_auth_cookies
)
from ....core.rate_limit import get_rate_limiter
from ....api.utils import get_or_404, update_model_from_schema
from ....models.user import UserProfile
from ....schemas.user import UserProfile as UserProfileSchema, UserProfileCreate, UserProfileUpdate

router = APIRouter()

# Rate limiters
login_rate_limiter = get_rate_limiter("5/minute")  # Stricter for auth
general_rate_limiter = get_rate_limiter("20/minute")


class LoginRequest(BaseModel):
    """Request model for setting auth cookies after Supabase login."""
    access_token: str


class LoginResponse(BaseModel):
    """Response model for login."""
    message: str
    csrf_token: str
    user: dict


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login_with_cookies(
    request: Request,
    login_data: LoginRequest,
    response: Response
):
    """
    Set authentication cookies after Supabase login.

    The client should first authenticate with Supabase, then send the token here
    to set secure HTTP-only cookies.

    Rate limited to 5 requests per minute to prevent brute force attacks.

    Args:
        request: FastAPI request object
        login_data: Login request containing access token from Supabase
        response: FastAPI response object

    Returns:
        LoginResponse: Login success message with CSRF token
    """
    # Apply rate limiting
    await login_rate_limiter.check_rate_limit(request)

    from jose import jwt
    from ....core.config import settings

    # Verify the token
    try:
        payload = jwt.decode(
            login_data.access_token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # Generate CSRF token
    csrf_token = generate_csrf_token()

    # Set cookies
    set_auth_cookies(response, login_data.access_token, csrf_token)

    # Extract user info
    user_info = {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role")
    }

    return LoginResponse(
        message="Login successful",
        csrf_token=csrf_token,
        user=user_info
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """
    Logout and clear authentication cookies.

    Rate limited to 20 requests per minute.

    Args:
        request: FastAPI request object
        response: FastAPI response object
        current_user: Current authenticated user

    Returns:
        dict: Logout success message
    """
    # Apply rate limiting
    await general_rate_limiter.check_rate_limit(request)

    clear_auth_cookies(response)
    return {"message": "Logout successful"}


@router.get("/csrf-token", status_code=status.HTTP_200_OK)
async def get_csrf_token():
    """
    Get a new CSRF token (for initial page load).

    Returns:
        dict: CSRF token
    """
    csrf_token = generate_csrf_token()
    return {"csrf_token": csrf_token}


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

"""
Security utilities for authentication and authorization.
"""
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from .config import settings

security = HTTPBearer()


def get_supabase_client() -> Client:
    """
    Create and return Supabase client.

    Returns:
        Client: Supabase client instance
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token and return user info.

    Args:
        credentials: HTTP authorization credentials

    Returns:
        dict: Decoded JWT payload with user info

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        # Decode and verify JWT token
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False}  # Supabase tokens don't always have aud
        )

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )

        return payload

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


async def get_current_user(
    token_payload: dict = Depends(verify_supabase_token)
) -> dict:
    """
    Get current authenticated user from token.

    Args:
        token_payload: Decoded JWT payload

    Returns:
        dict: User information

    Raises:
        HTTPException: If user not found in token
    """
    user_id = token_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    return {
        "id": user_id,
        "email": token_payload.get("email"),
        "role": token_payload.get("role"),
    }


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.

    Args:
        data: Data to encode in token
        expires_delta: Token expiration time

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def check_permission(user_role: str, required_role: str) -> bool:
    """
    Check if user has required permission based on role.

    Args:
        user_role: User's current role
        required_role: Required role for the action

    Returns:
        bool: True if user has permission
    """
    role_hierarchy = {
        "student": 1,
        "assistant": 2,
        "instructor": 3,
    }

    user_level = role_hierarchy.get(user_role, 0)
    required_level = role_hierarchy.get(required_role, 0)

    return user_level >= required_level

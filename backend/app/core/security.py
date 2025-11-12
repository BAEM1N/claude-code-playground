"""
Security utilities for authentication and authorization.
"""
from typing import Optional
from datetime import datetime, timedelta
import secrets
import logging
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Request, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from .config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)  # Allow optional bearer token


def get_supabase_client() -> Client:
    """
    Create and return Supabase client.

    Returns:
        Client: Supabase client instance
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def get_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Extract token from either cookie or Authorization header.
    Cookie takes precedence for better security.

    Args:
        request: FastAPI request object
        credentials: Optional HTTP authorization credentials

    Returns:
        str: JWT token or None if not found
    """
    # Try to get token from cookie first (more secure)
    token = request.cookies.get("access_token")

    if token:
        logger.debug("Token found in cookie")
        return token

    # Fall back to Authorization header for backward compatibility
    if credentials:
        logger.debug("Token found in Authorization header")
        return credentials.credentials

    return None


async def verify_supabase_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token and return user info.
    Supports both cookie-based and header-based authentication.

    Args:
        request: FastAPI request object
        credentials: Optional HTTP authorization credentials

    Returns:
        dict: Decoded JWT payload with user info

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = await get_token_from_request(request, credentials)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
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


def generate_csrf_token() -> str:
    """
    Generate a secure CSRF token.

    Returns:
        str: Random CSRF token
    """
    return secrets.token_urlsafe(32)


def set_auth_cookies(response: Response, access_token: str, csrf_token: str) -> None:
    """
    Set authentication cookies with secure flags.

    Args:
        response: FastAPI response object
        access_token: JWT access token
        csrf_token: CSRF token
    """
    # Set access token cookie (HTTP-only, Secure, SameSite=Strict)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=settings.ENVIRONMENT == "production",  # HTTPS only in production
        samesite="strict",  # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        path="/",
    )

    # Set CSRF token cookie (readable by JavaScript for sending in headers)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # JavaScript needs to read this
        secure=settings.ENVIRONMENT == "production",
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    logger.info("Authentication cookies set successfully")


def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies on logout.

    Args:
        response: FastAPI response object
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    logger.info("Authentication cookies cleared")


async def verify_csrf_token(request: Request) -> None:
    """
    Verify CSRF token for state-changing operations.

    Args:
        request: FastAPI request object

    Raises:
        HTTPException: If CSRF token is missing or invalid
    """
    # Skip CSRF check for GET, HEAD, OPTIONS
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return

    # Get CSRF token from cookie
    csrf_cookie = request.cookies.get("csrf_token")

    # Get CSRF token from header
    csrf_header = request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header:
        logger.warning("CSRF token missing")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing"
        )

    if csrf_cookie != csrf_header:
        logger.warning("CSRF token mismatch")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid"
        )

    logger.debug("CSRF token verified successfully")

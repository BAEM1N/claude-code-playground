"""
Application configuration module.
Environment-specific configuration management.
"""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class BaseConfig(BaseSettings):
    """Base configuration shared across all environments."""

    # Application
    APP_NAME: str = "통합 커뮤니케이션 & 파일 관리 시스템"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    # Default: SQLite for development. Use PostgreSQL in production (set via environment variable)
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    # MinIO (Object Storage)
    # IMPORTANT: These credentials MUST be set via environment variables in production
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str  # Required - no default for security
    MINIO_SECRET_KEY: str  # Required - no default for security
    MINIO_BUCKET_NAME: str = "course-files"
    MINIO_SECURE: bool = False

    # CORS
    # Set via environment variable (comma-separated): CORS_ORIGINS="http://example.com,http://app.example.com"
    CORS_ORIGINS: List[str] = []

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    @field_validator("ALLOWED_FILE_TYPES", mode="before")
    @classmethod
    def assemble_allowed_file_types(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Security
    # CRITICAL: SECRET_KEY MUST be set via environment variable
    # Generate a secure key: openssl rand -hex 32
    SECRET_KEY: str  # Required - no default for security
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File Upload
    MAX_FILE_SIZE: int = 104857600  # 100MB
    ALLOWED_FILE_TYPES: List[str] = [
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "txt", "jpg", "jpeg", "png", "gif", "mp4", "mp3", "zip"
    ]

    # WebSocket
    WS_MESSAGE_QUEUE: str = "ws:messages"
    WS_HEARTBEAT_INTERVAL: int = 30

    # Cache TTL (seconds)
    CACHE_USER_PROFILE_TTL: int = 3600
    CACHE_COURSE_TTL: int = 3600
    CACHE_COURSE_MEMBERS_TTL: int = 1800
    CACHE_MESSAGES_TTL: int = 600
    CACHE_NOTIFICATIONS_TTL: int = 300

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database: SQLite for development
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # CORS: Allow local development origins
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]

    # Cache TTL: Shorter for development
    CACHE_USER_PROFILE_TTL: int = 300  # 5 minutes
    CACHE_COURSE_TTL: int = 300
    CACHE_COURSE_MEMBERS_TTL: int = 180
    CACHE_MESSAGES_TTL: int = 60
    CACHE_NOTIFICATIONS_TTL: int = 30


class StagingConfig(BaseConfig):
    """Staging environment configuration."""

    DEBUG: bool = False
    ENVIRONMENT: str = "staging"

    # Database: PostgreSQL required
    DATABASE_URL: str  # Must be set via environment variable

    # CORS: Must be set via environment variable
    CORS_ORIGINS: List[str] = []

    # MinIO: Secure connection required
    MINIO_SECURE: bool = True

    # Cache TTL: Moderate for staging
    CACHE_USER_PROFILE_TTL: int = 1800  # 30 minutes
    CACHE_COURSE_TTL: int = 1800
    CACHE_COURSE_MEMBERS_TTL: int = 900
    CACHE_MESSAGES_TTL: int = 300
    CACHE_NOTIFICATIONS_TTL: int = 180


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database: PostgreSQL required
    DATABASE_URL: str  # Must be set via environment variable

    # CORS: Must be set via environment variable (comma-separated)
    CORS_ORIGINS: List[str] = []

    # MinIO: Secure connection required
    MINIO_SECURE: bool = True

    # Security: Stricter token expiration
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # Cache TTL: Longer for production
    CACHE_USER_PROFILE_TTL: int = 3600  # 1 hour
    CACHE_COURSE_TTL: int = 3600
    CACHE_COURSE_MEMBERS_TTL: int = 1800
    CACHE_MESSAGES_TTL: int = 600
    CACHE_NOTIFICATIONS_TTL: int = 300


def get_settings() -> BaseConfig:
    """
    Get configuration based on ENVIRONMENT variable.

    Returns:
        Appropriate configuration instance based on environment.

    Example:
        settings = get_settings()
    """
    env = os.getenv("ENVIRONMENT", "development").lower()

    config_map = {
        "development": DevelopmentConfig,
        "dev": DevelopmentConfig,
        "staging": StagingConfig,
        "stage": StagingConfig,
        "production": ProductionConfig,
        "prod": ProductionConfig,
    }

    config_class = config_map.get(env, DevelopmentConfig)
    return config_class()


# Create settings instance based on environment
settings = get_settings()

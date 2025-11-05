"""
Application configuration module.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "통합 커뮤니케이션 & 파일 관리 시스템"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
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

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "course-files"
    MINIO_SECURE: bool = False

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

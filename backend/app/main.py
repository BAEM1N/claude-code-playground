"""
Main FastAPI application.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from uuid import UUID

from .core.config import settings
from .core.database import init_db, close_db, get_db
from .core.security import get_current_user
from .api.v1.api import api_router
from .services.cache_service import cache_service
from .services.storage_service import storage_service
from .websocket.connection_manager import manager
from .websocket.handlers import EVENT_HANDLERS
from sqlalchemy.ext.asyncio import AsyncSession


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    """
    # Startup
    print("🚀 Starting application...")

    # Initialize database
    await init_db()
    print("✅ Database initialized")

    # Connect to Redis
    await cache_service.connect()
    print("✅ Redis connected")

    # Ensure MinIO bucket exists
    storage_service.ensure_bucket()
    print("✅ MinIO bucket ensured")

    yield

    # Shutdown
    print("🛑 Shutting down application...")

    await cache_service.disconnect()
    await close_db()

    print("✅ Application shut down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## 통합 LMS (Learning Management System) API

    이 API는 강의 관리, 과제 제출, 퀴즈/시험, 출석 체크, 학습 진도 추적, 실시간 커뮤니케이션 등의 기능을 제공합니다.

    ### 주요 기능

    * **인증 및 사용자 관리**: Supabase 기반 인증
    * **강의 관리**: 강의 생성, 수정, 학생 관리
    * **과제 시스템**: 과제 생성, 제출, 채점
    * **퀴즈/시험**: 자동 채점, 부정행위 감지, 통계
    * **출석 체크**: QR 코드, 비밀번호, 위치 기반 출석
    * **학습 진도**: 진도 추적, 업적 시스템, 리더보드
    * **캘린더**: 강의 일정, 과제 마감일, 이벤트 관리
    * **실시간 커뮤니케이션**: WebSocket 기반 채팅 및 알림
    * **파일 관리**: MinIO 기반 파일 업로드/다운로드

    ### 인증

    대부분의 API는 인증이 필요합니다. `Authorization: Bearer <token>` 헤더를 사용하세요.
    """,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG or settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.DEBUG or settings.ENVIRONMENT == "development" else None,
    openapi_url="/api/openapi.json",
    openapi_tags=[
        {"name": "auth", "description": "인증 및 사용자 관리"},
        {"name": "courses", "description": "강의 관리 (생성, 수정, 삭제, 학생 관리)"},
        {"name": "assignments", "description": "과제 시스템 (과제 생성, 제출, 채점)"},
        {"name": "quiz", "description": "퀴즈/시험 시스템 (문제 관리, 응시, 채점, 통계)"},
        {"name": "attendance", "description": "출석 체크 (QR 코드, 비밀번호, 위치 기반)"},
        {"name": "progress", "description": "학습 진도 추적 (업적, 리더보드, 통계)"},
        {"name": "calendar", "description": "캘린더 시스템 (이벤트, 일정 관리, RSVP)"},
        {"name": "channels", "description": "채널 관리 (강의별 커뮤니케이션 채널)"},
        {"name": "messages", "description": "메시지 시스템 (채팅, 댓글, 답글)"},
        {"name": "files", "description": "파일 관리 (업로드, 다운로드, 삭제)"},
        {"name": "notifications", "description": "알림 시스템 (실시간 알림, 읽음 처리)"},
    ],
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT License",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.websocket("/ws/{course_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    course_id: str
):
    """
    WebSocket endpoint for real-time communication.

    Security: Token must be sent in the first message to avoid exposure in logs.

    First message format:
    {
        "type": "auth",
        "token": "your-jwt-token"
    }

    Args:
        websocket: WebSocket connection
        course_id: Course ID
    """
    # Accept connection first
    await websocket.accept()

    try:
        # Wait for authentication message (with timeout)
        import asyncio
        auth_message = await asyncio.wait_for(
            websocket.receive_json(),
            timeout=5.0  # 5 second timeout
        )

        # Verify auth message format
        if auth_message.get("type") != "auth":
            await websocket.close(code=1008, reason="First message must be authentication")
            return

        token = auth_message.get("token")
        if not token:
            await websocket.close(code=1008, reason="Missing authentication token")
            return

        # Verify token
        from .core.security import verify_supabase_token

        credentials = type('obj', (object,), {'credentials': token})
        payload = await verify_supabase_token(credentials)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return

        # Send authentication success
        await websocket.send_json({"type": "auth_success", "user_id": user_id})

    except asyncio.TimeoutError:
        await websocket.close(code=1008, reason="Authentication timeout")
        return
    except Exception as e:
        print(f"Authentication error: {e}")
        await websocket.close(code=1008, reason="Authentication failed")
        return

    # Connect to course room
    await manager.connect(websocket, course_id, user_id)

    try:
        # Get database session
        from .core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            while True:
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)

                event_type = message.get("type")
                event_data = message.get("data", {})

                # Handle event
                handler = EVENT_HANDLERS.get(event_type)
                if handler:
                    try:
                        # Check if handler needs db
                        import inspect
                        sig = inspect.signature(handler)
                        if "db" in sig.parameters:
                            await handler(event_data, websocket, course_id, user_id, db)
                        else:
                            await handler(event_data, websocket, course_id, user_id)
                    except Exception as e:
                        print(f"Error handling event {event_type}: {e}")
                        await manager.send_personal_message(
                            {"type": "error", "message": str(e)},
                            websocket
                        )
                else:
                    await manager.send_personal_message(
                        {"type": "error", "message": f"Unknown event type: {event_type}"},
                        websocket
                    )

    except WebSocketDisconnect:
        manager.disconnect(websocket, course_id)
        print(f"Client {user_id} disconnected from course {course_id}")

    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, course_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

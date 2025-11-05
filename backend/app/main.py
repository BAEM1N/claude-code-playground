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
    lifespan=lifespan
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
    course_id: str,
    token: str = None
):
    """
    WebSocket endpoint for real-time communication.

    Args:
        websocket: WebSocket connection
        course_id: Course ID
        token: Authentication token (query parameter)
    """
    # Authenticate user
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    try:
        # Verify token (simplified - in production, use proper token verification)
        from .core.security import verify_supabase_token
        from fastapi.security import HTTPAuthorizationCredentials

        # Create credentials object
        credentials = type('obj', (object,), {'credentials': token})

        # Verify token
        payload = await verify_supabase_token(credentials)
        user_id = payload.get("sub")

        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
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

"""
WebSocket handlers for collaborative coding
"""
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ..models.coding import CollaborativeCodingSession, SessionParticipant
from .connection_manager import manager

logger = logging.getLogger(__name__)


async def handle_code_change(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle real-time code changes in collaborative session"""
    try:
        coding_session_id = data.get("coding_session_id")
        new_code = data.get("code", "")
        cursor_position = data.get("cursor_position")

        if not coding_session_id:
            return

        # Update session code
        result = await db.execute(
            select(CollaborativeCodingSession)
            .where(CollaborativeCodingSession.id == coding_session_id)
        )
        coding_session = result.scalar_one_or_none()

        if not coding_session:
            return

        # Update code
        coding_session.code = new_code
        coding_session.updated_at = datetime.utcnow()

        # Update participant cursor position
        participant_result = await db.execute(
            select(SessionParticipant)
            .where(SessionParticipant.session_id == coding_session_id)
            .where(SessionParticipant.user_id == int(user_id))
        )
        participant = participant_result.scalar_one_or_none()

        if participant and cursor_position:
            participant.cursor_position = cursor_position

        await db.commit()

        # Broadcast to all participants in the session
        broadcast_data = {
            "type": "code_sync",
            "coding_session_id": coding_session_id,
            "code": new_code,
            "user_id": user_id,
            "cursor_position": cursor_position,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Send to all connections in the course
        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling code change: {str(e)}", exc_info=True)


async def handle_cursor_move(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle cursor position updates"""
    try:
        coding_session_id = data.get("coding_session_id")
        cursor_position = data.get("cursor_position")

        if not coding_session_id or not cursor_position:
            return

        # Update participant cursor position
        result = await db.execute(
            select(SessionParticipant)
            .where(SessionParticipant.session_id == coding_session_id)
            .where(SessionParticipant.user_id == int(user_id))
        )
        participant = result.scalar_one_or_none()

        if participant:
            participant.cursor_position = cursor_position
            await db.commit()

            # Broadcast cursor position to others
            broadcast_data = {
                "type": "cursor_update",
                "coding_session_id": coding_session_id,
                "user_id": user_id,
                "cursor_position": cursor_position,
            }

            await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling cursor move: {str(e)}", exc_info=True)


async def handle_session_join(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle user joining a collaborative coding session"""
    try:
        coding_session_id = data.get("coding_session_id")

        if not coding_session_id:
            return

        # Get session
        result = await db.execute(
            select(CollaborativeCodingSession)
            .where(CollaborativeCodingSession.id == coding_session_id)
        )
        coding_session = result.scalar_one_or_none()

        if not coding_session:
            return

        # Notify all participants
        broadcast_data = {
            "type": "user_joined",
            "coding_session_id": coding_session_id,
            "user_id": user_id,
            "current_code": coding_session.code,
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling session join: {str(e)}", exc_info=True)


async def handle_session_leave(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle user leaving a collaborative coding session"""
    try:
        coding_session_id = data.get("coding_session_id")

        if not coding_session_id:
            return

        # Update participant status
        result = await db.execute(
            select(SessionParticipant)
            .where(SessionParticipant.session_id == coding_session_id)
            .where(SessionParticipant.user_id == int(user_id))
        )
        participant = result.scalar_one_or_none()

        if participant:
            participant.is_active = False
            participant.left_at = datetime.utcnow()
            await db.commit()

        # Notify all participants
        broadcast_data = {
            "type": "user_left",
            "coding_session_id": coding_session_id,
            "user_id": user_id,
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling session leave: {str(e)}", exc_info=True)


# Register handlers
CODING_HANDLERS = {
    "code_change": handle_code_change,
    "cursor_move": handle_cursor_move,
    "session_join": handle_session_join,
    "session_leave": handle_session_leave,
}

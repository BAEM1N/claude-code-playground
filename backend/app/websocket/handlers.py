"""
WebSocket event handlers.
"""
from typing import Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import WebSocket
from ..models.message import Message, MessageReaction
from ..schemas.message import MessageCreate
from .connection_manager import manager
import json


class WebSocketHandler:
    """Handle WebSocket events."""

    @staticmethod
    async def handle_message_send(
        data: Dict[str, Any],
        websocket: WebSocket,
        course_id: str,
        user_id: str,
        db: AsyncSession
    ):
        """
        Handle message send event.

        Args:
            data: Event data
            websocket: WebSocket connection
            course_id: Course ID
            user_id: User ID
            db: Database session
        """
        try:
            channel_id = data.get("channel_id")
            content = data.get("content")
            parent_message_id = data.get("parent_message_id")

            if not channel_id or not content:
                await manager.send_personal_message(
                    {"type": "error", "message": "Missing channel_id or content"},
                    websocket
                )
                return

            # Create message in database
            message = Message(
                channel_id=UUID(channel_id),
                user_id=UUID(user_id),
                content=content,
                parent_message_id=UUID(parent_message_id) if parent_message_id else None
            )

            db.add(message)
            await db.commit()
            await db.refresh(message)

            # Broadcast to all users in the course
            await manager.broadcast_to_course(
                course_id,
                {
                    "type": "message.new",
                    "data": {
                        "id": str(message.id),
                        "channel_id": str(message.channel_id),
                        "user_id": str(message.user_id),
                        "content": message.content,
                        "parent_message_id": str(message.parent_message_id) if message.parent_message_id else None,
                        "created_at": message.created_at.isoformat(),
                        "is_edited": message.is_edited,
                        "is_deleted": message.is_deleted,
                        "is_pinned": message.is_pinned
                    }
                }
            )

        except Exception as e:
            print(f"Error handling message send: {e}")
            await manager.send_personal_message(
                {"type": "error", "message": str(e)},
                websocket
            )

    @staticmethod
    async def handle_message_typing(
        data: Dict[str, Any],
        websocket: WebSocket,
        course_id: str,
        user_id: str
    ):
        """
        Handle typing indicator event.

        Args:
            data: Event data
            websocket: WebSocket connection
            course_id: Course ID
            user_id: User ID
        """
        channel_id = data.get("channel_id")

        if not channel_id:
            return

        # Broadcast typing indicator to others in the course
        await manager.broadcast_to_course(
            course_id,
            {
                "type": "user.typing",
                "data": {
                    "user_id": user_id,
                    "channel_id": channel_id
                }
            },
            exclude=websocket
        )

    @staticmethod
    async def handle_message_reaction(
        data: Dict[str, Any],
        websocket: WebSocket,
        course_id: str,
        user_id: str,
        db: AsyncSession
    ):
        """
        Handle message reaction event.

        Args:
            data: Event data
            websocket: WebSocket connection
            course_id: Course ID
            user_id: User ID
            db: Database session
        """
        try:
            message_id = data.get("message_id")
            emoji = data.get("emoji")

            if not message_id or not emoji:
                await manager.send_personal_message(
                    {"type": "error", "message": "Missing message_id or emoji"},
                    websocket
                )
                return

            # Create or remove reaction
            from sqlalchemy import select, delete

            # Check if reaction already exists
            query = select(MessageReaction).where(
                MessageReaction.message_id == UUID(message_id),
                MessageReaction.user_id == UUID(user_id),
                MessageReaction.emoji == emoji
            )
            result = await db.execute(query)
            existing_reaction = result.scalar_one_or_none()

            if existing_reaction:
                # Remove reaction
                await db.delete(existing_reaction)
                await db.commit()

                action = "removed"
            else:
                # Add reaction
                reaction = MessageReaction(
                    message_id=UUID(message_id),
                    user_id=UUID(user_id),
                    emoji=emoji
                )
                db.add(reaction)
                await db.commit()

                action = "added"

            # Broadcast reaction to all users in the course
            await manager.broadcast_to_course(
                course_id,
                {
                    "type": "message.reaction",
                    "data": {
                        "message_id": message_id,
                        "user_id": user_id,
                        "emoji": emoji,
                        "action": action
                    }
                }
            )

        except Exception as e:
            print(f"Error handling message reaction: {e}")
            await manager.send_personal_message(
                {"type": "error", "message": str(e)},
                websocket
            )

    @staticmethod
    async def handle_ping(websocket: WebSocket):
        """
        Handle ping event.

        Args:
            websocket: WebSocket connection
        """
        await manager.send_personal_message(
            {"type": "pong"},
            websocket
        )


# Event handler mapping
EVENT_HANDLERS = {
    "message.send": WebSocketHandler.handle_message_send,
    "message.typing": WebSocketHandler.handle_message_typing,
    "message.reaction": WebSocketHandler.handle_message_reaction,
    "ping": lambda data, ws, course_id, user_id, db=None: WebSocketHandler.handle_ping(ws),
}

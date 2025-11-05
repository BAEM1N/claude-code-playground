"""
WebSocket connection manager.
"""
from typing import Dict, Set
from fastapi import WebSocket
from uuid import UUID
import json


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        """Initialize connection manager."""
        # course_id -> set of websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> user_id mapping
        self.connection_users: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, course_id: str, user_id: str):
        """
        Connect a websocket to a course room.

        Args:
            websocket: WebSocket connection
            course_id: Course ID
            user_id: User ID
        """
        await websocket.accept()

        if course_id not in self.active_connections:
            self.active_connections[course_id] = set()

        self.active_connections[course_id].add(websocket)
        self.connection_users[websocket] = user_id

        # Notify others in the room
        await self.broadcast_to_course(
            course_id,
            {
                "type": "user.joined",
                "data": {"user_id": user_id}
            },
            exclude=websocket
        )

    def disconnect(self, websocket: WebSocket, course_id: str):
        """
        Disconnect a websocket from a course room.

        Args:
            websocket: WebSocket connection
            course_id: Course ID
        """
        if course_id in self.active_connections:
            self.active_connections[course_id].discard(websocket)

            if not self.active_connections[course_id]:
                del self.active_connections[course_id]

        user_id = self.connection_users.pop(websocket, None)

        # Notify others in the room
        if user_id and course_id in self.active_connections:
            import asyncio
            asyncio.create_task(
                self.broadcast_to_course(
                    course_id,
                    {
                        "type": "user.left",
                        "data": {"user_id": user_id}
                    }
                )
            )

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send message to specific websocket.

        Args:
            message: Message data
            websocket: WebSocket connection
        """
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending message: {e}")

    async def broadcast_to_course(
        self,
        course_id: str,
        message: dict,
        exclude: WebSocket = None
    ):
        """
        Broadcast message to all connections in a course.

        Args:
            course_id: Course ID
            message: Message data
            exclude: WebSocket to exclude from broadcast
        """
        if course_id not in self.active_connections:
            return

        message_text = json.dumps(message)
        dead_connections = set()

        for connection in self.active_connections[course_id]:
            if connection == exclude:
                continue

            try:
                await connection.send_text(message_text)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                dead_connections.add(connection)

        # Clean up dead connections
        for connection in dead_connections:
            self.active_connections[course_id].discard(connection)
            self.connection_users.pop(connection, None)

    async def broadcast_to_user(self, user_id: str, message: dict):
        """
        Broadcast message to all connections of a specific user.

        Args:
            user_id: User ID
            message: Message data
        """
        message_text = json.dumps(message)

        for websocket, ws_user_id in self.connection_users.items():
            if ws_user_id == user_id:
                try:
                    await websocket.send_text(message_text)
                except Exception as e:
                    print(f"Error broadcasting to user: {e}")

    def get_course_connections_count(self, course_id: str) -> int:
        """
        Get number of active connections in a course.

        Args:
            course_id: Course ID

        Returns:
            Number of active connections
        """
        return len(self.active_connections.get(course_id, set()))

    def get_user_connections(self, user_id: str) -> Set[WebSocket]:
        """
        Get all connections for a user.

        Args:
            user_id: User ID

        Returns:
            Set of websocket connections
        """
        return {
            ws for ws, ws_user_id in self.connection_users.items()
            if ws_user_id == user_id
        }


# Global connection manager instance
manager = ConnectionManager()

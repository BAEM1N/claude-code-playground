"""
WebSocket handlers for virtual classroom with WebRTC signaling
"""
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional

from ..models.virtual_classroom import (
    VirtualClassroom, ClassroomParticipant, WhiteboardStroke, SharedFile
)
from .connection_manager import manager

logger = logging.getLogger(__name__)


async def handle_classroom_join(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle user joining a virtual classroom"""
    try:
        classroom_id = data.get("classroom_id")
        peer_id = data.get("peer_id")  # WebRTC peer ID

        if not classroom_id:
            return

        # Get classroom
        result = await db.execute(
            select(VirtualClassroom)
            .where(VirtualClassroom.id == classroom_id)
        )
        classroom = result.scalar_one_or_none()

        if not classroom:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Classroom not found"
            }))
            return

        # Check if classroom is active
        if not classroom.is_active:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Classroom is not active"
            }))
            return

        # Check participant limit
        active_count = await db.execute(
            select(func.count(ClassroomParticipant.id))
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.is_online == True)
        )
        if active_count.scalar() >= classroom.max_participants:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Classroom is full"
            }))
            return

        # Check if participant already exists
        participant_result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        participant = participant_result.scalar_one_or_none()

        if participant:
            # Update existing participant
            participant.is_online = True
            participant.peer_id = peer_id
            participant.joined_at = datetime.utcnow()
            participant.left_at = None
        else:
            # Create new participant
            role = "host" if classroom.host_id == int(user_id) else "participant"
            participant = ClassroomParticipant(
                classroom_id=classroom_id,
                user_id=int(user_id),
                role=role,
                peer_id=peer_id,
                is_online=True
            )
            db.add(participant)

        await db.commit()
        await db.refresh(participant)

        # Get all online participants
        participants_result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.is_online == True)
        )
        online_participants = participants_result.scalars().all()

        # Notify all participants about new user
        broadcast_data = {
            "type": "classroom_user_joined",
            "classroom_id": classroom_id,
            "user_id": user_id,
            "peer_id": peer_id,
            "participant": {
                "id": participant.id,
                "user_id": participant.user_id,
                "peer_id": participant.peer_id,
                "role": participant.role,
                "is_video_enabled": participant.is_video_enabled,
                "is_audio_enabled": participant.is_audio_enabled,
                "is_screen_sharing": participant.is_screen_sharing
            },
            "online_participants": [
                {
                    "user_id": p.user_id,
                    "peer_id": p.peer_id,
                    "role": p.role,
                    "is_video_enabled": p.is_video_enabled,
                    "is_audio_enabled": p.is_audio_enabled,
                    "is_screen_sharing": p.is_screen_sharing
                }
                for p in online_participants
            ]
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling classroom join: {str(e)}", exc_info=True)


async def handle_classroom_leave(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle user leaving a virtual classroom"""
    try:
        classroom_id = data.get("classroom_id")

        if not classroom_id:
            return

        # Update participant status
        result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        participant = result.scalar_one_or_none()

        if participant:
            participant.is_online = False
            participant.left_at = datetime.utcnow()
            await db.commit()

            # Notify all participants
            broadcast_data = {
                "type": "classroom_user_left",
                "classroom_id": classroom_id,
                "user_id": user_id,
                "peer_id": participant.peer_id
            }

            await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling classroom leave: {str(e)}", exc_info=True)


async def handle_webrtc_offer(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle WebRTC offer for peer connection"""
    try:
        classroom_id = data.get("classroom_id")
        target_peer_id = data.get("target_peer_id")
        sdp = data.get("sdp")

        if not all([classroom_id, target_peer_id, sdp]):
            return

        # Get sender peer_id
        sender_result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        sender = sender_result.scalar_one_or_none()

        if not sender:
            return

        # Forward offer to target peer
        forward_data = {
            "type": "webrtc_offer",
            "classroom_id": classroom_id,
            "from_peer_id": sender.peer_id,
            "from_user_id": user_id,
            "target_peer_id": target_peer_id,
            "sdp": sdp
        }

        # Broadcast to all (target will filter by peer_id on client side)
        await manager.broadcast(json.dumps(forward_data), session_id)

    except Exception as e:
        logger.error(f"Error handling WebRTC offer: {str(e)}", exc_info=True)


async def handle_webrtc_answer(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle WebRTC answer for peer connection"""
    try:
        classroom_id = data.get("classroom_id")
        target_peer_id = data.get("target_peer_id")
        sdp = data.get("sdp")

        if not all([classroom_id, target_peer_id, sdp]):
            return

        # Get sender peer_id
        sender_result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        sender = sender_result.scalar_one_or_none()

        if not sender:
            return

        # Forward answer to target peer
        forward_data = {
            "type": "webrtc_answer",
            "classroom_id": classroom_id,
            "from_peer_id": sender.peer_id,
            "from_user_id": user_id,
            "target_peer_id": target_peer_id,
            "sdp": sdp
        }

        await manager.broadcast(json.dumps(forward_data), session_id)

    except Exception as e:
        logger.error(f"Error handling WebRTC answer: {str(e)}", exc_info=True)


async def handle_webrtc_ice_candidate(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle ICE candidate exchange"""
    try:
        classroom_id = data.get("classroom_id")
        target_peer_id = data.get("target_peer_id")
        candidate = data.get("candidate")

        if not all([classroom_id, candidate]):
            return

        # Get sender peer_id
        sender_result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        sender = sender_result.scalar_one_or_none()

        if not sender:
            return

        # Forward ICE candidate
        forward_data = {
            "type": "webrtc_ice_candidate",
            "classroom_id": classroom_id,
            "from_peer_id": sender.peer_id,
            "from_user_id": user_id,
            "target_peer_id": target_peer_id,
            "candidate": candidate
        }

        await manager.broadcast(json.dumps(forward_data), session_id)

    except Exception as e:
        logger.error(f"Error handling ICE candidate: {str(e)}", exc_info=True)


async def handle_media_toggle(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle video/audio toggle"""
    try:
        classroom_id = data.get("classroom_id")
        media_type = data.get("media_type")  # 'video' or 'audio'
        enabled = data.get("enabled")

        if not all([classroom_id, media_type]) or enabled is None:
            return

        # Update participant
        result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        participant = result.scalar_one_or_none()

        if participant:
            if media_type == "video":
                participant.is_video_enabled = enabled
            elif media_type == "audio":
                participant.is_audio_enabled = enabled

            await db.commit()

            # Notify all participants
            broadcast_data = {
                "type": "media_toggle",
                "classroom_id": classroom_id,
                "user_id": user_id,
                "peer_id": participant.peer_id,
                "media_type": media_type,
                "enabled": enabled
            }

            await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling media toggle: {str(e)}", exc_info=True)


async def handle_screen_share_toggle(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle screen sharing toggle"""
    try:
        classroom_id = data.get("classroom_id")
        is_sharing = data.get("is_sharing")

        if classroom_id is None or is_sharing is None:
            return

        # Update participant
        result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
        )
        participant = result.scalar_one_or_none()

        if participant:
            participant.is_screen_sharing = is_sharing
            await db.commit()

            # Notify all participants
            broadcast_data = {
                "type": "screen_share_toggle",
                "classroom_id": classroom_id,
                "user_id": user_id,
                "peer_id": participant.peer_id,
                "is_sharing": is_sharing
            }

            await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling screen share toggle: {str(e)}", exc_info=True)


async def handle_whiteboard_stroke(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle whiteboard drawing stroke"""
    try:
        classroom_id = data.get("classroom_id")
        stroke_data = data.get("stroke_data")
        stroke_order = data.get("stroke_order")

        if not all([classroom_id, stroke_data, stroke_order is not None]):
            return

        # Save stroke to database
        stroke = WhiteboardStroke(
            classroom_id=classroom_id,
            user_id=int(user_id),
            stroke_data=stroke_data,
            stroke_order=stroke_order
        )
        db.add(stroke)
        await db.commit()
        await db.refresh(stroke)

        # Broadcast stroke to all participants
        broadcast_data = {
            "type": "whiteboard_stroke",
            "classroom_id": classroom_id,
            "user_id": user_id,
            "stroke_id": stroke.id,
            "stroke_data": stroke_data,
            "stroke_order": stroke_order
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling whiteboard stroke: {str(e)}", exc_info=True)


async def handle_whiteboard_clear(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle clearing whiteboard"""
    try:
        classroom_id = data.get("classroom_id")

        if not classroom_id:
            return

        # Mark all strokes as deleted
        result = await db.execute(
            select(WhiteboardStroke)
            .where(WhiteboardStroke.classroom_id == classroom_id)
            .where(WhiteboardStroke.is_deleted == False)
        )
        strokes = result.scalars().all()

        for stroke in strokes:
            stroke.is_deleted = True

        await db.commit()

        # Notify all participants
        broadcast_data = {
            "type": "whiteboard_clear",
            "classroom_id": classroom_id,
            "user_id": user_id
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling whiteboard clear: {str(e)}", exc_info=True)


async def handle_chat_message(data: dict, websocket, session_id: str, user_id: str, db: AsyncSession):
    """Handle chat message in classroom"""
    try:
        classroom_id = data.get("classroom_id")
        message = data.get("message")

        if not all([classroom_id, message]):
            return

        # Verify participant
        result = await db.execute(
            select(ClassroomParticipant)
            .where(ClassroomParticipant.classroom_id == classroom_id)
            .where(ClassroomParticipant.user_id == int(user_id))
            .where(ClassroomParticipant.is_online == True)
        )
        participant = result.scalar_one_or_none()

        if not participant:
            return

        # Broadcast message to all participants
        broadcast_data = {
            "type": "chat_message",
            "classroom_id": classroom_id,
            "user_id": user_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }

        await manager.broadcast(json.dumps(broadcast_data), session_id)

    except Exception as e:
        logger.error(f"Error handling chat message: {str(e)}", exc_info=True)


# Register handlers
CLASSROOM_HANDLERS = {
    "classroom_join": handle_classroom_join,
    "classroom_leave": handle_classroom_leave,
    "webrtc_offer": handle_webrtc_offer,
    "webrtc_answer": handle_webrtc_answer,
    "webrtc_ice_candidate": handle_webrtc_ice_candidate,
    "media_toggle": handle_media_toggle,
    "screen_share_toggle": handle_screen_share_toggle,
    "whiteboard_stroke": handle_whiteboard_stroke,
    "whiteboard_clear": handle_whiteboard_clear,
    "chat_message": handle_chat_message,
}

"""
Message models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Message(Base):
    """Message model."""

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    content = Column(Text, nullable=False)
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)

    # Relationships
    channel = relationship("Channel", back_populates="messages")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    mentions = relationship("Mention", back_populates="message", cascade="all, delete-orphan")
    files = relationship("MessageFile", back_populates="message", cascade="all, delete-orphan")

    # Thread relationships
    replies = relationship("Message", backref="parent_message", remote_side=[id])

    def __repr__(self):
        return f"<Message(id={self.id}, channel_id={self.channel_id})>"


class MessageReaction(Base):
    """Message reaction model."""

    __tablename__ = "message_reactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    emoji = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="reactions")

    # Constraints
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="unique_message_reaction"),
    )

    def __repr__(self):
        return f"<MessageReaction(message_id={self.message_id}, emoji={self.emoji})>"


class Mention(Base):
    """Mention model."""

    __tablename__ = "mentions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)

    # Relationships
    message = relationship("Message", back_populates="mentions")

    # Constraints
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="unique_mention"),
    )

    def __repr__(self):
        return f"<Mention(message_id={self.message_id}, user_id={self.user_id}, is_read={self.is_read})>"

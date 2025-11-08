"""
File models.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, BigInteger, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Folder(Base):
    """Folder model."""

    __tablename__ = "folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    parent_folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"))
    name = Column(String(255), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False)

    # Relationships
    course = relationship("Course", back_populates="folders")
    files = relationship("File", back_populates="folder", foreign_keys="File.folder_id")
    subfolders = relationship("Folder", backref="parent_folder", remote_side=[id])

    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name})>"


class File(Base):
    """File model."""

    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"))
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    version = Column(Integer, default=1)
    parent_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)

    # Relationships
    course = relationship("Course", back_populates="files")
    folder = relationship("Folder", back_populates="files", foreign_keys=[folder_id])
    tags = relationship("FileTag", back_populates="file", cascade="all, delete-orphan")
    message_files = relationship("MessageFile", back_populates="file", cascade="all, delete-orphan")

    # Version control
    versions = relationship("File", backref="parent_file", remote_side=[id])

    def __repr__(self):
        return f"<File(id={self.id}, original_name={self.original_name}, version={self.version})>"


class FileTag(Base):
    """File tag model."""

    __tablename__ = "file_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    file = relationship("File", back_populates="tags")

    # Constraints
    __table_args__ = (
        UniqueConstraint("file_id", "tag", name="unique_file_tag"),
    )

    def __repr__(self):
        return f"<FileTag(file_id={self.file_id}, tag={self.tag})>"


class MessageFile(Base):
    """Message-File association model."""

    __tablename__ = "message_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="files")
    file = relationship("File", back_populates="message_files")

    # Constraints
    __table_args__ = (
        UniqueConstraint("message_id", "file_id", name="unique_message_file"),
    )

    def __repr__(self):
        return f"<MessageFile(message_id={self.message_id}, file_id={self.file_id})>"

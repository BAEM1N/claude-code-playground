"""
Forum and Q&A models
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..db.base_class import Base


class PostType(str, enum.Enum):
    """Type of forum post"""
    DISCUSSION = "discussion"
    QUESTION = "question"


class VoteType(str, enum.Enum):
    """Type of vote"""
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"


class Forum(Base):
    """Forum category"""
    __tablename__ = "forums"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # Icon name or emoji
    color = Column(String(20))  # Hex color code
    order_index = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    post_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    posts = relationship("ForumPost", back_populates="forum", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Forum(id={self.id}, name='{self.name}')>"


class ForumPost(Base):
    """Forum post / Q&A question"""
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    forum_id = Column(Integer, ForeignKey("forums.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String(20), default=PostType.DISCUSSION, nullable=False)

    # Status flags
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    is_solved = Column(Boolean, default=False, nullable=False)  # For Q&A

    # Counters
    view_count = Column(Integer, default=0, nullable=False)
    vote_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    forum = relationship("Forum", back_populates="posts")
    user = relationship("User", foreign_keys=[user_id])
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("ForumVote", back_populates="post", cascade="all, delete-orphan",
                        foreign_keys="ForumVote.post_id")
    tags = relationship("ForumTag", secondary="forum_post_tags", back_populates="posts")
    bookmarks = relationship("ForumBookmark", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ForumPost(id={self.id}, title='{self.title}', type='{self.post_type}')>"


class ForumReply(Base):
    """Reply to a forum post"""
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_reply_id = Column(Integer, ForeignKey("forum_replies.id", ondelete="CASCADE"))

    content = Column(Text, nullable=False)
    is_best_answer = Column(Boolean, default=False, nullable=False)
    vote_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("ForumPost", back_populates="replies")
    user = relationship("User", foreign_keys=[user_id])
    parent_reply = relationship("ForumReply", remote_side=[id], backref="child_replies")
    votes = relationship("ForumVote", back_populates="reply", cascade="all, delete-orphan",
                        foreign_keys="ForumVote.reply_id")

    def __repr__(self):
        return f"<ForumReply(id={self.id}, post_id={self.post_id}, is_best={self.is_best_answer})>"


class ForumVote(Base):
    """Vote on a post or reply"""
    __tablename__ = "forum_votes"
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uix_user_post_vote'),
        UniqueConstraint('user_id', 'reply_id', name='uix_user_reply_vote'),
        CheckConstraint('(post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL)',
                       name='check_vote_target'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"))
    reply_id = Column(Integer, ForeignKey("forum_replies.id", ondelete="CASCADE"))
    vote_type = Column(String(10), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    post = relationship("ForumPost", back_populates="votes", foreign_keys=[post_id])
    reply = relationship("ForumReply", back_populates="votes", foreign_keys=[reply_id])

    def __repr__(self):
        target = f"post={self.post_id}" if self.post_id else f"reply={self.reply_id}"
        return f"<ForumVote(id={self.id}, {target}, type='{self.vote_type}')>"


class ForumTag(Base):
    """Tag for categorizing posts"""
    __tablename__ = "forum_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    color = Column(String(20))
    post_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    posts = relationship("ForumPost", secondary="forum_post_tags", back_populates="tags")

    def __repr__(self):
        return f"<ForumTag(id={self.id}, name='{self.name}')>"


class ForumPostTag(Base):
    """Junction table for posts and tags"""
    __tablename__ = "forum_post_tags"
    __table_args__ = (
        UniqueConstraint('post_id', 'tag_id', name='uix_post_tag'),
    )

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(Integer, ForeignKey("forum_tags.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ForumBookmark(Base):
    """User bookmark for a post"""
    __tablename__ = "forum_bookmarks"
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uix_user_post_bookmark'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    post = relationship("ForumPost", back_populates="bookmarks")

    def __repr__(self):
        return f"<ForumBookmark(user_id={self.user_id}, post_id={self.post_id})>"


class ForumUserStats(Base):
    """User statistics for forum activity"""
    __tablename__ = "forum_user_stats"
    __table_args__ = (
        UniqueConstraint('user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    post_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    best_answer_count = Column(Integer, default=0, nullable=False)
    total_votes_received = Column(Integer, default=0, nullable=False)
    reputation_score = Column(Integer, default=0, nullable=False)

    last_active_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ForumUserStats(user_id={self.user_id}, reputation={self.reputation_score})>"

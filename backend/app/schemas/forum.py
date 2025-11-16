"""
Pydantic schemas for Forum and Q&A
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PostType(str, Enum):
    DISCUSSION = "discussion"
    QUESTION = "question"


class VoteType(str, Enum):
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"


# ===== Forum Schemas =====

class ForumBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order_index: int = 0


class ForumCreate(ForumBase):
    pass


class ForumUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class ForumResponse(ForumBase):
    id: int
    is_active: bool
    post_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Forum Post Schemas =====

class ForumPostBase(BaseModel):
    forum_id: int
    title: str = Field(..., max_length=255)
    content: str
    post_type: PostType = PostType.DISCUSSION


class ForumPostCreate(ForumPostBase):
    tags: Optional[List[str]] = []


class ForumPostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None


class ForumPostResponse(ForumPostBase):
    id: int
    user_id: int
    is_pinned: bool
    is_locked: bool
    is_solved: bool
    view_count: int
    vote_count: int
    reply_count: int
    last_activity_at: datetime
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    user_vote: Optional[VoteType] = None  # Current user's vote
    is_bookmarked: bool = False

    class Config:
        from_attributes = True


class ForumPostDetail(ForumPostResponse):
    """Post with user info and tags"""
    user: Optional[dict] = None  # Basic user info


# ===== Reply Schemas =====

class ForumReplyBase(BaseModel):
    content: str
    parent_reply_id: Optional[int] = None


class ForumReplyCreate(ForumReplyBase):
    post_id: int


class ForumReplyUpdate(BaseModel):
    content: str


class ForumReplyResponse(ForumReplyBase):
    id: int
    post_id: int
    user_id: int
    is_best_answer: bool
    vote_count: int
    created_at: datetime
    updated_at: datetime
    user_vote: Optional[VoteType] = None
    user: Optional[dict] = None  # Basic user info
    child_replies: List['ForumReplyResponse'] = []

    class Config:
        from_attributes = True


# Allow forward references
ForumReplyResponse.model_rebuild()


# ===== Vote Schemas =====

class VoteCreate(BaseModel):
    vote_type: VoteType


class VoteResponse(BaseModel):
    id: int
    user_id: int
    post_id: Optional[int] = None
    reply_id: Optional[int] = None
    vote_type: VoteType
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Tag Schemas =====

class ForumTagBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None
    color: Optional[str] = None


class ForumTagCreate(ForumTagBase):
    pass


class ForumTagResponse(ForumTagBase):
    id: int
    slug: str
    post_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Bookmark Schemas =====

class BookmarkCreate(BaseModel):
    post_id: int


class BookmarkResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== User Stats Schemas =====

class ForumUserStatsResponse(BaseModel):
    id: int
    user_id: int
    post_count: int
    reply_count: int
    best_answer_count: int
    total_votes_received: int
    reputation_score: int
    last_active_at: datetime

    class Config:
        from_attributes = True


# ===== Paginated Response =====

class PaginatedPostsResponse(BaseModel):
    posts: List[ForumPostResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class PaginatedRepliesResponse(BaseModel):
    replies: List[ForumReplyResponse]
    total: int
    page: int
    per_page: int


# ===== Search and Filter =====

class PostSearchParams(BaseModel):
    query: Optional[str] = None
    forum_id: Optional[int] = None
    post_type: Optional[PostType] = None
    tags: Optional[List[str]] = []
    is_solved: Optional[bool] = None
    user_id: Optional[int] = None
    sort_by: str = "recent"  # recent, popular, votes, unanswered
    page: int = 1
    per_page: int = 20


# ===== Statistics =====

class ForumStatistics(BaseModel):
    total_forums: int
    total_posts: int
    total_replies: int
    total_users: int
    total_questions: int
    solved_questions: int
    solve_rate: float


class UserForumStats(BaseModel):
    posts_created: int
    replies_created: int
    best_answers: int
    total_votes_received: int
    reputation_score: int
    bookmarks_count: int

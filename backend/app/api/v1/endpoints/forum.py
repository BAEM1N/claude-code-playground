"""
Forum and Q&A API endpoints - Performance Optimized
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, case
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict
from datetime import datetime
import re

from ....db.base import get_db
from ....api.deps import get_current_user
from ....models.forum import (
    Forum, ForumPost, ForumReply, ForumVote, ForumTag, ForumPostTag,
    ForumBookmark, ForumUserStats, PostType, VoteType
)
from ....models.user import User
from ....schemas.forum import (
    ForumCreate, ForumUpdate, ForumResponse,
    ForumPostCreate, ForumPostUpdate, ForumPostResponse, ForumPostDetail,
    ForumReplyCreate, ForumReplyUpdate, ForumReplyResponse,
    VoteCreate, VoteResponse,
    ForumTagCreate, ForumTagResponse,
    BookmarkCreate, BookmarkResponse,
    ForumUserStatsResponse,
    PaginatedPostsResponse, PaginatedRepliesResponse,
    PostSearchParams,
    ForumStatistics, UserForumStats,
    PostType as PostTypeEnum, VoteType as VoteTypeEnum
)

router = APIRouter()


# Helper function to create slug from name
def create_slug(name: str) -> str:
    """Create URL-friendly slug from name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:50]


# Helper function to update user stats
async def update_user_stats(db: AsyncSession, user_id: int):
    """Update forum statistics for a user"""
    # Get or create stats
    result = await db.execute(
        select(ForumUserStats).where(ForumUserStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()

    if not stats:
        stats = ForumUserStats(user_id=user_id)
        db.add(stats)
        await db.flush()

    # Count posts
    post_count_result = await db.execute(
        select(func.count(ForumPost.id)).where(ForumPost.user_id == user_id)
    )
    stats.post_count = post_count_result.scalar() or 0

    # Count replies
    reply_count_result = await db.execute(
        select(func.count(ForumReply.id)).where(ForumReply.user_id == user_id)
    )
    stats.reply_count = reply_count_result.scalar() or 0

    # Count best answers
    best_answer_result = await db.execute(
        select(func.count(ForumReply.id))
        .where(ForumReply.user_id == user_id)
        .where(ForumReply.is_best_answer == True)
    )
    stats.best_answer_count = best_answer_result.scalar() or 0

    # Calculate total votes received (posts + replies)
    post_votes_result = await db.execute(
        select(func.sum(ForumPost.vote_count))
        .where(ForumPost.user_id == user_id)
    )
    reply_votes_result = await db.execute(
        select(func.sum(ForumReply.vote_count))
        .where(ForumReply.user_id == user_id)
    )

    post_votes = post_votes_result.scalar() or 0
    reply_votes = reply_votes_result.scalar() or 0
    stats.total_votes_received = post_votes + reply_votes

    # Calculate reputation (posts * 10 + replies * 5 + best answers * 50 + votes * 2)
    stats.reputation_score = (
        stats.post_count * 10 +
        stats.reply_count * 5 +
        stats.best_answer_count * 50 +
        stats.total_votes_received * 2
    )

    stats.last_active_at = datetime.utcnow()
    await db.commit()


# ===== Forum Management =====

@router.get("/forums", response_model=List[ForumResponse])
async def list_forums(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False
):
    """Get all forums - OPTIMIZED"""
    query = select(Forum)

    if not include_inactive:
        query = query.where(Forum.is_active == True)

    query = query.order_by(Forum.order_index, Forum.name)

    result = await db.execute(query)
    forums = result.scalars().all()

    return forums


@router.post("/forums", response_model=ForumResponse, status_code=status.HTTP_201_CREATED)
async def create_forum(
    forum_data: ForumCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new forum (admin only)"""
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Only admins can create forums")

    forum = Forum(**forum_data.dict())
    db.add(forum)
    await db.commit()
    await db.refresh(forum)

    return forum


@router.put("/forums/{forum_id}", response_model=ForumResponse)
async def update_forum(
    forum_id: int,
    forum_data: ForumUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a forum (admin only)"""
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Only admins can update forums")

    result = await db.execute(select(Forum).where(Forum.id == forum_id))
    forum = result.scalar_one_or_none()

    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")

    update_data = forum_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(forum, field, value)

    await db.commit()
    await db.refresh(forum)

    return forum


# ===== Forum Posts =====

@router.get("/posts", response_model=PaginatedPostsResponse)
async def list_posts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    forum_id: Optional[int] = None,
    post_type: Optional[PostTypeEnum] = None,
    tags: Optional[str] = None,  # Comma-separated
    is_solved: Optional[bool] = None,
    user_id: Optional[int] = None,
    query_text: Optional[str] = None,
    sort_by: str = "recent",
    page: int = 1,
    per_page: int = 20
):
    """List forum posts with filters - HEAVILY OPTIMIZED"""
    # Build base query
    query = select(ForumPost)

    # Apply filters
    if forum_id:
        query = query.where(ForumPost.forum_id == forum_id)

    if post_type:
        query = query.where(ForumPost.post_type == post_type)

    if is_solved is not None:
        query = query.where(ForumPost.is_solved == is_solved)

    if user_id:
        query = query.where(ForumPost.user_id == user_id)

    if query_text:
        search_pattern = f"%{query_text}%"
        query = query.where(
            or_(
                ForumPost.title.ilike(search_pattern),
                ForumPost.content.ilike(search_pattern)
            )
        )

    # Tag filtering
    if tags:
        tag_list = [t.strip() for t in tags.split(',')]
        tag_slugs = [create_slug(t) for t in tag_list]

        query = query.join(ForumPostTag).join(ForumTag).where(
            ForumTag.slug.in_(tag_slugs)
        ).group_by(ForumPost.id)

    # Apply sorting
    if sort_by == "recent":
        query = query.order_by(desc(ForumPost.is_pinned), desc(ForumPost.last_activity_at))
    elif sort_by == "popular":
        query = query.order_by(desc(ForumPost.is_pinned), desc(ForumPost.view_count))
    elif sort_by == "votes":
        query = query.order_by(desc(ForumPost.is_pinned), desc(ForumPost.vote_count))
    elif sort_by == "unanswered":
        query = query.where(ForumPost.reply_count == 0).order_by(desc(ForumPost.created_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    posts = result.scalars().all()

    if not posts:
        return PaginatedPostsResponse(
            posts=[],
            total=0,
            page=page,
            per_page=per_page,
            total_pages=0
        )

    # OPTIMIZATION: Batch load all tags
    post_ids = [p.id for p in posts]

    # Get tags
    tags_result = await db.execute(
        select(ForumPostTag.post_id, ForumTag.name)
        .join(ForumTag, ForumPostTag.tag_id == ForumTag.id)
        .where(ForumPostTag.post_id.in_(post_ids))
    )
    tags_map: Dict[int, List[str]] = {}
    for post_id, tag_name in tags_result.all():
        if post_id not in tags_map:
            tags_map[post_id] = []
        tags_map[post_id].append(tag_name)

    # Get user votes
    votes_result = await db.execute(
        select(ForumVote.post_id, ForumVote.vote_type)
        .where(ForumVote.user_id == current_user.id)
        .where(ForumVote.post_id.in_(post_ids))
    )
    votes_map = {vote.post_id: vote.vote_type for vote in votes_result.all()}

    # Get bookmarks
    bookmarks_result = await db.execute(
        select(ForumBookmark.post_id)
        .where(ForumBookmark.user_id == current_user.id)
        .where(ForumBookmark.post_id.in_(post_ids))
    )
    bookmarked_ids = set(b[0] for b in bookmarks_result.all())

    # Build response
    posts_response = []
    for post in posts:
        posts_response.append(ForumPostResponse(
            **post.__dict__,
            tags=tags_map.get(post.id, []),
            user_vote=votes_map.get(post.id),
            is_bookmarked=post.id in bookmarked_ids
        ))

    total_pages = (total + per_page - 1) // per_page

    return PaginatedPostsResponse(
        posts=posts_response,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/posts/{post_id}", response_model=ForumPostDetail)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get post details - OPTIMIZED"""
    result = await db.execute(
        select(ForumPost).where(ForumPost.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count
    post.view_count += 1
    await db.commit()

    # Get tags
    tags_result = await db.execute(
        select(ForumTag.name)
        .join(ForumPostTag, ForumPostTag.tag_id == ForumTag.id)
        .where(ForumPostTag.post_id == post_id)
    )
    tags = [tag[0] for tag in tags_result.all()]

    # Get user vote
    vote_result = await db.execute(
        select(ForumVote.vote_type)
        .where(ForumVote.user_id == current_user.id)
        .where(ForumVote.post_id == post_id)
    )
    user_vote = vote_result.scalar_one_or_none()

    # Get bookmark status
    bookmark_result = await db.execute(
        select(ForumBookmark)
        .where(ForumBookmark.user_id == current_user.id)
        .where(ForumBookmark.post_id == post_id)
    )
    is_bookmarked = bookmark_result.scalar_one_or_none() is not None

    # Get basic user info
    user_result = await db.execute(
        select(User).where(User.id == post.user_id)
    )
    user = user_result.scalar_one_or_none()
    user_info = {
        "id": user.id,
        "email": user.email,
        "role": user.role
    } if user else None

    return ForumPostDetail(
        **post.__dict__,
        tags=tags,
        user_vote=user_vote,
        is_bookmarked=is_bookmarked,
        user=user_info
    )


@router.post("/posts", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: ForumPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new forum post"""
    # Verify forum exists
    forum_result = await db.execute(
        select(Forum).where(Forum.id == post_data.forum_id)
    )
    forum = forum_result.scalar_one_or_none()

    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")

    # Create post
    post = ForumPost(
        forum_id=post_data.forum_id,
        user_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        post_type=post_data.post_type
    )

    db.add(post)
    await db.flush()

    # Add tags
    tag_names = []
    if post_data.tags:
        for tag_name in post_data.tags:
            slug = create_slug(tag_name)

            # Get or create tag
            tag_result = await db.execute(
                select(ForumTag).where(ForumTag.slug == slug)
            )
            tag = tag_result.scalar_one_or_none()

            if not tag:
                tag = ForumTag(name=tag_name, slug=slug)
                db.add(tag)
                await db.flush()

            # Create post-tag association
            post_tag = ForumPostTag(post_id=post.id, tag_id=tag.id)
            db.add(post_tag)

            tag.post_count += 1
            tag_names.append(tag_name)

    # Update forum post count
    forum.post_count += 1

    await db.commit()
    await db.refresh(post)

    # Update user stats
    await update_user_stats(db, current_user.id)

    return ForumPostResponse(
        **post.__dict__,
        tags=tag_names,
        user_vote=None,
        is_bookmarked=False
    )


@router.put("/posts/{post_id}", response_model=ForumPostResponse)
async def update_post(
    post_id: int,
    post_data: ForumPostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a post (author or admin only)"""
    result = await db.execute(
        select(ForumPost).where(ForumPost.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check permissions
    if post.user_id != current_user.id and current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    # Update fields
    update_data = post_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    await db.commit()
    await db.refresh(post)

    # Get tags
    tags_result = await db.execute(
        select(ForumTag.name)
        .join(ForumPostTag, ForumPostTag.tag_id == ForumTag.id)
        .where(ForumPostTag.post_id == post_id)
    )
    tags = [tag[0] for tag in tags_result.all()]

    return ForumPostResponse(
        **post.__dict__,
        tags=tags,
        user_vote=None,
        is_bookmarked=False
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a post (author or admin only)"""
    result = await db.execute(
        select(ForumPost).where(ForumPost.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check permissions
    if post.user_id != current_user.id and current_user.role not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    # Update forum post count
    forum_result = await db.execute(
        select(Forum).where(Forum.id == post.forum_id)
    )
    forum = forum_result.scalar_one_or_none()
    if forum:
        forum.post_count = max(0, forum.post_count - 1)

    await db.delete(post)
    await db.commit()

    # Update user stats
    await update_user_stats(db, post.user_id)


# ===== Replies =====

@router.get("/posts/{post_id}/replies", response_model=List[ForumReplyResponse])
async def list_replies(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all replies for a post - OPTIMIZED"""
    # Get all replies (including nested)
    result = await db.execute(
        select(ForumReply)
        .where(ForumReply.post_id == post_id)
        .order_by(desc(ForumReply.is_best_answer), asc(ForumReply.created_at))
    )
    replies = result.scalars().all()

    if not replies:
        return []

    reply_ids = [r.id for r in replies]

    # OPTIMIZATION: Batch load user votes
    votes_result = await db.execute(
        select(ForumVote.reply_id, ForumVote.vote_type)
        .where(ForumVote.user_id == current_user.id)
        .where(ForumVote.reply_id.in_(reply_ids))
    )
    votes_map = {vote.reply_id: vote.vote_type for vote in votes_result.all()}

    # OPTIMIZATION: Batch load user info
    user_ids = list(set(r.user_id for r in replies))
    users_result = await db.execute(
        select(User.id, User.email, User.role)
        .where(User.id.in_(user_ids))
    )
    users_map = {
        user.id: {"id": user.id, "email": user.email, "role": user.role}
        for user in users_result.all()
    }

    # Build reply tree
    replies_map = {}
    root_replies = []

    for reply in replies:
        reply_dict = ForumReplyResponse(
            **reply.__dict__,
            user_vote=votes_map.get(reply.id),
            user=users_map.get(reply.user_id),
            child_replies=[]
        )
        replies_map[reply.id] = reply_dict

        if reply.parent_reply_id is None:
            root_replies.append(reply_dict)
        elif reply.parent_reply_id in replies_map:
            replies_map[reply.parent_reply_id].child_replies.append(reply_dict)

    return root_replies


@router.post("/replies", response_model=ForumReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    reply_data: ForumReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a reply to a post"""
    # Verify post exists
    post_result = await db.execute(
        select(ForumPost).where(ForumPost.id == reply_data.post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.is_locked:
        raise HTTPException(status_code=403, detail="Post is locked")

    # Create reply
    reply = ForumReply(
        post_id=reply_data.post_id,
        user_id=current_user.id,
        parent_reply_id=reply_data.parent_reply_id,
        content=reply_data.content
    )

    db.add(reply)

    # Update post counters
    post.reply_count += 1
    post.last_activity_at = datetime.utcnow()

    await db.commit()
    await db.refresh(reply)

    # Update user stats
    await update_user_stats(db, current_user.id)

    # Get user info
    user_info = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }

    return ForumReplyResponse(
        **reply.__dict__,
        user_vote=None,
        user=user_info,
        child_replies=[]
    )


@router.put("/replies/{reply_id}/best-answer", response_model=ForumReplyResponse)
async def mark_best_answer(
    reply_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a reply as best answer (post author only)"""
    result = await db.execute(
        select(ForumReply).where(ForumReply.id == reply_id)
    )
    reply = result.scalar_one_or_none()

    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    # Get post
    post_result = await db.execute(
        select(ForumPost).where(ForumPost.id == reply.post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if user is post author
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only post author can mark best answer")

    # Unmark previous best answer
    await db.execute(
        select(ForumReply)
        .where(ForumReply.post_id == reply.post_id)
        .where(ForumReply.is_best_answer == True)
    )
    previous_best = result.scalar_one_or_none()
    if previous_best:
        previous_best.is_best_answer = False

    # Mark new best answer
    reply.is_best_answer = True
    post.is_solved = True

    await db.commit()
    await db.refresh(reply)

    # Update reply author's stats
    await update_user_stats(db, reply.user_id)

    return ForumReplyResponse(
        **reply.__dict__,
        user_vote=None,
        user=None,
        child_replies=[]
    )


# ===== Voting =====

@router.post("/posts/{post_id}/vote", response_model=dict)
async def vote_post(
    post_id: int,
    vote_data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a post"""
    # Get post
    post_result = await db.execute(
        select(ForumPost).where(ForumPost.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check existing vote
    vote_result = await db.execute(
        select(ForumVote)
        .where(ForumVote.user_id == current_user.id)
        .where(ForumVote.post_id == post_id)
    )
    existing_vote = vote_result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.vote_type == vote_data.vote_type:
            # Remove vote
            await db.delete(existing_vote)
            post.vote_count += -1 if vote_data.vote_type == VoteTypeEnum.UPVOTE else 1
            action = "removed"
        else:
            # Change vote
            existing_vote.vote_type = vote_data.vote_type
            post.vote_count += 2 if vote_data.vote_type == VoteTypeEnum.UPVOTE else -2
            action = "changed"
    else:
        # Add new vote
        vote = ForumVote(
            user_id=current_user.id,
            post_id=post_id,
            vote_type=vote_data.vote_type
        )
        db.add(vote)
        post.vote_count += 1 if vote_data.vote_type == VoteTypeEnum.UPVOTE else -1
        action = "added"

    await db.commit()

    # Update post author's stats
    await update_user_stats(db, post.user_id)

    return {
        "action": action,
        "vote_count": post.vote_count
    }


@router.post("/replies/{reply_id}/vote", response_model=dict)
async def vote_reply(
    reply_id: int,
    vote_data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a reply"""
    # Get reply
    reply_result = await db.execute(
        select(ForumReply).where(ForumReply.id == reply_id)
    )
    reply = reply_result.scalar_one_or_none()

    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    # Check existing vote
    vote_result = await db.execute(
        select(ForumVote)
        .where(ForumVote.user_id == current_user.id)
        .where(ForumVote.reply_id == reply_id)
    )
    existing_vote = vote_result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.vote_type == vote_data.vote_type:
            # Remove vote
            await db.delete(existing_vote)
            reply.vote_count += -1 if vote_data.vote_type == VoteTypeEnum.UPVOTE else 1
            action = "removed"
        else:
            # Change vote
            existing_vote.vote_type = vote_data.vote_type
            reply.vote_count += 2 if vote_data.vote_type == VoteTypeEnum.UPVOTE else -2
            action = "changed"
    else:
        # Add new vote
        vote = ForumVote(
            user_id=current_user.id,
            reply_id=reply_id,
            vote_type=vote_data.vote_type
        )
        db.add(vote)
        reply.vote_count += 1 if vote_data.vote_type == VoteTypeEnum.UPVOTE else -1
        action = "added"

    await db.commit()

    # Update reply author's stats
    await update_user_stats(db, reply.user_id)

    return {
        "action": action,
        "vote_count": reply.vote_count
    }


# ===== Bookmarks =====

@router.post("/bookmarks", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bookmark a post"""
    # Check if already bookmarked
    existing = await db.execute(
        select(ForumBookmark)
        .where(ForumBookmark.user_id == current_user.id)
        .where(ForumBookmark.post_id == bookmark_data.post_id)
    )

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Post already bookmarked")

    bookmark = ForumBookmark(
        user_id=current_user.id,
        post_id=bookmark_data.post_id
    )

    db.add(bookmark)
    await db.commit()

    return {"message": "Bookmark created"}


@router.delete("/bookmarks/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove bookmark"""
    result = await db.execute(
        select(ForumBookmark)
        .where(ForumBookmark.user_id == current_user.id)
        .where(ForumBookmark.post_id == post_id)
    )
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()


# ===== Statistics =====

@router.get("/stats/overview", response_model=ForumStatistics)
async def get_forum_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall forum statistics - OPTIMIZED"""
    stats_result = await db.execute(
        select(
            func.count(func.distinct(Forum.id)).label('total_forums'),
            func.count(func.distinct(ForumPost.id)).label('total_posts'),
            func.count(func.distinct(ForumReply.id)).label('total_replies'),
            func.count(func.distinct(ForumUserStats.user_id)).label('total_users'),
            func.count(func.distinct(ForumPost.id)).filter(
                ForumPost.post_type == PostType.QUESTION
            ).label('total_questions'),
            func.count(func.distinct(ForumPost.id)).filter(
                and_(ForumPost.post_type == PostType.QUESTION, ForumPost.is_solved == True)
            ).label('solved_questions')
        )
        .select_from(Forum)
        .outerjoin(ForumPost, ForumPost.forum_id == Forum.id)
        .outerjoin(ForumReply, ForumReply.post_id == ForumPost.id)
        .outerjoin(ForumUserStats)
    )

    stats = stats_result.one()

    solve_rate = 0.0
    if stats.total_questions > 0:
        solve_rate = (stats.solved_questions / stats.total_questions) * 100

    return ForumStatistics(
        total_forums=stats.total_forums or 0,
        total_posts=stats.total_posts or 0,
        total_replies=stats.total_replies or 0,
        total_users=stats.total_users or 0,
        total_questions=stats.total_questions or 0,
        solved_questions=stats.solved_questions or 0,
        solve_rate=solve_rate
    )


@router.get("/stats/my-stats", response_model=UserForumStats)
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's forum statistics"""
    # Get or create stats
    result = await db.execute(
        select(ForumUserStats).where(ForumUserStats.user_id == current_user.id)
    )
    stats = result.scalar_one_or_none()

    if not stats:
        stats = ForumUserStats(user_id=current_user.id)

    # Get bookmarks count
    bookmarks_result = await db.execute(
        select(func.count(ForumBookmark.id))
        .where(ForumBookmark.user_id == current_user.id)
    )
    bookmarks_count = bookmarks_result.scalar() or 0

    return UserForumStats(
        posts_created=stats.post_count,
        replies_created=stats.reply_count,
        best_answers=stats.best_answer_count,
        total_votes_received=stats.total_votes_received,
        reputation_score=stats.reputation_score,
        bookmarks_count=bookmarks_count
    )

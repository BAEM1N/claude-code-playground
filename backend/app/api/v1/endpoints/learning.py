"""
Learning Module System API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime

from ....core.database import get_db
from ....api.deps import get_current_active_user
from ....services.jupyter_service import execute_code
from ....models.learning import (
    LearningTrack,
    LearningModule,
    LearningChapter,
    LearningTopic,
    TopicProgress,
    NotebookExecution,
    TopicStatus,
)
from ....schemas.learning import (
    # Track schemas
    LearningTrack as LearningTrackSchema,
    LearningTrackCreate,
    LearningTrackUpdate,
    LearningTrackWithModules,
    # Module schemas
    LearningModule as LearningModuleSchema,
    LearningModuleCreate,
    LearningModuleUpdate,
    LearningModuleWithChapters,
    # Chapter schemas
    LearningChapter as LearningChapterSchema,
    LearningChapterCreate,
    LearningChapterUpdate,
    LearningChapterWithTopics,
    # Topic schemas
    LearningTopic as LearningTopicSchema,
    LearningTopicCreate,
    LearningTopicUpdate,
    TopicWithProgress,
    # Progress schemas
    TopicProgress as TopicProgressSchema,
    TopicProgressCreate,
    TopicProgressUpdate,
    # Execution schemas
    NotebookExecutionRequest,
    NotebookExecutionResponse,
    # Combined schemas
    ModuleWithFullContent,
    TrackWithFullContent,
)

router = APIRouter()


# ============================================================================
# Learning Track Endpoints
# ============================================================================

@router.get("/tracks", response_model=List[LearningTrackSchema], status_code=status.HTTP_200_OK)
async def get_all_tracks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    published_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all learning tracks"""
    query = select(LearningTrack).order_by(LearningTrack.order)

    if published_only:
        query = query.where(LearningTrack.is_published == True)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    tracks = result.scalars().all()

    return tracks


@router.get("/tracks/{track_id}", response_model=LearningTrackWithModules, status_code=status.HTTP_200_OK)
async def get_track(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get single track with its modules"""
    query = (
        select(LearningTrack)
        .options(selectinload(LearningTrack.modules))
        .where(LearningTrack.id == track_id)
    )
    result = await db.execute(query)
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    return track


@router.post("/tracks", response_model=LearningTrackSchema, status_code=status.HTTP_201_CREATED)
async def create_track(
    track_data: LearningTrackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new learning track (instructors only)"""
    user_id = UUID(current_user["id"])

    track = LearningTrack(
        **track_data.model_dump(),
        created_by=user_id
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)

    return track


@router.put("/tracks/{track_id}", response_model=LearningTrackSchema, status_code=status.HTTP_200_OK)
async def update_track(
    track_id: UUID,
    track_data: LearningTrackUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update learning track"""
    query = select(LearningTrack).where(LearningTrack.id == track_id)
    result = await db.execute(query)
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Update fields
    for field, value in track_data.model_dump(exclude_unset=True).items():
        setattr(track, field, value)

    await db.commit()
    await db.refresh(track)

    return track


@router.delete("/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Delete learning track"""
    query = select(LearningTrack).where(LearningTrack.id == track_id)
    result = await db.execute(query)
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    await db.delete(track)
    await db.commit()

    return None


# ============================================================================
# Learning Module Endpoints
# ============================================================================

@router.get("/tracks/{track_id}/modules", response_model=List[LearningModuleSchema], status_code=status.HTTP_200_OK)
async def get_track_modules(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all modules in a track"""
    query = (
        select(LearningModule)
        .where(LearningModule.track_id == track_id)
        .order_by(LearningModule.order)
    )
    result = await db.execute(query)
    modules = result.scalars().all()

    return modules


@router.get("/modules/{module_id}", response_model=LearningModuleWithChapters, status_code=status.HTTP_200_OK)
async def get_module(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get single module with its chapters"""
    query = (
        select(LearningModule)
        .options(selectinload(LearningModule.chapters))
        .where(LearningModule.id == module_id)
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return module


@router.post("/modules", response_model=LearningModuleSchema, status_code=status.HTTP_201_CREATED)
async def create_module(
    module_data: LearningModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new learning module"""
    user_id = UUID(current_user["id"])

    module = LearningModule(
        **module_data.model_dump(),
        created_by=user_id
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)

    return module


@router.put("/modules/{module_id}", response_model=LearningModuleSchema, status_code=status.HTTP_200_OK)
async def update_module(
    module_id: UUID,
    module_data: LearningModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update learning module"""
    query = select(LearningModule).where(LearningModule.id == module_id)
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    for field, value in module_data.model_dump(exclude_unset=True).items():
        setattr(module, field, value)

    await db.commit()
    await db.refresh(module)

    return module


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Delete learning module"""
    query = select(LearningModule).where(LearningModule.id == module_id)
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    await db.delete(module)
    await db.commit()

    return None


# ============================================================================
# Learning Chapter Endpoints
# ============================================================================

@router.get("/modules/{module_id}/chapters", response_model=List[LearningChapterSchema], status_code=status.HTTP_200_OK)
async def get_module_chapters(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all chapters in a module"""
    query = (
        select(LearningChapter)
        .where(LearningChapter.module_id == module_id)
        .order_by(LearningChapter.order)
    )
    result = await db.execute(query)
    chapters = result.scalars().all()

    return chapters


@router.get("/chapters/{chapter_id}", response_model=LearningChapterWithTopics, status_code=status.HTTP_200_OK)
async def get_chapter(
    chapter_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get single chapter with its topics"""
    query = (
        select(LearningChapter)
        .options(selectinload(LearningChapter.topics))
        .where(LearningChapter.id == chapter_id)
    )
    result = await db.execute(query)
    chapter = result.scalar_one_or_none()

    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    return chapter


@router.post("/chapters", response_model=LearningChapterSchema, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    chapter_data: LearningChapterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new learning chapter"""
    chapter = LearningChapter(**chapter_data.model_dump())
    db.add(chapter)
    await db.commit()
    await db.refresh(chapter)

    return chapter


@router.put("/chapters/{chapter_id}", response_model=LearningChapterSchema, status_code=status.HTTP_200_OK)
async def update_chapter(
    chapter_id: UUID,
    chapter_data: LearningChapterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update learning chapter"""
    query = select(LearningChapter).where(LearningChapter.id == chapter_id)
    result = await db.execute(query)
    chapter = result.scalar_one_or_none()

    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    for field, value in chapter_data.model_dump(exclude_unset=True).items():
        setattr(chapter, field, value)

    await db.commit()
    await db.refresh(chapter)

    return chapter


@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    chapter_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Delete learning chapter"""
    query = select(LearningChapter).where(LearningChapter.id == chapter_id)
    result = await db.execute(query)
    chapter = result.scalar_one_or_none()

    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    await db.delete(chapter)
    await db.commit()

    return None


# ============================================================================
# Learning Topic Endpoints
# ============================================================================

@router.get("/chapters/{chapter_id}/topics", response_model=List[LearningTopicSchema], status_code=status.HTTP_200_OK)
async def get_chapter_topics(
    chapter_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all topics in a chapter"""
    query = (
        select(LearningTopic)
        .where(LearningTopic.chapter_id == chapter_id)
        .order_by(LearningTopic.order)
    )
    result = await db.execute(query)
    topics = result.scalars().all()

    return topics


@router.get("/topics/{topic_id}", response_model=TopicWithProgress, status_code=status.HTTP_200_OK)
async def get_topic(
    topic_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get single topic with user progress"""
    user_id = UUID(current_user["id"])

    # Get topic
    query = select(LearningTopic).where(LearningTopic.id == topic_id)
    result = await db.execute(query)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Get or create progress
    progress_query = select(TopicProgress).where(
        TopicProgress.topic_id == topic_id,
        TopicProgress.user_id == user_id
    )
    progress_result = await db.execute(progress_query)
    progress = progress_result.scalar_one_or_none()

    if not progress:
        # Create initial progress
        progress = TopicProgress(
            topic_id=topic_id,
            user_id=user_id,
            status=TopicStatus.NOT_STARTED
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    # Attach progress to topic
    topic_dict = topic.__dict__.copy()
    topic_dict['progress'] = progress

    return topic_dict


@router.post("/topics", response_model=LearningTopicSchema, status_code=status.HTTP_201_CREATED)
async def create_topic(
    topic_data: LearningTopicCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new learning topic"""
    topic = LearningTopic(**topic_data.model_dump())
    db.add(topic)
    await db.commit()
    await db.refresh(topic)

    return topic


@router.put("/topics/{topic_id}", response_model=LearningTopicSchema, status_code=status.HTTP_200_OK)
async def update_topic(
    topic_id: UUID,
    topic_data: LearningTopicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update learning topic"""
    query = select(LearningTopic).where(LearningTopic.id == topic_id)
    result = await db.execute(query)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    for field, value in topic_data.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)

    await db.commit()
    await db.refresh(topic)

    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Delete learning topic"""
    query = select(LearningTopic).where(LearningTopic.id == topic_id)
    result = await db.execute(query)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    await db.delete(topic)
    await db.commit()

    return None


# ============================================================================
# Topic Progress Endpoints
# ============================================================================

@router.get("/topics/{topic_id}/progress", response_model=TopicProgressSchema, status_code=status.HTTP_200_OK)
async def get_topic_progress(
    topic_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get user's progress for a topic"""
    user_id = UUID(current_user["id"])

    query = select(TopicProgress).where(
        TopicProgress.topic_id == topic_id,
        TopicProgress.user_id == user_id
    )
    result = await db.execute(query)
    progress = result.scalar_one_or_none()

    if not progress:
        # Create initial progress
        progress = TopicProgress(
            topic_id=topic_id,
            user_id=user_id,
            status=TopicStatus.NOT_STARTED
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    return progress


@router.put("/topics/{topic_id}/progress", response_model=TopicProgressSchema, status_code=status.HTTP_200_OK)
async def update_topic_progress(
    topic_id: UUID,
    progress_data: TopicProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update user's progress for a topic"""
    user_id = UUID(current_user["id"])

    # Get or create progress
    query = select(TopicProgress).where(
        TopicProgress.topic_id == topic_id,
        TopicProgress.user_id == user_id
    )
    result = await db.execute(query)
    progress = result.scalar_one_or_none()

    if not progress:
        progress = TopicProgress(
            topic_id=topic_id,
            user_id=user_id
        )
        db.add(progress)

    # Update fields
    from datetime import datetime
    for field, value in progress_data.model_dump(exclude_unset=True).items():
        setattr(progress, field, value)

    # Auto-set timestamps
    if progress_data.status == "in_progress" and not progress.started_at:
        progress.started_at = datetime.utcnow()
    elif progress_data.status == "completed":
        progress.completed_at = datetime.utcnow()

    progress.last_accessed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(progress)

    return progress


# ============================================================================
# Notebook Execution Endpoints (Jupyter Kernel Gateway)
# ============================================================================

@router.post("/topics/{topic_id}/execute", response_model=NotebookExecutionResponse, status_code=status.HTTP_200_OK)
async def execute_notebook_cell(
    topic_id: UUID,
    execution_request: NotebookExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Execute a notebook cell using Jupyter Kernel Gateway

    Supports Python, JavaScript, and SQL kernels.
    Execution results are saved to database for tracking and debugging.
    """
    user_id = UUID(current_user["id"])

    # Verify topic exists and is a notebook type
    query = select(LearningTopic).where(LearningTopic.id == topic_id)
    result = await db.execute(query)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if topic.content_type != "notebook":
        raise HTTPException(
            status_code=400,
            detail=f"Topic is not a notebook (type: {topic.content_type})"
        )

    # Execute code using Jupyter service
    execution_result = await execute_code(
        code=execution_request.code,
        kernel_type=execution_request.kernel_type,
        topic_id=str(topic_id),
        user_id=str(user_id)
    )

    # Save execution to database for tracking
    execution_record = NotebookExecution(
        topic_id=topic_id,
        user_id=user_id,
        cell_index=execution_request.cell_index,
        code=execution_request.code,
        kernel_type=execution_request.kernel_type,
        output=execution_result.get("output"),
        error=execution_result.get("error"),
        execution_status=execution_result["execution_status"],
        execution_time_ms=execution_result["execution_time_ms"],
        executed_at=datetime.fromisoformat(execution_result["executed_at"])
    )
    db.add(execution_record)

    # Update topic progress to in_progress if not already completed
    progress_query = (
        select(TopicProgress)
        .where(TopicProgress.topic_id == topic_id)
        .where(TopicProgress.user_id == user_id)
    )
    progress_result = await db.execute(progress_query)
    progress = progress_result.scalar_one_or_none()

    if progress and progress.status == TopicStatus.NOT_STARTED:
        progress.status = TopicStatus.IN_PROGRESS
        progress.started_at = datetime.utcnow()

    await db.commit()
    await db.refresh(execution_record)

    return NotebookExecutionResponse(
        execution_id=execution_record.id,
        output=execution_record.output,
        error=execution_record.error,
        execution_status=execution_record.execution_status,
        execution_time_ms=execution_record.execution_time_ms,
        executed_at=execution_record.executed_at
    )


# ============================================================================
# Full Content Endpoints (for TOC/Navigation)
# ============================================================================

@router.get("/modules/{module_id}/full", response_model=ModuleWithFullContent, status_code=status.HTTP_200_OK)
async def get_module_full_content(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get module with all nested chapters, topics, and user progress"""
    user_id = UUID(current_user["id"])

    # Load module with all relationships
    query = (
        select(LearningModule)
        .options(
            selectinload(LearningModule.chapters).selectinload(LearningChapter.topics).selectinload(LearningTopic.progress_records)
        )
        .where(LearningModule.id == module_id)
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return module


@router.get("/tracks/{track_id}/full", response_model=TrackWithFullContent, status_code=status.HTTP_200_OK)
async def get_track_full_content(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get track with all nested modules, chapters, and topics"""
    query = (
        select(LearningTrack)
        .options(
            selectinload(LearningTrack.modules).selectinload(LearningModule.chapters).selectinload(LearningChapter.topics)
        )
        .where(LearningTrack.id == track_id)
    )
    result = await db.execute(query)
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    return track

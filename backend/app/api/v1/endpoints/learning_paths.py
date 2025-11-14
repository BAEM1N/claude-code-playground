"""
Learning Paths API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from collections import Counter

from ....db.base import get_db
from ....api.deps import get_current_user
from ....models.learning_path import (
    LearningPath,
    LearningPathItem,
    LearningPathTag,
    UserLearningProgress,
    UserPathItemProgress,
    DifficultyLevel,
    ProgressStatus,
)
from ....models.user import User
from ....schemas.learning_path import (
    LearningPathCreate,
    LearningPathUpdate,
    LearningPathResponse,
    LearningPathDetailResponse,
    LearningPathWithProgress,
    LearningPathItemResponse,
    LearningPathItemCreate,
    LearningPathItemUpdate,
    LearningPathItemWithProgress,
    UserLearningProgressResponse,
    UserPathItemProgressResponse,
    UserPathItemProgressUpdate,
    LearningPathRecommendation,
    RecommendationsResponse,
    EnrollmentRequest,
    EnrollmentResponse,
    LearningPathStats,
    UserLearningStats,
)

router = APIRouter()


# Helper function to calculate progress
async def calculate_path_progress(
    db: AsyncSession,
    user_id: int,
    learning_path_id: int
) -> float:
    """Calculate user's progress on a learning path"""
    # Get all items for this path
    items_result = await db.execute(
        select(LearningPathItem)
        .where(LearningPathItem.learning_path_id == learning_path_id)
        .where(LearningPathItem.is_required == True)
    )
    required_items = items_result.scalars().all()

    if not required_items:
        return 0.0

    # Get user's progress on these items
    progress_result = await db.execute(
        select(UserPathItemProgress)
        .where(UserPathItemProgress.user_id == user_id)
        .where(UserPathItemProgress.path_item_id.in_([item.id for item in required_items]))
        .where(UserPathItemProgress.status == ProgressStatus.COMPLETED)
    )
    completed_items = progress_result.scalars().all()

    return (len(completed_items) / len(required_items)) * 100


# Helper function to update path progress
async def update_path_progress(
    db: AsyncSession,
    user_id: int,
    learning_path_id: int
):
    """Update user's overall progress on a learning path"""
    progress_percentage = await calculate_path_progress(db, user_id, learning_path_id)

    # Get or create user progress record
    result = await db.execute(
        select(UserLearningProgress)
        .where(UserLearningProgress.user_id == user_id)
        .where(UserLearningProgress.learning_path_id == learning_path_id)
    )
    progress = result.scalar_one_or_none()

    if progress:
        progress.progress_percentage = progress_percentage
        progress.last_accessed_at = datetime.utcnow()

        # Update status
        if progress_percentage == 0:
            progress.status = ProgressStatus.NOT_STARTED
        elif progress_percentage == 100:
            progress.status = ProgressStatus.COMPLETED
            if not progress.completed_at:
                progress.completed_at = datetime.utcnow()
        else:
            progress.status = ProgressStatus.IN_PROGRESS
            if not progress.started_at:
                progress.started_at = datetime.utcnow()

        progress.updated_at = datetime.utcnow()

    await db.commit()
    if progress:
        await db.refresh(progress)

    return progress


@router.get("/", response_model=List[LearningPathResponse])
async def get_learning_paths(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get all active learning paths"""
    query = select(LearningPath).where(LearningPath.is_active == True)

    if difficulty:
        query = query.where(LearningPath.difficulty_level == difficulty)

    if tag:
        query = query.join(LearningPathTag).where(LearningPathTag.tag == tag)

    query = query.offset(skip).limit(limit).order_by(LearningPath.created_at.desc())

    result = await db.execute(query)
    paths = result.scalars().all()

    # Load tags for each path
    response = []
    for path in paths:
        tags_result = await db.execute(
            select(LearningPathTag.tag)
            .where(LearningPathTag.learning_path_id == path.id)
        )
        tags = [tag[0] for tag in tags_result.all()]

        path_dict = {
            "id": path.id,
            "title": path.title,
            "description": path.description,
            "difficulty_level": path.difficulty_level,
            "estimated_hours": path.estimated_hours,
            "icon": path.icon,
            "color": path.color,
            "is_active": path.is_active,
            "created_by_id": path.created_by_id,
            "created_at": path.created_at,
            "updated_at": path.updated_at,
            "tags": tags,
        }
        response.append(LearningPathResponse(**path_dict))

    return response


@router.get("/{path_id}", response_model=LearningPathWithProgress)
async def get_learning_path(
    path_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific learning path with user progress"""
    # Get the path
    result = await db.execute(
        select(LearningPath)
        .where(LearningPath.id == path_id)
        .options(selectinload(LearningPath.items))
    )
    path = result.scalar_one_or_none()

    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    # Get tags
    tags_result = await db.execute(
        select(LearningPathTag.tag)
        .where(LearningPathTag.learning_path_id == path.id)
    )
    tags = [tag[0] for tag in tags_result.all()]

    # Get user's overall progress
    progress_result = await db.execute(
        select(UserLearningProgress)
        .where(UserLearningProgress.user_id == current_user.id)
        .where(UserLearningProgress.learning_path_id == path_id)
    )
    user_progress = progress_result.scalar_one_or_none()

    # Get user's progress on each item
    item_progress_result = await db.execute(
        select(UserPathItemProgress)
        .where(UserPathItemProgress.user_id == current_user.id)
        .where(UserPathItemProgress.path_item_id.in_([item.id for item in path.items]))
    )
    item_progress_map = {ip.path_item_id: ip for ip in item_progress_result.scalars().all()}

    # Build items with progress
    items_with_progress = []
    for item in sorted(path.items, key=lambda x: x.order_index):
        item_progress = item_progress_map.get(item.id)

        # Check if item is locked (prerequisites not met)
        is_locked = False
        if item.prerequisites:
            for prereq_id in item.prerequisites:
                prereq_progress = item_progress_map.get(prereq_id)
                if not prereq_progress or prereq_progress.status != ProgressStatus.COMPLETED:
                    is_locked = True
                    break

        item_dict = {
            "id": item.id,
            "learning_path_id": item.learning_path_id,
            "item_type": item.item_type,
            "item_id": item.item_id,
            "title": item.title,
            "description": item.description,
            "order_index": item.order_index,
            "is_required": item.is_required,
            "estimated_hours": item.estimated_hours,
            "prerequisites": item.prerequisites,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "user_progress": item_progress,
            "is_locked": is_locked,
        }
        items_with_progress.append(LearningPathItemWithProgress(**item_dict))

    return LearningPathWithProgress(
        id=path.id,
        title=path.title,
        description=path.description,
        difficulty_level=path.difficulty_level,
        estimated_hours=path.estimated_hours,
        icon=path.icon,
        color=path.color,
        is_active=path.is_active,
        created_by_id=path.created_by_id,
        created_at=path.created_at,
        updated_at=path.updated_at,
        tags=tags,
        items=[],  # Empty since we have items_with_progress
        total_items=len(path.items),
        required_items=len([i for i in path.items if i.is_required]),
        user_progress=user_progress,
        items_with_progress=items_with_progress,
    )


@router.post("/", response_model=LearningPathResponse, status_code=status.HTTP_201_CREATED)
async def create_learning_path(
    path_data: LearningPathCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new learning path (instructor only)"""
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can create learning paths")

    # Create the path
    new_path = LearningPath(
        title=path_data.title,
        description=path_data.description,
        difficulty_level=path_data.difficulty_level,
        estimated_hours=path_data.estimated_hours,
        icon=path_data.icon,
        color=path_data.color,
        is_active=path_data.is_active,
        created_by_id=current_user.id,
    )

    db.add(new_path)
    await db.flush()

    # Add tags
    if path_data.tags:
        for tag in path_data.tags:
            db.add(LearningPathTag(learning_path_id=new_path.id, tag=tag))

    # Add items
    if path_data.items:
        for item_data in path_data.items:
            new_item = LearningPathItem(
                learning_path_id=new_path.id,
                item_type=item_data.item_type,
                item_id=item_data.item_id,
                title=item_data.title,
                description=item_data.description,
                order_index=item_data.order_index,
                is_required=item_data.is_required,
                estimated_hours=item_data.estimated_hours,
                prerequisites=item_data.prerequisites,
            )
            db.add(new_item)

    await db.commit()
    await db.refresh(new_path)

    # Get tags for response
    tags_result = await db.execute(
        select(LearningPathTag.tag)
        .where(LearningPathTag.learning_path_id == new_path.id)
    )
    tags = [tag[0] for tag in tags_result.all()]

    return LearningPathResponse(
        id=new_path.id,
        title=new_path.title,
        description=new_path.description,
        difficulty_level=new_path.difficulty_level,
        estimated_hours=new_path.estimated_hours,
        icon=new_path.icon,
        color=new_path.color,
        is_active=new_path.is_active,
        created_by_id=new_path.created_by_id,
        created_at=new_path.created_at,
        updated_at=new_path.updated_at,
        tags=tags,
    )


@router.post("/{path_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_path(
    path_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enroll in a learning path"""
    # Check if path exists
    result = await db.execute(
        select(LearningPath).where(LearningPath.id == path_id)
    )
    path = result.scalar_one_or_none()

    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    # Check if already enrolled
    existing_result = await db.execute(
        select(UserLearningProgress)
        .where(UserLearningProgress.user_id == current_user.id)
        .where(UserLearningProgress.learning_path_id == path_id)
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        return EnrollmentResponse(
            success=True,
            message="Already enrolled in this path",
            user_progress=existing,
        )

    # Create enrollment
    progress = UserLearningProgress(
        user_id=current_user.id,
        learning_path_id=path_id,
        status=ProgressStatus.NOT_STARTED,
        progress_percentage=0.0,
    )

    db.add(progress)
    await db.commit()
    await db.refresh(progress)

    return EnrollmentResponse(
        success=True,
        message="Successfully enrolled in learning path",
        user_progress=progress,
    )


@router.post("/items/{item_id}/progress", response_model=UserPathItemProgressResponse)
async def update_item_progress(
    item_id: int,
    progress_data: UserPathItemProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update progress on a learning path item"""
    # Check if item exists
    item_result = await db.execute(
        select(LearningPathItem).where(LearningPathItem.id == item_id)
    )
    item = item_result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Learning path item not found")

    # Get or create progress record
    progress_result = await db.execute(
        select(UserPathItemProgress)
        .where(UserPathItemProgress.user_id == current_user.id)
        .where(UserPathItemProgress.path_item_id == item_id)
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        progress = UserPathItemProgress(
            user_id=current_user.id,
            path_item_id=item_id,
        )
        db.add(progress)

    # Update progress
    progress.status = progress_data.status
    progress.score = progress_data.score
    progress.notes = progress_data.notes
    progress.updated_at = datetime.utcnow()

    if progress_data.status == ProgressStatus.IN_PROGRESS and not progress.started_at:
        progress.started_at = datetime.utcnow()
    elif progress_data.status == ProgressStatus.COMPLETED and not progress.completed_at:
        progress.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(progress)

    # Update overall path progress
    await update_path_progress(db, current_user.id, item.learning_path_id)

    return progress


@router.get("/recommendations/for-me", response_model=RecommendationsResponse)
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10,
):
    """Get personalized learning path recommendations"""

    # Get user's progress on all paths
    user_progress_result = await db.execute(
        select(UserLearningProgress)
        .where(UserLearningProgress.user_id == current_user.id)
    )
    user_progress_list = user_progress_result.scalars().all()

    completed_path_ids = [p.learning_path_id for p in user_progress_list if p.status == ProgressStatus.COMPLETED]
    in_progress_path_ids = [p.learning_path_id for p in user_progress_list if p.status == ProgressStatus.IN_PROGRESS]
    enrolled_path_ids = [p.learning_path_id for p in user_progress_list]

    # Get tags from completed paths
    completed_tags = []
    if completed_path_ids:
        tags_result = await db.execute(
            select(LearningPathTag.tag)
            .where(LearningPathTag.learning_path_id.in_(completed_path_ids))
        )
        completed_tags = [tag[0] for tag in tags_result.all()]

    # Calculate user's difficulty level based on completed paths
    user_difficulty = DifficultyLevel.BEGINNER
    if completed_path_ids:
        difficulty_result = await db.execute(
            select(LearningPath.difficulty_level)
            .where(LearningPath.id.in_(completed_path_ids))
        )
        difficulties = [d[0] for d in difficulty_result.all()]
        difficulty_counts = Counter(difficulties)

        if difficulty_counts.get(DifficultyLevel.ADVANCED, 0) > 0:
            user_difficulty = DifficultyLevel.ADVANCED
        elif difficulty_counts.get(DifficultyLevel.INTERMEDIATE, 0) > 0:
            user_difficulty = DifficultyLevel.INTERMEDIATE

    # Get all available paths (not enrolled or in progress)
    available_paths_result = await db.execute(
        select(LearningPath)
        .where(LearningPath.is_active == True)
        .where(LearningPath.id.notin_(completed_path_ids) if completed_path_ids else True)
    )
    available_paths = available_paths_result.scalars().all()

    # Score and rank paths
    recommendations = []
    for path in available_paths:
        score = 0.0
        reasons = []

        # Get path tags
        path_tags_result = await db.execute(
            select(LearningPathTag.tag)
            .where(LearningPathTag.learning_path_id == path.id)
        )
        path_tags = [tag[0] for tag in path_tags_result.all()]

        # Score based on matching tags
        matching_tags = set(path_tags) & set(completed_tags)
        if matching_tags:
            score += len(matching_tags) * 20
            reasons.append(f"관심 분야와 일치: {', '.join(list(matching_tags)[:3])}")

        # Score based on difficulty progression
        if path.difficulty_level == user_difficulty:
            score += 30
            reasons.append(f"현재 수준에 적합")
        elif user_difficulty == DifficultyLevel.BEGINNER and path.difficulty_level == DifficultyLevel.INTERMEDIATE:
            score += 25
            reasons.append("다음 단계로 진행")
        elif user_difficulty == DifficultyLevel.INTERMEDIATE and path.difficulty_level == DifficultyLevel.ADVANCED:
            score += 25
            reasons.append("고급 단계로 도약")
        elif user_difficulty == DifficultyLevel.BEGINNER and path.difficulty_level == DifficultyLevel.BEGINNER:
            score += 20
            reasons.append("기초 실력 강화")

        # Bonus for paths in progress
        if path.id in in_progress_path_ids:
            score += 40
            reasons.append("진행 중인 경로")

        # Get enrollment count for popularity
        enrollment_result = await db.execute(
            select(func.count(UserLearningProgress.id))
            .where(UserLearningProgress.learning_path_id == path.id)
        )
        enrollment_count = enrollment_result.scalar() or 0

        if enrollment_count > 10:
            score += 10
            reasons.append("인기 경로")

        if score > 0:
            # Get user progress if exists
            path_progress = next((p for p in user_progress_list if p.learning_path_id == path.id), None)

            recommendations.append(
                LearningPathRecommendation(
                    learning_path=LearningPathResponse(
                        id=path.id,
                        title=path.title,
                        description=path.description,
                        difficulty_level=path.difficulty_level,
                        estimated_hours=path.estimated_hours,
                        icon=path.icon,
                        color=path.color,
                        is_active=path.is_active,
                        created_by_id=path.created_by_id,
                        created_at=path.created_at,
                        updated_at=path.updated_at,
                        tags=path_tags,
                    ),
                    recommendation_score=min(score, 100),
                    recommendation_reason=" • ".join(reasons),
                    matching_tags=list(matching_tags),
                    user_progress=path_progress,
                )
            )

    # Sort by score and limit
    recommendations.sort(key=lambda x: x.recommendation_score, reverse=True)
    recommendations = recommendations[:limit]

    return RecommendationsResponse(
        recommendations=recommendations,
        total=len(recommendations),
        user_completed_paths=len(completed_path_ids),
        user_in_progress_paths=len(in_progress_path_ids),
    )


@router.get("/stats/my-stats", response_model=UserLearningStats)
async def get_my_learning_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's learning statistics"""

    # Get all user progress
    progress_result = await db.execute(
        select(UserLearningProgress)
        .where(UserLearningProgress.user_id == current_user.id)
    )
    all_progress = progress_result.scalars().all()

    total_enrolled = len(all_progress)
    total_completed = len([p for p in all_progress if p.status == ProgressStatus.COMPLETED])
    total_in_progress = len([p for p in all_progress if p.status == ProgressStatus.IN_PROGRESS])

    # Get completed items count
    items_result = await db.execute(
        select(func.count(UserPathItemProgress.id))
        .where(UserPathItemProgress.user_id == current_user.id)
        .where(UserPathItemProgress.status == ProgressStatus.COMPLETED)
    )
    total_items_completed = items_result.scalar() or 0

    # Calculate total learning hours (from completed paths)
    completed_path_ids = [p.learning_path_id for p in all_progress if p.status == ProgressStatus.COMPLETED]
    total_hours = 0.0
    if completed_path_ids:
        hours_result = await db.execute(
            select(func.sum(LearningPath.estimated_hours))
            .where(LearningPath.id.in_(completed_path_ids))
        )
        total_hours = hours_result.scalar() or 0.0

    completion_rate = (total_completed / total_enrolled * 100) if total_enrolled > 0 else 0.0

    # Get recent activity
    recent_result = await db.execute(
        select(UserLearningProgress, LearningPath.title)
        .join(LearningPath, UserLearningProgress.learning_path_id == LearningPath.id)
        .where(UserLearningProgress.user_id == current_user.id)
        .order_by(UserLearningProgress.last_accessed_at.desc())
        .limit(5)
    )
    recent_activity = [
        {
            "path_id": p.learning_path_id,
            "path_title": title,
            "status": p.status,
            "progress": p.progress_percentage,
            "last_accessed": p.last_accessed_at.isoformat() if p.last_accessed_at else None,
        }
        for p, title in recent_result.all()
    ]

    return UserLearningStats(
        total_paths_enrolled=total_enrolled,
        total_paths_completed=total_completed,
        total_paths_in_progress=total_in_progress,
        total_items_completed=total_items_completed,
        total_learning_hours=total_hours,
        completion_rate=completion_rate,
        recent_activity=recent_activity,
    )

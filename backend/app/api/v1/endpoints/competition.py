"""
Competition API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
import shutil
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error, roc_auc_score, log_loss

from ....db.base import get_db
from ....api.deps import get_current_user
from ....models.competition import (
    Competition, CompetitionTeam, TeamMember, CompetitionParticipant,
    CompetitionSubmission, CompetitionLeaderboard,
    CompetitionType, EvaluationMetric, SubmissionStatus, MemberStatus
)
from ....models.user import User
from ....schemas.competition import (
    CompetitionCreate, CompetitionUpdate, CompetitionResponse,
    TeamCreate, TeamUpdate, TeamResponse, TeamMemberResponse,
    SubmissionCreate, SubmissionResponse,
    LeaderboardEntry, LeaderboardResponse,
    CompetitionStats, UserCompetitionStats
)

router = APIRouter()

# File upload settings
SUBMISSION_DIR = "uploads/submissions"
DATASET_DIR = "uploads/datasets"
os.makedirs(SUBMISSION_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)


# Helper function to evaluate submission
async def evaluate_submission(
    competition: Competition,
    submission_file_path: str
) -> tuple[float, float]:
    """Evaluate a submission and return (public_score, private_score)"""
    try:
        # Load ground truth
        test_df = pd.read_csv(competition.test_data_path)

        # Load submission
        submission_df = pd.read_csv(submission_file_path)

        # Split into public and private test sets
        public_size = int(len(test_df) * competition.public_test_percentage / 100)
        public_test = test_df.iloc[:public_size]
        private_test = test_df.iloc[public_size:]

        # Merge with submission
        public_submission = submission_df.iloc[:public_size]
        private_submission = submission_df.iloc[public_size:]

        # Get metric function
        metric_func = {
            EvaluationMetric.ACCURACY: lambda y_true, y_pred: accuracy_score(y_true, y_pred.round()),
            EvaluationMetric.F1_SCORE: lambda y_true, y_pred: f1_score(y_true, y_pred.round(), average='weighted'),
            EvaluationMetric.RMSE: lambda y_true, y_pred: np.sqrt(mean_squared_error(y_true, y_pred)),
            EvaluationMetric.MAE: lambda y_true, y_pred: mean_absolute_error(y_true, y_pred),
            EvaluationMetric.AUC: lambda y_true, y_pred: roc_auc_score(y_true, y_pred),
            EvaluationMetric.LOG_LOSS: lambda y_true, y_pred: log_loss(y_true, y_pred),
        }[competition.evaluation_metric]

        # Calculate scores (assuming 'target' column)
        public_score = metric_func(public_test['target'], public_submission['prediction'])
        private_score = metric_func(private_test['target'], private_submission['prediction'])

        return public_score, private_score
    except Exception as e:
        raise ValueError(f"Evaluation error: {str(e)}")


# Helper function to update leaderboard
async def update_leaderboard(
    db: AsyncSession,
    competition_id: int,
    user_id: Optional[int],
    team_id: Optional[int],
    public_score: float,
    private_score: float
):
    """Update leaderboard entry"""
    # Get or create leaderboard entry
    query = select(CompetitionLeaderboard).where(
        CompetitionLeaderboard.competition_id == competition_id
    )

    if user_id:
        query = query.where(CompetitionLeaderboard.user_id == user_id)
        participant_name = f"User {user_id}"
    else:
        query = query.where(CompetitionLeaderboard.team_id == team_id)
        team_result = await db.execute(
            select(CompetitionTeam.name).where(CompetitionTeam.id == team_id)
        )
        participant_name = team_result.scalar_one()

    result = await db.execute(query)
    entry = result.scalar_one_or_none()

    if not entry:
        entry = CompetitionLeaderboard(
            competition_id=competition_id,
            user_id=user_id,
            team_id=team_id,
            participant_name=participant_name,
            best_public_score=public_score,
            best_private_score=private_score,
            submission_count=1,
            last_submission_at=datetime.utcnow()
        )
        db.add(entry)
    else:
        # Update if better score
        if public_score > entry.best_public_score:
            entry.best_public_score = public_score
        if private_score and (not entry.best_private_score or private_score > entry.best_private_score):
            entry.best_private_score = private_score
        entry.submission_count += 1
        entry.last_submission_at = datetime.utcnow()

    await db.commit()

    # Recalculate ranks
    await recalculate_ranks(db, competition_id)


async def recalculate_ranks(db: AsyncSession, competition_id: int):
    """Recalculate leaderboard ranks"""
    # Get all entries sorted by public score
    result = await db.execute(
        select(CompetitionLeaderboard)
        .where(CompetitionLeaderboard.competition_id == competition_id)
        .order_by(desc(CompetitionLeaderboard.best_public_score))
    )
    entries = result.scalars().all()

    # Update ranks
    for i, entry in enumerate(entries, 1):
        entry.rank_public = i

    # Also rank by private score
    entries_private = sorted(
        [e for e in entries if e.best_private_score is not None],
        key=lambda x: x.best_private_score,
        reverse=True
    )
    for i, entry in enumerate(entries_private, 1):
        entry.rank_private = i

    await db.commit()


# ===== Competition Management =====

@router.get("/competitions", response_model=List[CompetitionResponse])
async def list_competitions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
):
    """List all competitions"""
    query = select(Competition)

    if is_active is not None:
        query = query.where(Competition.is_active == is_active)

    query = query.order_by(desc(Competition.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    competitions = result.scalars().all()

    # Check which competitions user has joined
    comp_ids = [c.id for c in competitions]
    participant_result = await db.execute(
        select(CompetitionParticipant.competition_id, CompetitionParticipant.team_id)
        .where(CompetitionParticipant.user_id == current_user.id)
        .where(CompetitionParticipant.competition_id.in_(comp_ids))
    )
    joined_map = {p.competition_id: p.team_id for p in participant_result.all()}

    response = []
    for comp in competitions:
        response.append(CompetitionResponse(
            **comp.__dict__,
            is_joined=comp.id in joined_map,
            my_team_id=joined_map.get(comp.id)
        ))

    return response


@router.get("/competitions/{competition_id}", response_model=CompetitionResponse)
async def get_competition(
    competition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get competition details"""
    result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = result.scalar_one_or_none()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    # Check if user joined
    participant_result = await db.execute(
        select(CompetitionParticipant)
        .where(CompetitionParticipant.competition_id == competition_id)
        .where(CompetitionParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    return CompetitionResponse(
        **competition.__dict__,
        is_joined=participant is not None,
        my_team_id=participant.team_id if participant else None
    )


@router.post("/competitions", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    competition_data: CompetitionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a competition (instructor/admin only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Only instructors can create competitions")

    competition = Competition(
        **competition_data.dict(),
        created_by_id=current_user.id
    )

    db.add(competition)
    await db.commit()
    await db.refresh(competition)

    return CompetitionResponse(**competition.__dict__, is_joined=False)


@router.post("/competitions/{competition_id}/join", response_model=dict)
async def join_competition(
    competition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join a competition"""
    # Check competition exists
    comp_result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = comp_result.scalar_one_or_none()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    # Check already joined
    existing = await db.execute(
        select(CompetitionParticipant)
        .where(CompetitionParticipant.competition_id == competition_id)
        .where(CompetitionParticipant.user_id == current_user.id)
    )

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already joined")

    # Create participant
    participant = CompetitionParticipant(
        competition_id=competition_id,
        user_id=current_user.id
    )

    db.add(participant)
    competition.participant_count += 1
    await db.commit()

    return {"message": "Successfully joined competition"}


# ===== Team Management =====

@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a team"""
    # Check competition type
    comp_result = await db.execute(
        select(Competition).where(Competition.id == team_data.competition_id)
    )
    competition = comp_result.scalar_one_or_none()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    if competition.competition_type != CompetitionType.TEAM:
        raise HTTPException(status_code=400, detail="This competition does not support teams")

    # Create team
    team = CompetitionTeam(
        competition_id=team_data.competition_id,
        name=team_data.name,
        description=team_data.description,
        leader_id=current_user.id
    )

    db.add(team)
    await db.flush()

    # Add leader as member
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="leader",
        status=MemberStatus.ACCEPTED,
        joined_at=datetime.utcnow()
    )

    db.add(member)

    # Update participant
    participant_result = await db.execute(
        select(CompetitionParticipant)
        .where(CompetitionParticipant.competition_id == team_data.competition_id)
        .where(CompetitionParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if participant:
        participant.team_id = team.id

    await db.commit()
    await db.refresh(team)

    return TeamResponse(**team.__dict__, member_count=1, members=[])


@router.get("/competitions/{competition_id}/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    competition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    """Get competition leaderboard"""
    result = await db.execute(
        select(CompetitionLeaderboard)
        .where(CompetitionLeaderboard.competition_id == competition_id)
        .order_by(CompetitionLeaderboard.rank_public)
        .limit(limit)
    )
    entries = result.scalars().all()

    leaderboard_entries = [
        LeaderboardEntry(
            rank_public=entry.rank_public,
            participant_name=entry.participant_name,
            user_id=entry.user_id,
            team_id=entry.team_id,
            best_public_score=entry.best_public_score,
            submission_count=entry.submission_count,
            last_submission_at=entry.last_submission_at
        )
        for entry in entries
    ]

    return LeaderboardResponse(
        competition_id=competition_id,
        entries=leaderboard_entries,
        total=len(entries)
    )


# ===== Submissions =====

@router.post("/competitions/{competition_id}/submit", response_model=SubmissionResponse)
async def submit_to_competition(
    competition_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit to a competition"""
    # Get competition
    comp_result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = comp_result.scalar_one_or_none()

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    # Check if joined
    participant_result = await db.execute(
        select(CompetitionParticipant)
        .where(CompetitionParticipant.competition_id == competition_id)
        .where(CompetitionParticipant.user_id == current_user.id)
    )
    participant = participant_result.scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=403, detail="Must join competition first")

    # Check submission limit
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count_result = await db.execute(
        select(func.count(CompetitionSubmission.id))
        .where(CompetitionSubmission.competition_id == competition_id)
        .where(CompetitionSubmission.user_id == current_user.id)
        .where(CompetitionSubmission.created_at >= today_start)
    )
    today_count = today_count_result.scalar() or 0

    if today_count >= competition.max_submissions_per_day:
        raise HTTPException(status_code=429, detail="Daily submission limit reached")

    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(SUBMISSION_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create submission
    submission = CompetitionSubmission(
        competition_id=competition_id,
        user_id=current_user.id,
        team_id=participant.team_id,
        submission_file_path=file_path,
        status=SubmissionStatus.PENDING,
        submission_count=today_count + 1
    )

    db.add(submission)
    await db.flush()

    # Evaluate submission
    try:
        submission.status = SubmissionStatus.PROCESSING
        await db.commit()

        public_score, private_score = await evaluate_submission(competition, file_path)

        submission.public_score = public_score
        submission.private_score = private_score
        submission.status = SubmissionStatus.COMPLETED

        # Update competition stats
        competition.submission_count += 1

        await db.commit()
        await db.refresh(submission)

        # Update leaderboard
        await update_leaderboard(
            db,
            competition_id,
            current_user.id if not participant.team_id else None,
            participant.team_id,
            public_score,
            private_score
        )

    except Exception as e:
        submission.status = SubmissionStatus.FAILED
        submission.error_message = str(e)
        await db.commit()

    return SubmissionResponse(**submission.__dict__)


@router.get("/competitions/{competition_id}/my-submissions", response_model=List[SubmissionResponse])
async def get_my_submissions(
    competition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's submissions"""
    result = await db.execute(
        select(CompetitionSubmission)
        .where(CompetitionSubmission.competition_id == competition_id)
        .where(CompetitionSubmission.user_id == current_user.id)
        .order_by(desc(CompetitionSubmission.created_at))
    )
    submissions = result.scalars().all()

    return [SubmissionResponse(**s.__dict__) for s in submissions]


# ===== Statistics =====

@router.get("/stats/overview", response_model=CompetitionStats)
async def get_competition_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get competition statistics"""
    stats_result = await db.execute(
        select(
            func.count(Competition.id).label('total'),
            func.count(Competition.id).filter(Competition.is_active == True).label('active'),
            func.count(func.distinct(CompetitionParticipant.user_id)).label('participants'),
            func.count(CompetitionSubmission.id).label('submissions')
        )
        .select_from(Competition)
        .outerjoin(CompetitionParticipant)
        .outerjoin(CompetitionSubmission)
    )

    stats = stats_result.one()

    return CompetitionStats(
        total_competitions=stats.total or 0,
        active_competitions=stats.active or 0,
        total_participants=stats.participants or 0,
        total_submissions=stats.submissions or 0
    )

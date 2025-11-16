"""Add performance indexes

Revision ID: 006
Revises: 005
Create Date: 2025-11-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Learning Paths performance indexes

    # Composite index for active paths filtering and sorting
    op.create_index(
        'ix_learning_paths_active_created',
        'learning_paths',
        ['is_active', 'created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Composite index for difficulty filtering
    op.create_index(
        'ix_learning_paths_active_difficulty',
        'learning_paths',
        ['is_active', 'difficulty_level']
    )

    # Index for tag-based searches
    op.create_index(
        'ix_learning_path_tags_tag_path',
        'learning_path_tags',
        ['tag', 'learning_path_id']
    )

    # Composite index for user progress queries
    op.create_index(
        'ix_user_learning_progress_user_status',
        'user_learning_progress',
        ['user_id', 'status']
    )

    # Composite index for item progress queries
    op.create_index(
        'ix_user_path_item_progress_user_status',
        'user_path_item_progress',
        ['user_id', 'status']
    )

    # Composite index for path item lookups
    op.create_index(
        'ix_learning_path_items_path_required',
        'learning_path_items',
        ['learning_path_id', 'is_required']
    )

    # Virtual Classroom performance indexes

    # Composite index for active classrooms with scheduling
    op.create_index(
        'ix_virtual_classrooms_active_scheduled',
        'virtual_classrooms',
        ['is_active', 'scheduled_start'],
        postgresql_ops={'scheduled_start': 'DESC'}
    )

    # Composite index for classroom participant queries
    op.create_index(
        'ix_classroom_participants_classroom_online',
        'classroom_participants',
        ['classroom_id', 'is_online']
    )

    # Composite index for recording queries
    op.create_index(
        'ix_classroom_recordings_classroom_available',
        'classroom_recordings',
        ['classroom_id', 'is_available']
    )

    # Coding Environment performance indexes

    # Composite index for problem queries
    op.create_index(
        'ix_coding_problems_difficulty_language',
        'coding_problems',
        ['difficulty_level', 'language']
    )

    # Composite index for user submissions
    op.create_index(
        'ix_code_submissions_user_created',
        'code_submissions',
        ['user_id', 'created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Composite index for submission status queries
    op.create_index(
        'ix_code_submissions_problem_status',
        'code_submissions',
        ['problem_id', 'status']
    )

    # Collaborative Coding performance indexes

    # Composite index for active sessions
    op.create_index(
        'ix_collaborative_sessions_active_created',
        'collaborative_coding_sessions',
        ['is_active', 'created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Composite index for session participants
    op.create_index(
        'ix_session_participants_session_role',
        'session_participants',
        ['session_id', 'role']
    )


def downgrade() -> None:
    # Drop all created indexes
    op.drop_index('ix_learning_paths_active_created', 'learning_paths')
    op.drop_index('ix_learning_paths_active_difficulty', 'learning_paths')
    op.drop_index('ix_learning_path_tags_tag_path', 'learning_path_tags')
    op.drop_index('ix_user_learning_progress_user_status', 'user_learning_progress')
    op.drop_index('ix_user_path_item_progress_user_status', 'user_path_item_progress')
    op.drop_index('ix_learning_path_items_path_required', 'learning_path_items')
    op.drop_index('ix_virtual_classrooms_active_scheduled', 'virtual_classrooms')
    op.drop_index('ix_classroom_participants_classroom_online', 'classroom_participants')
    op.drop_index('ix_classroom_recordings_classroom_available', 'classroom_recordings')
    op.drop_index('ix_coding_problems_difficulty_language', 'coding_problems')
    op.drop_index('ix_code_submissions_user_created', 'code_submissions')
    op.drop_index('ix_code_submissions_problem_status', 'code_submissions')
    op.drop_index('ix_collaborative_sessions_active_created', 'collaborative_coding_sessions')
    op.drop_index('ix_session_participants_session_role', 'session_participants')

"""Add learning paths tables

Revision ID: 002
Revises: 001
Create Date: 2025-11-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create learning_paths table
    op.create_table(
        'learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('difficulty_level', sa.String(length=20), nullable=False),  # beginner, intermediate, advanced
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_learning_paths_id', 'learning_paths', ['id'])
    op.create_index('ix_learning_paths_difficulty', 'learning_paths', ['difficulty_level'])

    # Create learning_path_items table
    op.create_table(
        'learning_path_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('item_type', sa.String(length=20), nullable=False),  # course, assignment, quiz, resource
        sa.Column('item_id', sa.Integer(), nullable=False),  # ID of the course/assignment/quiz
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('prerequisites', postgresql.JSONB(), nullable=True),  # IDs of items that must be completed first
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_learning_path_items_id', 'learning_path_items', ['id'])
    op.create_index('ix_learning_path_items_path', 'learning_path_items', ['learning_path_id'])
    op.create_index('ix_learning_path_items_order', 'learning_path_items', ['learning_path_id', 'order_index'])

    # Create user_learning_progress table
    op.create_table(
        'user_learning_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='not_started'),  # not_started, in_progress, completed
        sa.Column('progress_percentage', sa.Float(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('last_accessed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'learning_path_id', name='uix_user_learning_path')
    )
    op.create_index('ix_user_learning_progress_id', 'user_learning_progress', ['id'])
    op.create_index('ix_user_learning_progress_user', 'user_learning_progress', ['user_id'])
    op.create_index('ix_user_learning_progress_path', 'user_learning_progress', ['learning_path_id'])

    # Create user_path_item_progress table
    op.create_table(
        'user_path_item_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('path_item_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='not_started'),  # not_started, in_progress, completed
        sa.Column('score', sa.Float(), nullable=True),  # Score if applicable (e.g., quiz, assignment)
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['path_item_id'], ['learning_path_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'path_item_id', name='uix_user_path_item')
    )
    op.create_index('ix_user_path_item_progress_id', 'user_path_item_progress', ['id'])
    op.create_index('ix_user_path_item_progress_user', 'user_path_item_progress', ['user_id'])
    op.create_index('ix_user_path_item_progress_item', 'user_path_item_progress', ['path_item_id'])

    # Create learning_path_tags table
    op.create_table(
        'learning_path_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('tag', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_learning_path_tags_tag', 'learning_path_tags', ['tag'])
    op.create_index('ix_learning_path_tags_path', 'learning_path_tags', ['learning_path_id'])


def downgrade() -> None:
    op.drop_table('learning_path_tags')
    op.drop_table('user_path_item_progress')
    op.drop_table('user_learning_progress')
    op.drop_table('learning_path_items')
    op.drop_table('learning_paths')

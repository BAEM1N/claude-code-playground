"""Add collaborative coding sessions

Revision ID: 004
Revises: 003
Create Date: 2025-11-14 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create collaborative_coding_sessions table
    op.create_table(
        'collaborative_coding_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('code', sa.Text(), nullable=False, server_default=''),
        sa.Column('host_id', sa.Integer(), nullable=False),  # Instructor
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('max_participants', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_collaborative_coding_sessions_id', 'collaborative_coding_sessions', ['id'])
    op.create_index('ix_collaborative_coding_sessions_host', 'collaborative_coding_sessions', ['host_id'])
    op.create_index('ix_collaborative_coding_sessions_active', 'collaborative_coding_sessions', ['is_active'])

    # Create session_participants table
    op.create_table(
        'session_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),  # host, participant
        sa.Column('cursor_position', postgresql.JSONB(), nullable=True),  # {line: 1, column: 0}
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['collaborative_coding_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'user_id', name='uix_session_user')
    )
    op.create_index('ix_session_participants_id', 'session_participants', ['id'])
    op.create_index('ix_session_participants_session', 'session_participants', ['session_id'])
    op.create_index('ix_session_participants_user', 'session_participants', ['user_id'])


def downgrade() -> None:
    op.drop_table('session_participants')
    op.drop_table('collaborative_coding_sessions')

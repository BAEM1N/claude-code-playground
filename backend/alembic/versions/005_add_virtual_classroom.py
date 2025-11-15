"""Add virtual classroom with WebRTC support

Revision ID: 005
Revises: 004
Create Date: 2025-11-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create virtual_classrooms table
    op.create_table(
        'virtual_classrooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('host_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('scheduled_start', sa.DateTime(), nullable=True),
        sa.Column('scheduled_end', sa.DateTime(), nullable=True),
        sa.Column('actual_start', sa.DateTime(), nullable=True),
        sa.Column('actual_end', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_recording', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('max_participants', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('settings', postgresql.JSONB(), nullable=True),  # {enableChat, enableWhiteboard, etc.}
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_virtual_classrooms_id', 'virtual_classrooms', ['id'])
    op.create_index('ix_virtual_classrooms_host', 'virtual_classrooms', ['host_id'])
    op.create_index('ix_virtual_classrooms_active', 'virtual_classrooms', ['is_active'])
    op.create_index('ix_virtual_classrooms_scheduled', 'virtual_classrooms', ['scheduled_start'])

    # Create classroom_participants table
    op.create_table(
        'classroom_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),  # host, presenter, participant
        sa.Column('peer_id', sa.String(length=100), nullable=True),  # WebRTC peer identifier
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_video_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_audio_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_screen_sharing', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('connection_quality', sa.String(length=20), nullable=True),  # excellent, good, poor
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('classroom_id', 'user_id', name='uix_classroom_user')
    )
    op.create_index('ix_classroom_participants_id', 'classroom_participants', ['id'])
    op.create_index('ix_classroom_participants_classroom', 'classroom_participants', ['classroom_id'])
    op.create_index('ix_classroom_participants_user', 'classroom_participants', ['user_id'])
    op.create_index('ix_classroom_participants_online', 'classroom_participants', ['is_online'])

    # Create whiteboard_strokes table
    op.create_table(
        'whiteboard_strokes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('stroke_data', postgresql.JSONB(), nullable=False),  # {points: [], color, width, tool}
        sa.Column('stroke_order', sa.Integer(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_whiteboard_strokes_id', 'whiteboard_strokes', ['id'])
    op.create_index('ix_whiteboard_strokes_classroom', 'whiteboard_strokes', ['classroom_id'])
    op.create_index('ix_whiteboard_strokes_order', 'whiteboard_strokes', ['classroom_id', 'stroke_order'])

    # Create shared_files table
    op.create_table(
        'shared_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),  # bytes
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('download_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_shared_files_id', 'shared_files', ['id'])
    op.create_index('ix_shared_files_classroom', 'shared_files', ['classroom_id'])
    op.create_index('ix_shared_files_uploader', 'shared_files', ['uploaded_by_id'])

    # Create classroom_recordings table
    op.create_table(
        'classroom_recordings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),  # seconds
        sa.Column('format', sa.String(length=50), nullable=False),  # webm, mp4, etc.
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('is_processing', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_classroom_recordings_id', 'classroom_recordings', ['id'])
    op.create_index('ix_classroom_recordings_classroom', 'classroom_recordings', ['classroom_id'])
    op.create_index('ix_classroom_recordings_available', 'classroom_recordings', ['is_available'])


def downgrade() -> None:
    op.drop_table('classroom_recordings')
    op.drop_table('shared_files')
    op.drop_table('whiteboard_strokes')
    op.drop_table('classroom_participants')
    op.drop_table('virtual_classrooms')

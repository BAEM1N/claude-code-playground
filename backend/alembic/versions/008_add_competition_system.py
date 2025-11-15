"""Add competition system

Revision ID: 008
Revises: 007
Create Date: 2025-11-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create competitions table
    op.create_table(
        'competitions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('problem_statement', sa.Text(), nullable=False),
        sa.Column('evaluation_metric', sa.String(length=50), nullable=False),  # accuracy, f1, rmse, mae, etc.
        sa.Column('competition_type', sa.String(length=20), nullable=False),  # individual, team
        sa.Column('max_team_size', sa.Integer(), nullable=True),
        sa.Column('max_submissions_per_day', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('prize_description', sa.Text(), nullable=True),
        sa.Column('rules', sa.Text(), nullable=True),
        sa.Column('dataset_description', sa.Text(), nullable=True),
        sa.Column('train_data_path', sa.String(length=500), nullable=True),
        sa.Column('test_data_path', sa.String(length=500), nullable=True),
        sa.Column('sample_submission_path', sa.String(length=500), nullable=True),
        sa.Column('public_test_percentage', sa.Integer(), nullable=False, server_default='50'),  # % for public leaderboard
        sa.Column('participant_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('submission_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_competitions_id', 'competitions', ['id'])
    op.create_index('ix_competitions_active', 'competitions', ['is_active'])
    op.create_index('ix_competitions_dates', 'competitions', ['start_date', 'end_date'])

    # Create teams table
    op.create_table(
        'competition_teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('leader_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['leader_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_competition_teams_id', 'competition_teams', ['id'])
    op.create_index('ix_competition_teams_competition', 'competition_teams', ['competition_id'])

    # Create team members table
    op.create_table(
        'team_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),  # leader, member
        sa.Column('status', sa.String(length=20), nullable=False),  # pending, accepted, rejected
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['team_id'], ['competition_teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='uix_team_user')
    )
    op.create_index('ix_team_members_team', 'team_members', ['team_id'])
    op.create_index('ix_team_members_user', 'team_members', ['user_id'])

    # Create participants table (for individual competitions)
    op.create_table(
        'competition_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['competition_teams.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('competition_id', 'user_id', name='uix_competition_user')
    )
    op.create_index('ix_competition_participants_competition', 'competition_participants', ['competition_id'])
    op.create_index('ix_competition_participants_user', 'competition_participants', ['user_id'])

    # Create submissions table
    op.create_table(
        'competition_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('submission_file_path', sa.String(length=500), nullable=False),
        sa.Column('public_score', sa.Float(), nullable=True),
        sa.Column('private_score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),  # pending, processing, completed, failed
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('is_selected', sa.Boolean(), nullable=False, server_default='false'),  # Selected for final ranking
        sa.Column('submission_count', sa.Integer(), nullable=False),  # nth submission of the day
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['competition_teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_competition_submissions_id', 'competition_submissions', ['id'])
    op.create_index('ix_competition_submissions_competition', 'competition_submissions', ['competition_id'])
    op.create_index('ix_competition_submissions_user', 'competition_submissions', ['user_id'])
    op.create_index('ix_competition_submissions_team', 'competition_submissions', ['team_id'])
    op.create_index('ix_competition_submissions_created', 'competition_submissions',
                    ['competition_id', 'created_at'],
                    postgresql_ops={'created_at': 'DESC'})

    # Create leaderboard table (materialized view for performance)
    op.create_table(
        'competition_leaderboard',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('participant_name', sa.String(length=100), nullable=False),
        sa.Column('best_public_score', sa.Float(), nullable=False),
        sa.Column('best_private_score', sa.Float(), nullable=True),
        sa.Column('submission_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rank_public', sa.Integer(), nullable=True),
        sa.Column('rank_private', sa.Integer(), nullable=True),
        sa.Column('last_submission_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['competition_teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('competition_id', 'user_id', name='uix_leaderboard_comp_user'),
        sa.UniqueConstraint('competition_id', 'team_id', name='uix_leaderboard_comp_team'),
        sa.CheckConstraint('(user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL)',
                          name='check_leaderboard_participant')
    )
    op.create_index('ix_competition_leaderboard_competition', 'competition_leaderboard', ['competition_id'])
    op.create_index('ix_competition_leaderboard_public_rank', 'competition_leaderboard',
                    ['competition_id', 'rank_public'])
    op.create_index('ix_competition_leaderboard_private_rank', 'competition_leaderboard',
                    ['competition_id', 'rank_private'])


def downgrade() -> None:
    op.drop_table('competition_leaderboard')
    op.drop_table('competition_submissions')
    op.drop_table('competition_participants')
    op.drop_table('team_members')
    op.drop_table('competition_teams')
    op.drop_table('competitions')

"""Add coding environment tables

Revision ID: 003
Revises: 002
Create Date: 2025-11-14 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create coding_problems table
    op.create_table(
        'coding_problems',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),  # easy, medium, hard
        sa.Column('language', sa.String(length=50), nullable=False),  # python, javascript, java, cpp, etc.
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('solution_code', sa.Text(), nullable=True),
        sa.Column('time_limit', sa.Integer(), nullable=False, server_default='5'),  # seconds
        sa.Column('memory_limit', sa.Integer(), nullable=False, server_default='128'),  # MB
        sa.Column('tags', postgresql.JSONB(), nullable=True),  # ["array", "sorting", etc.]
        sa.Column('hints', postgresql.JSONB(), nullable=True),  # ["hint1", "hint2", etc.]
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('assignment_id', sa.Integer(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_coding_problems_id', 'coding_problems', ['id'])
    op.create_index('ix_coding_problems_difficulty', 'coding_problems', ['difficulty'])
    op.create_index('ix_coding_problems_language', 'coding_problems', ['language'])
    op.create_index('ix_coding_problems_course', 'coding_problems', ['course_id'])

    # Create test_cases table
    op.create_table(
        'test_cases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('input_data', sa.Text(), nullable=False),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('is_sample', sa.Boolean(), nullable=False, server_default='false'),  # Sample cases shown to users
        sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='false'),  # Hidden test cases
        sa.Column('points', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['problem_id'], ['coding_problems.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_test_cases_id', 'test_cases', ['id'])
    op.create_index('ix_test_cases_problem', 'test_cases', ['problem_id'])

    # Create code_submissions table
    op.create_table(
        'code_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),  # pending, running, passed, failed, error, timeout
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('total_test_cases', sa.Integer(), nullable=True),
        sa.Column('passed_test_cases', sa.Integer(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=True),  # milliseconds
        sa.Column('memory_used', sa.Float(), nullable=True),  # MB
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('test_results', postgresql.JSONB(), nullable=True),  # Detailed results per test case
        sa.Column('submitted_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['problem_id'], ['coding_problems.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_code_submissions_id', 'code_submissions', ['id'])
    op.create_index('ix_code_submissions_problem', 'code_submissions', ['problem_id'])
    op.create_index('ix_code_submissions_user', 'code_submissions', ['user_id'])
    op.create_index('ix_code_submissions_status', 'code_submissions', ['status'])

    # Create code_executions table (for playground/practice mode)
    op.create_table(
        'code_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('input_data', sa.Text(), nullable=True),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=True),
        sa.Column('memory_used', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),  # success, error, timeout
        sa.Column('executed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_code_executions_id', 'code_executions', ['id'])
    op.create_index('ix_code_executions_user', 'code_executions', ['user_id'])

    # Create saved_codes table (for saving work)
    op.create_table(
        'saved_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['problem_id'], ['coding_problems.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_saved_codes_id', 'saved_codes', ['id'])
    op.create_index('ix_saved_codes_user', 'saved_codes', ['user_id'])


def downgrade() -> None:
    op.drop_table('saved_codes')
    op.drop_table('code_executions')
    op.drop_table('code_submissions')
    op.drop_table('test_cases')
    op.drop_table('coding_problems')

"""Add AI assistant tables

Revision ID: 001_add_ai_assistant
Revises:
Create Date: 2025-11-14 17:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_ai_assistant'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ai_conversations table
    op.create_table(
        'ai_conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('task_type', sa.Enum('code_review', 'explain_concept', 'generate_quiz', 'summarize', 'answer_question', 'chat', 'custom', name='aitasktype'), nullable=False),
        sa.Column('provider', sa.Enum('openai', 'claude', 'gemini', 'openrouter', name='aiprovider'), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('message_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_conversations_user_id'), 'ai_conversations', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_conversations_course_id'), 'ai_conversations', ['course_id'], unique=False)

    # Create ai_messages table
    op.create_table(
        'ai_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_messages_conversation_id'), 'ai_messages', ['conversation_id'], unique=False)

    # Create ai_code_reviews table
    op.create_table(
        'ai_code_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=True),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('context', sa.Text(), nullable=True),
        sa.Column('review', sa.Text(), nullable=False),
        sa.Column('provider', sa.Enum('openai', 'claude', 'gemini', 'openrouter', name='aiprovider'), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('was_helpful', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_code_reviews_user_id'), 'ai_code_reviews', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_code_reviews_submission_id'), 'ai_code_reviews', ['submission_id'], unique=False)

    # Create ai_quiz_generations table
    op.create_table(
        'ai_quiz_generations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('topic', sa.String(length=200), nullable=False),
        sa.Column('num_questions', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('question_types', sa.JSON(), nullable=False),
        sa.Column('generated_questions', sa.JSON(), nullable=False),
        sa.Column('provider', sa.Enum('openai', 'claude', 'gemini', 'openrouter', name='aiprovider'), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_quiz_generations_user_id'), 'ai_quiz_generations', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_quiz_generations_course_id'), 'ai_quiz_generations', ['course_id'], unique=False)

    # Create ai_usage_logs table
    op.create_table(
        'ai_usage_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('task_type', sa.Enum('code_review', 'explain_concept', 'generate_quiz', 'summarize', 'answer_question', 'chat', 'custom', name='aitasktype'), nullable=False),
        sa.Column('provider', sa.Enum('openai', 'claude', 'gemini', 'openrouter', name='aiprovider'), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_usage_logs_user_id'), 'ai_usage_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_usage_logs_course_id'), 'ai_usage_logs', ['course_id'], unique=False)
    op.create_index(op.f('ix_ai_usage_logs_created_at'), 'ai_usage_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_ai_usage_logs_created_at'), table_name='ai_usage_logs')
    op.drop_index(op.f('ix_ai_usage_logs_course_id'), table_name='ai_usage_logs')
    op.drop_index(op.f('ix_ai_usage_logs_user_id'), table_name='ai_usage_logs')
    op.drop_table('ai_usage_logs')

    op.drop_index(op.f('ix_ai_quiz_generations_course_id'), table_name='ai_quiz_generations')
    op.drop_index(op.f('ix_ai_quiz_generations_user_id'), table_name='ai_quiz_generations')
    op.drop_table('ai_quiz_generations')

    op.drop_index(op.f('ix_ai_code_reviews_submission_id'), table_name='ai_code_reviews')
    op.drop_index(op.f('ix_ai_code_reviews_user_id'), table_name='ai_code_reviews')
    op.drop_table('ai_code_reviews')

    op.drop_index(op.f('ix_ai_messages_conversation_id'), table_name='ai_messages')
    op.drop_table('ai_messages')

    op.drop_index(op.f('ix_ai_conversations_course_id'), table_name='ai_conversations')
    op.drop_index(op.f('ix_ai_conversations_user_id'), table_name='ai_conversations')
    op.drop_table('ai_conversations')

    # Drop enums (PostgreSQL only)
    sa.Enum(name='aiprovider').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='aitasktype').drop(op.get_bind(), checkfirst=True)

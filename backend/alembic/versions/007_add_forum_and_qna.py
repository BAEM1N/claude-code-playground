"""Add forum and Q&A system

Revision ID: 007
Revises: 006
Create Date: 2025-11-15 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create forums table (categories)
    op.create_table(
        'forums',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('post_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_forums_id', 'forums', ['id'])
    op.create_index('ix_forums_active_order', 'forums', ['is_active', 'order_index'])

    # Create posts table
    op.create_table(
        'forum_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('forum_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('post_type', sa.String(length=20), nullable=False, server_default='discussion'),  # discussion, question
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_locked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_solved', sa.Boolean(), nullable=False, server_default='false'),  # For Q&A
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('vote_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reply_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_activity_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['forum_id'], ['forums.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_forum_posts_id', 'forum_posts', ['id'])
    op.create_index('ix_forum_posts_forum', 'forum_posts', ['forum_id'])
    op.create_index('ix_forum_posts_user', 'forum_posts', ['user_id'])
    op.create_index('ix_forum_posts_type', 'forum_posts', ['post_type'])
    op.create_index('ix_forum_posts_forum_activity', 'forum_posts',
                    ['forum_id', 'last_activity_at'],
                    postgresql_ops={'last_activity_at': 'DESC'})
    op.create_index('ix_forum_posts_forum_pinned', 'forum_posts',
                    ['forum_id', 'is_pinned', 'last_activity_at'],
                    postgresql_ops={'last_activity_at': 'DESC'})

    # Create replies table
    op.create_table(
        'forum_replies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_reply_id', sa.Integer(), nullable=True),  # For nested replies
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_best_answer', sa.Boolean(), nullable=False, server_default='false'),  # For Q&A
        sa.Column('vote_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_reply_id'], ['forum_replies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_forum_replies_id', 'forum_replies', ['id'])
    op.create_index('ix_forum_replies_post', 'forum_replies', ['post_id'])
    op.create_index('ix_forum_replies_user', 'forum_replies', ['user_id'])
    op.create_index('ix_forum_replies_post_created', 'forum_replies',
                    ['post_id', 'created_at'],
                    postgresql_ops={'created_at': 'ASC'})
    op.create_index('ix_forum_replies_best_answer', 'forum_replies',
                    ['post_id', 'is_best_answer'])

    # Create votes table
    op.create_table(
        'forum_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=True),
        sa.Column('reply_id', sa.Integer(), nullable=True),
        sa.Column('vote_type', sa.String(length=10), nullable=False),  # upvote, downvote
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reply_id'], ['forum_replies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id', name='uix_user_post_vote'),
        sa.UniqueConstraint('user_id', 'reply_id', name='uix_user_reply_vote'),
        sa.CheckConstraint('(post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL)',
                          name='check_vote_target')
    )
    op.create_index('ix_forum_votes_user', 'forum_votes', ['user_id'])
    op.create_index('ix_forum_votes_post', 'forum_votes', ['post_id'])
    op.create_index('ix_forum_votes_reply', 'forum_votes', ['reply_id'])

    # Create tags table
    op.create_table(
        'forum_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('post_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('ix_forum_tags_id', 'forum_tags', ['id'])
    op.create_index('ix_forum_tags_slug', 'forum_tags', ['slug'])

    # Create post_tags junction table
    op.create_table(
        'forum_post_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['forum_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'tag_id', name='uix_post_tag')
    )
    op.create_index('ix_forum_post_tags_post', 'forum_post_tags', ['post_id'])
    op.create_index('ix_forum_post_tags_tag', 'forum_post_tags', ['tag_id'])

    # Create bookmarks table
    op.create_table(
        'forum_bookmarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id', name='uix_user_post_bookmark')
    )
    op.create_index('ix_forum_bookmarks_user', 'forum_bookmarks', ['user_id'])
    op.create_index('ix_forum_bookmarks_post', 'forum_bookmarks', ['post_id'])

    # Create user activity tracking table
    op.create_table(
        'forum_user_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reply_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('best_answer_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_votes_received', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reputation_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_active_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_forum_user_stats_user', 'forum_user_stats', ['user_id'])
    op.create_index('ix_forum_user_stats_reputation', 'forum_user_stats',
                    ['reputation_score'],
                    postgresql_ops={'reputation_score': 'DESC'})


def downgrade() -> None:
    op.drop_table('forum_user_stats')
    op.drop_table('forum_bookmarks')
    op.drop_table('forum_post_tags')
    op.drop_table('forum_tags')
    op.drop_table('forum_votes')
    op.drop_table('forum_replies')
    op.drop_table('forum_posts')
    op.drop_table('forums')

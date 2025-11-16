from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Set required security environment variables BEFORE loading .env
# These are required by config.py but not actually used during migrations
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("SUPABASE_JWT_SECRET", "dummy")
os.environ.setdefault("SECRET_KEY", "dummy-secret-key-for-migration")
os.environ.setdefault("MINIO_ACCESS_KEY", "dummy")
os.environ.setdefault("MINIO_SECRET_KEY", "dummy")

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(override=False)  # Don't override defaults set above

# Override the sqlalchemy.url from environment variable if present
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import Base directly without importing app.models (which imports settings)
from app.db.base import Base

# Import models individually to avoid loading settings
from app.models.user import UserProfile
from app.models.course import Course, CourseMember
from app.models.channel import Channel
from app.models.message import Message, MessageReaction, Mention
from app.models.file import File, Folder, FileTag, MessageFile
from app.models.notification import Notification, Announcement
from app.models.assignment import Assignment, Submission, Grade, AssignmentFile, SubmissionFile
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.quiz import Quiz, Question, QuizAttempt, Answer
from app.models.progress import LearningProgress, Achievement, LearningActivity, Milestone, MilestoneCompletion
from app.models.calendar import CalendarEvent, EventReminder, EventAttendee, PersonalEvent
from app.models.learning import LearningTrack, LearningModule, LearningChapter, LearningTopic, TopicProgress, NotebookExecution
from app.models.ai_assistant import AIConversation, AIMessage, AICodeReview, AIQuizGeneration, AIUsageLog

# Set target metadata for autogenerate support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

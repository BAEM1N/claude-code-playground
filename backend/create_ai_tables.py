"""
Standalone script to create AI assistant tables.
This bypasses the alembic migration issue with Pydantic Settings.
"""
import asyncio
import sqlite3
from pathlib import Path


async def create_ai_tables():
    """Create AI assistant tables directly in SQLite."""

    db_path = Path(__file__).parent / "app.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    print("Creating AI assistant tables...")

    # Create ai_conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(50) NOT NULL,
            course_id INTEGER,
            title VARCHAR(200),
            task_type VARCHAR(50) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model VARCHAR(100) NOT NULL,
            message_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_conversations_user_id ON ai_conversations(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_conversations_course_id ON ai_conversations(course_id)")
    print("✓ Created ai_conversations table")

    # Create ai_messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            tokens_used INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_messages_conversation_id ON ai_messages(conversation_id)")
    print("✓ Created ai_messages table")

    # Create ai_code_reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_code_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(50) NOT NULL,
            submission_id INTEGER,
            code TEXT NOT NULL,
            language VARCHAR(50) NOT NULL,
            context TEXT,
            review TEXT NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model VARCHAR(100) NOT NULL,
            tokens_used INTEGER,
            was_helpful BOOLEAN,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE SET NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_code_reviews_user_id ON ai_code_reviews(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_code_reviews_submission_id ON ai_code_reviews(submission_id)")
    print("✓ Created ai_code_reviews table")

    # Create ai_quiz_generations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_quiz_generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(50) NOT NULL,
            course_id INTEGER NOT NULL,
            topic VARCHAR(200) NOT NULL,
            num_questions INTEGER NOT NULL,
            difficulty VARCHAR(20) NOT NULL,
            question_types TEXT NOT NULL,
            generated_questions TEXT NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model VARCHAR(100) NOT NULL,
            tokens_used INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_quiz_generations_user_id ON ai_quiz_generations(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_quiz_generations_course_id ON ai_quiz_generations(course_id)")
    print("✓ Created ai_quiz_generations table")

    # Create ai_usage_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR(50) NOT NULL,
            course_id INTEGER,
            task_type VARCHAR(50) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model VARCHAR(100) NOT NULL,
            tokens_used INTEGER,
            response_time_ms INTEGER,
            error TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_user_id ON ai_usage_logs(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_course_id ON ai_usage_logs(course_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_created_at ON ai_usage_logs(created_at)")
    print("✓ Created ai_usage_logs table")

    conn.commit()
    conn.close()

    print("\n✅ All AI assistant tables created successfully!")
    print(f"Database: {db_path}")


if __name__ == "__main__":
    asyncio.run(create_ai_tables())

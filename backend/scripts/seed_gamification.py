"""
Seed gamification data (badges, quests)
게이미피케이션 초기 데이터 생성
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.gamification import (
    BadgeDefinition,
    BadgeType,
    BadgeCategory,
    DailyQuestDefinition
)


async def seed_badges(db: AsyncSession):
    """Create initial badges"""
    badges = [
        # 🎓 Learning Badges
        {
            "badge_key": "first_video",
            "name": "첫 동영상 시청",
            "description": "첫 번째 동영상 강의를 완료했습니다!",
            "icon_emoji": "🎬",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 50,
            "points_reward": 10,
            "requirements": {"type": "activity", "value": "video_complete", "count": 1}
        },
        {
            "badge_key": "first_assignment",
            "name": "첫 과제 제출",
            "description": "첫 번째 과제를 제출했습니다!",
            "icon_emoji": "📝",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 100,
            "points_reward": 20,
            "requirements": {"type": "activity", "value": "assignment_submit", "count": 1}
        },
        {
            "badge_key": "quiz_master_bronze",
            "name": "퀴즈 마스터 (브론즈)",
            "description": "퀴즈 10개를 완료했습니다!",
            "icon_emoji": "🥉",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 200,
            "points_reward": 50,
            "requirements": {"type": "activity", "value": "quiz_complete", "count": 10}
        },
        {
            "badge_key": "perfect_quiz",
            "name": "완벽한 퀴즈",
            "description": "퀴즈에서 만점을 획득했습니다!",
            "icon_emoji": "💯",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 150,
            "points_reward": 30,
            "requirements": {"type": "activity", "value": "quiz_perfect", "count": 1}
        },

        # 🔥 Streak Badges
        {
            "badge_key": "streak_3",
            "name": "3일 연속 학습",
            "description": "3일 연속으로 학습했습니다!",
            "icon_emoji": "🔥",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.STREAK,
            "xp_reward": 100,
            "points_reward": 20,
            "requirements": {"type": "streak", "value": 3}
        },
        {
            "badge_key": "streak_7",
            "name": "일주일 연속 학습",
            "description": "7일 연속으로 학습했습니다! 대단해요!",
            "icon_emoji": "🔥🔥",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.STREAK,
            "xp_reward": 300,
            "points_reward": 60,
            "requirements": {"type": "streak", "value": 7}
        },
        {
            "badge_key": "streak_30",
            "name": "한 달 연속 학습",
            "description": "30일 연속 학습! 정말 대단합니다!",
            "icon_emoji": "🔥🔥🔥",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.STREAK,
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "streak", "value": 30}
        },
        {
            "badge_key": "streak_100",
            "name": "100일 연속 학습",
            "description": "100일 연속 학습! 전설이 되었습니다!",
            "icon_emoji": "👑",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.STREAK,
            "xp_reward": 5000,
            "points_reward": 1000,
            "requirements": {"type": "streak", "value": 100}
        },

        # ⬆️ Level Badges
        {
            "badge_key": "level_5",
            "name": "레벨 5 달성",
            "description": "레벨 5에 도달했습니다!",
            "icon_emoji": "⭐",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 200,
            "points_reward": 40,
            "requirements": {"type": "level", "value": 5}
        },
        {
            "badge_key": "level_10",
            "name": "레벨 10 달성",
            "description": "레벨 10에 도달했습니다!",
            "icon_emoji": "⭐⭐",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "level", "value": 10}
        },
        {
            "badge_key": "level_25",
            "name": "레벨 25 달성",
            "description": "레벨 25에 도달했습니다!",
            "icon_emoji": "🌟",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 1500,
            "points_reward": 300,
            "requirements": {"type": "level", "value": 25}
        },
        {
            "badge_key": "level_50",
            "name": "레벨 50 달성",
            "description": "레벨 50! 마스터입니다!",
            "icon_emoji": "💎",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 5000,
            "points_reward": 1000,
            "requirements": {"type": "level", "value": 50}
        },

        # 👥 Social Badges
        {
            "badge_key": "first_forum_post",
            "name": "포럼 첫 글",
            "description": "포럼에 첫 글을 작성했습니다!",
            "icon_emoji": "💬",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.SOCIAL,
            "xp_reward": 50,
            "points_reward": 10,
            "requirements": {"type": "activity", "value": "forum_post", "count": 1}
        },
        {
            "badge_key": "helpful_member",
            "name": "도움이 되는 멤버",
            "description": "도움이 되는 답변을 10개 작성했습니다!",
            "icon_emoji": "🤝",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.SOCIAL,
            "xp_reward": 300,
            "points_reward": 60,
            "requirements": {"type": "activity", "value": "helpful_answer", "count": 10}
        },

        # 💻 Coding Badges
        {
            "badge_key": "first_code_execution",
            "name": "첫 코드 실행",
            "description": "코딩 플레이그라운드에서 첫 코드를 실행했습니다!",
            "icon_emoji": "💻",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.SKILL,
            "xp_reward": 50,
            "points_reward": 10,
            "requirements": {"type": "activity", "value": "code_execute", "count": 1}
        },
        {
            "badge_key": "code_enthusiast",
            "name": "코딩 열정가",
            "description": "코드를 100번 실행했습니다!",
            "icon_emoji": "🚀",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.SKILL,
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "activity", "value": "code_execute", "count": 100}
        },

        # 🏆 Competition Badges
        {
            "badge_key": "first_competition",
            "name": "첫 대회 참가",
            "description": "첫 번째 대회에 참가했습니다!",
            "icon_emoji": "🎯",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.COMPETITION,
            "xp_reward": 100,
            "points_reward": 20,
            "requirements": {"type": "activity", "value": "competition_join", "count": 1}
        },
        {
            "badge_key": "competition_winner",
            "name": "대회 우승",
            "description": "대회에서 우승했습니다!",
            "icon_emoji": "🏆",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.COMPETITION,
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "activity", "value": "competition_win", "count": 1}
        },

        # ⏰ Time-based Badges
        {
            "badge_key": "early_bird",
            "name": "일찍 일어나는 새",
            "description": "오전 6시 이전에 학습을 시작했습니다!",
            "icon_emoji": "🌅",
            "badge_type": BadgeType.SPECIAL,
            "category": BadgeCategory.SPECIAL_EVENT,
            "xp_reward": 100,
            "points_reward": 20,
            "is_secret": True,
            "requirements": {"type": "time", "value": "early_morning"}
        },
        {
            "badge_key": "night_owl",
            "name": "올빼미",
            "description": "자정 이후에 학습했습니다!",
            "icon_emoji": "🦉",
            "badge_type": BadgeType.SPECIAL,
            "category": BadgeCategory.SPECIAL_EVENT,
            "xp_reward": 100,
            "points_reward": 20,
            "is_secret": True,
            "requirements": {"type": "time", "value": "late_night"}
        },

        # 🎖️ Study Hours Badges
        {
            "badge_key": "study_10h",
            "name": "10시간 학습",
            "description": "총 10시간을 학습했습니다!",
            "icon_emoji": "📚",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 200,
            "points_reward": 40,
            "requirements": {"type": "study_hours", "value": 10}
        },
        {
            "badge_key": "study_50h",
            "name": "50시간 학습",
            "description": "총 50시간을 학습했습니다!",
            "icon_emoji": "📚📚",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "study_hours", "value": 50}
        },
        {
            "badge_key": "study_100h",
            "name": "100시간 학습",
            "description": "총 100시간을 학습했습니다!",
            "icon_emoji": "📖",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.LEARNING,
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "study_hours", "value": 100}
        },
    ]

    for badge_data in badges:
        badge = BadgeDefinition(**badge_data)
        db.add(badge)

    await db.commit()
    print(f"✅ Created {len(badges)} badges")


async def seed_daily_quests(db: AsyncSession):
    """Create daily quest definitions"""
    quests = [
        {
            "quest_key": "daily_video",
            "title": "동영상 1개 시청하기",
            "description": "오늘 동영상 강의를 1개 이상 시청하세요",
            "icon_emoji": "🎬",
            "activity_type": "video_complete",
            "target_count": 1,
            "xp_reward": 50,
            "points_reward": 10,
            "difficulty": 1
        },
        {
            "quest_key": "daily_quiz",
            "title": "퀴즈 1개 완료하기",
            "description": "오늘 퀴즈를 1개 이상 완료하세요",
            "icon_emoji": "📝",
            "activity_type": "quiz_complete",
            "target_count": 1,
            "xp_reward": 50,
            "points_reward": 10,
            "difficulty": 1
        },
        {
            "quest_key": "daily_forum",
            "title": "포럼 활동하기",
            "description": "포럼에 글 또는 댓글을 작성하세요",
            "icon_emoji": "💬",
            "activity_type": "forum_post",
            "target_count": 1,
            "xp_reward": 30,
            "points_reward": 5,
            "difficulty": 1
        },
        {
            "quest_key": "daily_code",
            "title": "코드 실행하기",
            "description": "코딩 플레이그라운드에서 코드를 3번 실행하세요",
            "icon_emoji": "💻",
            "activity_type": "code_execute",
            "target_count": 3,
            "xp_reward": 40,
            "points_reward": 8,
            "difficulty": 2
        },
        {
            "quest_key": "daily_study_2h",
            "title": "2시간 학습하기",
            "description": "오늘 2시간 이상 학습하세요",
            "icon_emoji": "⏰",
            "activity_type": "study_time",
            "target_count": 120,  # minutes
            "xp_reward": 100,
            "points_reward": 20,
            "difficulty": 3
        },
    ]

    for quest_data in quests:
        quest = DailyQuestDefinition(**quest_data)
        db.add(quest)

    await db.commit()
    print(f"✅ Created {len(quests)} daily quests")


async def main():
    """Main seeding function"""
    print("🌱 Seeding gamification data...")

    async with AsyncSessionLocal() as db:
        await seed_badges(db)
        await seed_daily_quests(db)

    print("✅ Gamification data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(main())

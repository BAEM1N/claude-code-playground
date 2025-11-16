"""
Enhanced Gamification Seed Script
게이미피케이션 강화 데이터 생성 - 배지 컬렉션, 시리즈, 시즌별 배지 포함
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.gamification import (
    BadgeDefinition,
    BadgeType,
    BadgeCategory,
    DailyQuestDefinition,
    Team
)


async def seed_badge_collections(db: AsyncSession):
    """Create badge collections with progressive tiers"""

    badge_collections = []

    # ==================== Collection: Python Master Series ====================
    python_master = [
        {
            "badge_key": "python_beginner",
            "name": "Python 입문자",
            "description": "Python 기초 모듈을 완료했습니다!",
            "icon_emoji": "🐍",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.SKILL,
            "collection_key": "python_master",
            "collection_name": "Python 마스터",
            "series_order": 0,
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "level", "value": 5}
        },
        {
            "badge_key": "python_intermediate",
            "name": "Python 숙련자",
            "description": "Python 중급 수준에 도달했습니다!",
            "icon_emoji": "🐍✨",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.SKILL,
            "collection_key": "python_master",
            "collection_name": "Python 마스터",
            "series_order": 1,
            "prerequisite_badge_keys": ["python_beginner"],
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "level", "value": 15}
        },
        {
            "badge_key": "python_expert",
            "name": "Python 전문가",
            "description": "Python 고급 수준! 대단합니다!",
            "icon_emoji": "🐍💎",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.SKILL,
            "collection_key": "python_master",
            "collection_name": "Python 마스터",
            "series_order": 2,
            "prerequisite_badge_keys": ["python_beginner", "python_intermediate"],
            "xp_reward": 2000,
            "points_reward": 400,
            "requirements": {"type": "level", "value": 30}
        },
        {
            "badge_key": "python_grandmaster",
            "name": "Python 그랜드마스터",
            "description": "Python의 진정한 마스터입니다!",
            "icon_emoji": "🐍👑",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.SKILL,
            "collection_key": "python_master",
            "collection_name": "Python 마스터",
            "series_order": 3,
            "prerequisite_badge_keys": ["python_beginner", "python_intermediate", "python_expert"],
            "xp_reward": 5000,
            "points_reward": 1000,
            "requirements": {"type": "level", "value": 50}
        }
    ]
    badge_collections.extend(python_master)

    # ==================== Collection: Data Science Warrior ====================
    data_science = [
        {
            "badge_key": "data_novice",
            "name": "데이터 새내기",
            "description": "데이터 사이언스 여정을 시작했습니다!",
            "icon_emoji": "📊",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.SKILL,
            "collection_key": "data_science_warrior",
            "collection_name": "데이터 사이언스 전사",
            "series_order": 0,
            "xp_reward": 300,
            "points_reward": 60,
            "requirements": {"type": "activity", "value": "notebook_complete", "count": 5}
        },
        {
            "badge_key": "data_analyst",
            "name": "데이터 분석가",
            "description": "데이터 분석 능력을 입증했습니다!",
            "icon_emoji": "📈",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.SKILL,
            "collection_key": "data_science_warrior",
            "collection_name": "데이터 사이언스 전사",
            "series_order": 1,
            "prerequisite_badge_keys": ["data_novice"],
            "xp_reward": 800,
            "points_reward": 160,
            "requirements": {"type": "activity", "value": "notebook_complete", "count": 20}
        },
        {
            "badge_key": "data_scientist",
            "name": "데이터 사이언티스트",
            "description": "데이터 사이언스를 마스터했습니다!",
            "icon_emoji": "🔬",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.SKILL,
            "collection_key": "data_science_warrior",
            "collection_name": "데이터 사이언스 전사",
            "series_order": 2,
            "prerequisite_badge_keys": ["data_novice", "data_analyst"],
            "xp_reward": 2000,
            "points_reward": 400,
            "requirements": {"type": "activity", "value": "notebook_complete", "count": 50}
        },
        {
            "badge_key": "ml_champion",
            "name": "머신러닝 챔피언",
            "description": "머신러닝의 진정한 챔피언!",
            "icon_emoji": "🤖",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.SKILL,
            "collection_key": "data_science_warrior",
            "collection_name": "데이터 사이언스 전사",
            "series_order": 3,
            "prerequisite_badge_keys": ["data_novice", "data_analyst", "data_scientist"],
            "xp_reward": 5000,
            "points_reward": 1000,
            "requirements": {"type": "activity", "value": "notebook_complete", "count": 100}
        }
    ]
    badge_collections.extend(data_science)

    # ==================== Collection: Streak Warrior ====================
    streak_warrior = [
        {
            "badge_key": "streak_starter",
            "name": "스트릭 시작",
            "description": "3일 연속 학습을 시작했습니다!",
            "icon_emoji": "🔥",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.STREAK,
            "collection_key": "streak_warrior",
            "collection_name": "스트릭 전사",
            "series_order": 0,
            "xp_reward": 100,
            "points_reward": 20,
            "requirements": {"type": "streak", "value": 3}
        },
        {
            "badge_key": "streak_committed",
            "name": "스트릭 헌신자",
            "description": "7일 연속 학습! 훌륭합니다!",
            "icon_emoji": "🔥🔥",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.STREAK,
            "collection_key": "streak_warrior",
            "collection_name": "스트릭 전사",
            "series_order": 1,
            "prerequisite_badge_keys": ["streak_starter"],
            "xp_reward": 300,
            "points_reward": 60,
            "requirements": {"type": "streak", "value": 7}
        },
        {
            "badge_key": "streak_dedicated",
            "name": "스트릭 헌신가",
            "description": "30일 연속 학습! 대단합니다!",
            "icon_emoji": "🔥🔥🔥",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.STREAK,
            "collection_key": "streak_warrior",
            "collection_name": "스트릭 전사",
            "series_order": 2,
            "prerequisite_badge_keys": ["streak_starter", "streak_committed"],
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "streak", "value": 30}
        },
        {
            "badge_key": "streak_legend",
            "name": "스트릭 전설",
            "description": "100일 연속 학습! 당신은 전설입니다!",
            "icon_emoji": "🔥👑",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.STREAK,
            "collection_key": "streak_warrior",
            "collection_name": "스트릭 전사",
            "series_order": 3,
            "prerequisite_badge_keys": ["streak_starter", "streak_committed", "streak_dedicated"],
            "xp_reward": 10000,
            "points_reward": 2000,
            "requirements": {"type": "longest_streak", "value": 100}
        }
    ]
    badge_collections.extend(streak_warrior)

    # ==================== Collection: Level Master ====================
    level_master = [
        {
            "badge_key": "level_10",
            "name": "레벨 10 달성",
            "description": "레벨 10에 도달했습니다!",
            "icon_emoji": "⭐",
            "badge_type": BadgeType.BRONZE,
            "category": BadgeCategory.ACHIEVEMENT,
            "collection_key": "level_master",
            "collection_name": "레벨 마스터",
            "series_order": 0,
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "level", "value": 10}
        },
        {
            "badge_key": "level_25",
            "name": "레벨 25 달성",
            "description": "레벨 25에 도달했습니다!",
            "icon_emoji": "⭐⭐",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.ACHIEVEMENT,
            "collection_key": "level_master",
            "collection_name": "레벨 마스터",
            "series_order": 1,
            "xp_reward": 1500,
            "points_reward": 300,
            "requirements": {"type": "level", "value": 25}
        },
        {
            "badge_key": "level_50",
            "name": "레벨 50 달성",
            "description": "레벨 50! 믿을 수 없습니다!",
            "icon_emoji": "⭐⭐⭐",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.ACHIEVEMENT,
            "collection_key": "level_master",
            "collection_name": "레벨 마스터",
            "series_order": 2,
            "xp_reward": 5000,
            "points_reward": 1000,
            "requirements": {"type": "level", "value": 50}
        },
        {
            "badge_key": "level_100",
            "name": "레벨 100 달성",
            "description": "레벨 100! 당신은 전설입니다!",
            "icon_emoji": "💎",
            "badge_type": BadgeType.PLATINUM,
            "category": BadgeCategory.ACHIEVEMENT,
            "collection_key": "level_master",
            "collection_name": "레벨 마스터",
            "series_order": 3,
            "xp_reward": 20000,
            "points_reward": 5000,
            "requirements": {"type": "level", "value": 100}
        }
    ]
    badge_collections.extend(level_master)

    # ==================== Special Event Badges ====================
    special_badges = [
        {
            "badge_key": "early_adopter",
            "name": "얼리 어답터",
            "description": "플랫폼 초기 사용자입니다!",
            "icon_emoji": "🚀",
            "badge_type": BadgeType.SPECIAL,
            "category": BadgeCategory.SPECIAL_EVENT,
            "xp_reward": 1000,
            "points_reward": 500,
            "is_limited": True,
            "max_earners": 100,
            "requirements": {"type": "activities", "value": 1}
        },
        {
            "badge_key": "team_player",
            "name": "팀 플레이어",
            "description": "팀에 가입하고 협력했습니다!",
            "icon_emoji": "👥",
            "badge_type": BadgeType.SILVER,
            "category": BadgeCategory.SOCIAL,
            "xp_reward": 300,
            "points_reward": 60,
            "requirements": {"type": "activities", "value": 10}
        },
        {
            "badge_key": "badge_collector",
            "name": "배지 수집가",
            "description": "10개 이상의 배지를 획득했습니다!",
            "icon_emoji": "🏆",
            "badge_type": BadgeType.GOLD,
            "category": BadgeCategory.ACHIEVEMENT,
            "xp_reward": 1000,
            "points_reward": 200,
            "requirements": {"type": "badges", "value": 10}
        },
        {
            "badge_key": "winter_2025",
            "name": "2025 겨울 시즌",
            "description": "2025년 겨울 시즌에 참여했습니다!",
            "icon_emoji": "❄️",
            "badge_type": BadgeType.SPECIAL,
            "category": BadgeCategory.SPECIAL_EVENT,
            "is_seasonal": True,
            "season_start": datetime(2025, 12, 1),
            "season_end": datetime(2026, 2, 28),
            "xp_reward": 500,
            "points_reward": 100,
            "requirements": {"type": "activities", "value": 5}
        }
    ]
    badge_collections.extend(special_badges)

    # Create all badges
    print(f"Creating {len(badge_collections)} badges...")
    for badge_data in badge_collections:
        badge = BadgeDefinition(**badge_data)
        db.add(badge)

    await db.commit()
    print(f"✅ Created {len(badge_collections)} badges in collections!")


async def seed_daily_quests(db: AsyncSession):
    """Create daily quests"""
    quests = [
        {
            "quest_key": "daily_video",
            "title": "일일 동영상",
            "description": "오늘 동영상 1개 시청하기",
            "icon_emoji": "🎬",
            "activity_type": "video_complete",
            "target_count": 1,
            "xp_reward": 50,
            "points_reward": 10,
            "is_daily": True,
            "difficulty": 1
        },
        {
            "quest_key": "daily_practice",
            "title": "일일 연습",
            "description": "오늘 노트북 1개 완료하기",
            "icon_emoji": "💻",
            "activity_type": "notebook_complete",
            "target_count": 1,
            "xp_reward": 100,
            "points_reward": 20,
            "is_daily": True,
            "difficulty": 2
        },
        {
            "quest_key": "daily_quiz",
            "title": "일일 퀴즈",
            "description": "오늘 퀴즈 1개 완료하기",
            "icon_emoji": "📝",
            "activity_type": "quiz_complete",
            "target_count": 1,
            "xp_reward": 75,
            "points_reward": 15,
            "is_daily": True,
            "difficulty": 1
        },
        {
            "quest_key": "weekly_master",
            "title": "주간 마스터",
            "description": "이번 주에 과제 3개 제출하기",
            "icon_emoji": "🏆",
            "activity_type": "assignment_submit",
            "target_count": 3,
            "xp_reward": 300,
            "points_reward": 60,
            "is_daily": False,
            "difficulty": 3
        },
        {
            "quest_key": "weekly_learner",
            "title": "주간 학습자",
            "description": "이번 주에 10개 토픽 완료하기",
            "icon_emoji": "📚",
            "activity_type": "topic_complete",
            "target_count": 10,
            "xp_reward": 500,
            "points_reward": 100,
            "is_daily": False,
            "difficulty": 3
        }
    ]

    print(f"Creating {len(quests)} daily/weekly quests...")
    for quest_data in quests:
        quest = DailyQuestDefinition(**quest_data)
        db.add(quest)

    await db.commit()
    print(f"✅ Created {len(quests)} quests!")


async def seed_sample_teams(db: AsyncSession):
    """Create sample teams"""
    teams = [
        {
            "name": "Python Ninjas",
            "description": "Python 마스터들의 모임",
            "tag": "PY",
            "icon_emoji": "🐍",
            "banner_color": "#3776ab",
            "is_public": True,
            "max_members": 50
        },
        {
            "name": "Data Science Guild",
            "description": "데이터 사이언스를 함께 배우는 길드",
            "tag": "DS",
            "icon_emoji": "📊",
            "banner_color": "#ff6b6b",
            "is_public": True,
            "max_members": 100
        },
        {
            "name": "ML Warriors",
            "description": "머신러닝 전사들",
            "tag": "ML",
            "icon_emoji": "🤖",
            "banner_color": "#4ecdc4",
            "is_public": True,
            "max_members": 75
        },
        {
            "name": "Code Masters",
            "description": "코딩 마스터 클럽",
            "tag": "CODE",
            "icon_emoji": "💻",
            "banner_color": "#95e1d3",
            "is_public": True,
            "max_members": 50
        }
    ]

    print(f"Creating {len(teams)} sample teams...")
    for team_data in teams:
        team = Team(**team_data)
        db.add(team)

    await db.commit()
    print(f"✅ Created {len(teams)} teams!")


async def main():
    """Main seed function"""
    print("🎮 Starting enhanced gamification data seeding...")

    async with AsyncSessionLocal() as db:
        try:
            await seed_badge_collections(db)
            await seed_daily_quests(db)
            await seed_sample_teams(db)

            print("\n✅ All enhanced gamification data created successfully!")
            print("\n📊 Summary:")
            print("  - Badge Collections: Python Master, Data Science Warrior, Streak Warrior, Level Master")
            print("  - Special Event Badges: Early Adopter, Winter 2025, etc.")
            print("  - Daily/Weekly Quests: 5 quests")
            print("  - Sample Teams: 4 teams")

        except Exception as e:
            print(f"\n❌ Error: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())

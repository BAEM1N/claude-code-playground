"""
Gamification System Models
전역 게이미피케이션 시스템 - 모든 학습 활동을 통합한 XP, 레벨, 배지 시스템
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from ..db.base import Base


class BadgeType(str, enum.Enum):
    """배지 타입"""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    SPECIAL = "special"


class BadgeCategory(str, enum.Enum):
    """배지 카테고리"""
    LEARNING = "learning"  # 학습 관련
    SOCIAL = "social"  # 소셜 활동
    ACHIEVEMENT = "achievement"  # 업적
    STREAK = "streak"  # 연속 활동
    SKILL = "skill"  # 스킬 숙련도
    COMPETITION = "competition"  # 대회
    SPECIAL_EVENT = "special_event"  # 특별 이벤트


class XPActivityType(str, enum.Enum):
    """XP 획득 활동 타입"""
    # 학습 활동
    VIDEO_COMPLETE = "video_complete"
    MARKDOWN_COMPLETE = "markdown_complete"
    NOTEBOOK_COMPLETE = "notebook_complete"
    ASSIGNMENT_SUBMIT = "assignment_submit"
    QUIZ_COMPLETE = "quiz_complete"
    QUIZ_PERFECT = "quiz_perfect"

    # 출석
    DAILY_LOGIN = "daily_login"
    ATTENDANCE_MARK = "attendance_mark"

    # 소셜 활동
    MESSAGE_POST = "message_post"
    FORUM_POST = "forum_post"
    FORUM_REPLY = "forum_reply"
    HELPFUL_ANSWER = "helpful_answer"

    # 코딩
    CODE_EXECUTE = "code_execute"
    CODE_SHARE = "code_share"

    # 대회
    COMPETITION_JOIN = "competition_join"
    COMPETITION_WIN = "competition_win"

    # 기타
    PROFILE_COMPLETE = "profile_complete"
    FIRST_COURSE_ENROLL = "first_course_enroll"
    BADGE_EARNED = "badge_earned"
    LEVEL_UP = "level_up"


class UserGameProfile(Base):
    """
    사용자 전역 게임 프로필
    모든 강의/활동을 통합한 게이미피케이션 데이터
    """
    __tablename__ = "user_game_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, unique=True)

    # XP & Level
    total_xp = Column(Integer, default=0, nullable=False)  # 총 획득 XP (누적)
    current_xp = Column(Integer, default=0, nullable=False)  # 현재 레벨의 XP
    level = Column(Integer, default=1, nullable=False)  # 현재 레벨
    xp_to_next_level = Column(Integer, default=100, nullable=False)  # 다음 레벨까지 필요한 XP

    # Points & Rank
    total_points = Column(Integer, default=0, nullable=False)  # 총 포인트 (순위용)
    global_rank = Column(Integer)  # 전역 순위
    weekly_points = Column(Integer, default=0, nullable=False)  # 주간 포인트
    monthly_points = Column(Integer, default=0, nullable=False)  # 월간 포인트

    # Streaks
    current_streak = Column(Integer, default=0, nullable=False)  # 현재 연속 학습 일수
    longest_streak = Column(Integer, default=0, nullable=False)  # 최장 연속 학습 일수
    last_activity_date = Column(DateTime)  # 마지막 활동 날짜
    streak_freeze_count = Column(Integer, default=0)  # 스트릭 보호권 (나중에 구현)

    # Statistics
    total_badges = Column(Integer, default=0, nullable=False)  # 총 획득 배지 수
    total_activities = Column(Integer, default=0, nullable=False)  # 총 활동 수
    total_study_hours = Column(Float, default=0.0, nullable=False)  # 총 학습 시간 (시간)

    # Display preferences
    display_rank = Column(Boolean, default=True)  # 순위 공개 여부
    display_badges = Column(Boolean, default=True)  # 배지 공개 여부

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("UserProfile", foreign_keys=[user_id], backref="game_profile")
    badges = relationship("UserBadge", back_populates="user_profile", cascade="all, delete-orphan")
    xp_transactions = relationship("XPTransaction", back_populates="user_profile", cascade="all, delete-orphan")
    daily_quests = relationship("UserDailyQuest", back_populates="user_profile", cascade="all, delete-orphan")

    def add_xp(self, amount: int) -> dict:
        """
        XP 추가 및 레벨업 처리
        Returns: {"leveled_up": bool, "new_level": int, "xp_gained": int}
        """
        self.total_xp += amount
        self.current_xp += amount

        leveled_up = False
        levels_gained = 0

        # 레벨업 체크 (여러 레벨 동시 가능)
        while self.current_xp >= self.xp_to_next_level:
            self.current_xp -= self.xp_to_next_level
            self.level += 1
            levels_gained += 1
            leveled_up = True
            # 레벨업에 필요한 XP는 지수적으로 증가
            self.xp_to_next_level = self._calculate_xp_for_next_level()

        return {
            "leveled_up": leveled_up,
            "levels_gained": levels_gained,
            "new_level": self.level,
            "xp_gained": amount,
            "current_xp": self.current_xp,
            "xp_to_next_level": self.xp_to_next_level
        }

    def _calculate_xp_for_next_level(self) -> int:
        """다음 레벨에 필요한 XP 계산"""
        # 공식: 100 * (level ^ 1.5)
        # Level 1→2: 100 XP
        # Level 2→3: 282 XP
        # Level 5→6: 1118 XP
        # Level 10→11: 3162 XP
        return int(100 * (self.level ** 1.5))

    def update_streak(self, activity_date: datetime) -> dict:
        """
        스트릭 업데이트
        Returns: {"streak_maintained": bool, "current_streak": int, "streak_broken": bool}
        """
        today = activity_date.date()

        if not self.last_activity_date:
            # 첫 활동
            self.current_streak = 1
            self.longest_streak = 1
            self.last_activity_date = activity_date
            return {"streak_maintained": True, "current_streak": 1, "streak_broken": False}

        last_date = self.last_activity_date.date()
        days_diff = (today - last_date).days

        if days_diff == 0:
            # 같은 날 활동
            return {"streak_maintained": True, "current_streak": self.current_streak, "streak_broken": False}
        elif days_diff == 1:
            # 연속 활동
            self.current_streak += 1
            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak
            self.last_activity_date = activity_date
            return {"streak_maintained": True, "current_streak": self.current_streak, "streak_broken": False}
        else:
            # 스트릭 끊김
            old_streak = self.current_streak
            self.current_streak = 1
            self.last_activity_date = activity_date
            return {"streak_maintained": False, "current_streak": 1, "streak_broken": True, "lost_streak": old_streak}


class BadgeDefinition(Base):
    """
    배지 정의 (템플릿)
    시스템에서 획득 가능한 모든 배지의 정의
    """
    __tablename__ = "badge_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Badge info
    badge_key = Column(String(100), nullable=False, unique=True)  # 고유 키 (예: "first_assignment", "streak_7_days")
    name = Column(String(200), nullable=False)  # 배지 이름
    description = Column(Text, nullable=False)  # 배지 설명
    icon_url = Column(String(500))  # 아이콘 이미지 URL
    icon_emoji = Column(String(10))  # 대체 이모지 (🏆, 🎯, ⭐ 등)

    # Classification
    badge_type = Column(SQLEnum(BadgeType), default=BadgeType.BRONZE, nullable=False)
    category = Column(SQLEnum(BadgeCategory), default=BadgeCategory.LEARNING, nullable=False)

    # Requirements (JSON으로 유연하게 저장)
    requirements = Column(JSON)  # {"type": "streak", "value": 7} 등

    # Rewards
    xp_reward = Column(Integer, default=0, nullable=False)  # XP 보상
    points_reward = Column(Integer, default=0, nullable=False)  # 포인트 보상

    # Display
    order = Column(Integer, default=0)  # 정렬 순서
    is_secret = Column(Boolean, default=False)  # 숨겨진 배지 (획득 전까지 표시 안됨)
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    """
    사용자가 획득한 배지
    """
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_game_profiles.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badge_definitions.id", ondelete="CASCADE"), nullable=False)

    # Achievement details
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    points_earned = Column(Integer, default=0, nullable=False)

    # Display
    is_favorited = Column(Boolean, default=False)  # 즐겨찾기 (프로필에 표시)
    is_notified = Column(Boolean, default=False)  # 알림 확인 여부

    # Metadata
    progress_data = Column(JSON)  # 획득 당시의 진행도 데이터 (예: {"streak": 7})

    # Relationships
    user_profile = relationship("UserGameProfile", back_populates="badges")
    badge = relationship("BadgeDefinition", back_populates="user_badges")


class XPTransaction(Base):
    """
    XP 획득/소비 내역 (로그)
    """
    __tablename__ = "xp_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_game_profiles.id", ondelete="CASCADE"), nullable=False)

    # Transaction details
    activity_type = Column(SQLEnum(XPActivityType), nullable=False)
    xp_amount = Column(Integer, nullable=False)  # 양수: 획득, 음수: 소비
    points_amount = Column(Integer, default=0, nullable=False)

    # Activity context
    description = Column(Text)  # 활동 설명
    related_entity_type = Column(String(50))  # "assignment", "quiz", "topic" 등
    related_entity_id = Column(UUID(as_uuid=True))  # 관련 엔티티 ID

    # Level context
    level_before = Column(Integer, nullable=False)
    level_after = Column(Integer, nullable=False)
    leveled_up = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user_profile = relationship("UserGameProfile", back_populates="xp_transactions")


class DailyQuestDefinition(Base):
    """
    일일 미션 정의
    """
    __tablename__ = "daily_quest_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Quest info
    quest_key = Column(String(100), nullable=False, unique=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    icon_emoji = Column(String(10))

    # Requirements
    activity_type = Column(String(50), nullable=False)  # "complete_video", "submit_assignment" 등
    target_count = Column(Integer, default=1, nullable=False)  # 목표 횟수

    # Rewards
    xp_reward = Column(Integer, default=50, nullable=False)
    points_reward = Column(Integer, default=10, nullable=False)

    # Scheduling
    is_daily = Column(Boolean, default=True)  # True: 매일, False: 주간
    difficulty = Column(Integer, default=1)  # 1: 쉬움, 2: 보통, 3: 어려움

    # Display
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserDailyQuest(Base):
    """
    사용자의 일일 미션 진행도
    """
    __tablename__ = "user_daily_quests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_game_profiles.id", ondelete="CASCADE"), nullable=False)
    quest_definition_id = Column(UUID(as_uuid=True), ForeignKey("daily_quest_definitions.id", ondelete="CASCADE"), nullable=False)

    # Progress
    current_count = Column(Integer, default=0, nullable=False)
    target_count = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)

    # Rewards
    xp_earned = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)

    # Timing
    quest_date = Column(DateTime, nullable=False, index=True)  # 미션 할당 날짜
    completed_at = Column(DateTime)

    # Relationships
    user_profile = relationship("UserGameProfile", back_populates="daily_quests")
    quest_definition = relationship("DailyQuestDefinition")


class Leaderboard(Base):
    """
    리더보드 스냅샷
    주간/월간 순위를 기록 (성능 최적화용)
    """
    __tablename__ = "leaderboards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)

    # Leaderboard type
    period_type = Column(String(20), nullable=False)  # "daily", "weekly", "monthly", "all_time"
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    # Ranking
    rank = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    xp_gained = Column(Integer, default=0)

    # Stats
    activities_count = Column(Integer, default=0)
    badges_earned = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("UserProfile", foreign_keys=[user_id])

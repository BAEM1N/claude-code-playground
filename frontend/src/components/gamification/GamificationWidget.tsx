/**
 * Gamification Widget Component
 * 대시보드에 표시할 게이미피케이션 요약 위젯
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gamificationAPI } from '../../services/api';
import XPBar from './XPBar';
import StreakCard from './StreakCard';

const GamificationWidget: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data } = await gamificationAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load gamification stats:', err);
      setError('게이미피케이션 데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">🎮 게이미피케이션</h2>
        <Link
          to="/gamification"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          전체 보기 →
        </Link>
      </div>

      {/* XP Bar */}
      <XPBar
        level={stats.level}
        currentXP={stats.current_xp}
        xpToNextLevel={stats.xp_to_next_level}
        totalXP={stats.total_xp}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow">
          <p className="text-sm opacity-90 mb-1">총 포인트</p>
          <p className="text-2xl font-bold">{stats.total_points.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow">
          <p className="text-sm opacity-90 mb-1">획득 배지</p>
          <p className="text-2xl font-bold">{stats.total_badges}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow">
          <p className="text-sm opacity-90 mb-1">학습 시간</p>
          <p className="text-2xl font-bold">{Math.floor(stats.total_study_hours)}h</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow">
          <p className="text-sm opacity-90 mb-1">순위</p>
          <p className="text-2xl font-bold">
            {stats.global_rank ? `#${stats.global_rank}` : '-'}
          </p>
        </div>
      </div>

      {/* Streak Card */}
      <StreakCard
        currentStreak={stats.current_streak}
        longestStreak={stats.longest_streak}
      />

      {/* Recent Activities */}
      {stats.recent_activities && stats.recent_activities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">최근 활동</h3>
          <div className="space-y-2">
            {stats.recent_activities.slice(0, 5).map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-indigo-600">
                    +{activity.xp_earned} XP
                  </p>
                  {activity.leveled_up && (
                    <p className="text-xs text-green-600 font-medium">
                      ⬆️ Level {activity.new_level}!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/gamification/badges"
          className="bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-lg p-4 text-center transition-all group"
        >
          <div className="text-3xl mb-2">🏅</div>
          <p className="font-medium text-gray-900 group-hover:text-indigo-600">내 배지</p>
        </Link>
        <Link
          to="/gamification/leaderboard"
          className="bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-lg p-4 text-center transition-all group"
        >
          <div className="text-3xl mb-2">🏆</div>
          <p className="font-medium text-gray-900 group-hover:text-indigo-600">리더보드</p>
        </Link>
      </div>
    </div>
  );
};

export default GamificationWidget;

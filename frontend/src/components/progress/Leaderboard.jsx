import React, { useState, useEffect } from 'react';
import { progressAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const Leaderboard = ({ courseId, limit = 10 }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getLeaderboard(courseId, limit);
      setLeaderboard(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || '리더보드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getLevelBadgeColor = (level) => {
    if (level >= 50) return 'bg-purple-500 text-white';
    if (level >= 30) return 'bg-blue-500 text-white';
    if (level >= 20) return 'bg-green-500 text-white';
    if (level >= 10) return 'bg-yellow-500 text-white';
    return 'bg-gray-400 text-white';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        리더보드 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <span>🏆</span>
          <span>리더보드</span>
          <span>🏆</span>
        </h2>
        <p className="text-center text-purple-100 mt-2">
          상위 {limit}명의 학습자
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={entry.user_id || index}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                isTopThree ? 'bg-gradient-to-r from-yellow-50 to-white' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg ${getRankColor(
                    rank
                  )}`}
                >
                  {getRankIcon(rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {entry.user_name || 'Unknown User'}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getLevelBadgeColor(
                        entry.level
                      )}`}
                    >
                      Lv.{entry.level}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600">⭐</span>
                      <span className="font-semibold">{entry.total_points}</span>
                      <span className="text-xs">pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-600">🎯</span>
                      <span className="font-semibold">{entry.experience_points}</span>
                      <span className="text-xs">XP</span>
                    </div>
                    {entry.current_streak_days > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-600">🔥</span>
                        <span className="font-semibold">{entry.current_streak_days}</span>
                        <span className="text-xs">일</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Stats */}
                  {entry.average_grade !== undefined && (
                    <div className="mt-1 text-xs text-gray-500">
                      평균 성적: {entry.average_grade.toFixed(1)}점 | 출석률:{' '}
                      {entry.attendance_rate?.toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Rank Change Indicator (if available) */}
                {entry.rank_change !== undefined && entry.rank_change !== 0 && (
                  <div className="flex-shrink-0">
                    {entry.rank_change > 0 ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <span>↑</span>
                        <span>{entry.rank_change}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                        <span>↓</span>
                        <span>{Math.abs(entry.rank_change)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Top 3 Special Badge */}
              {isTopThree && (
                <div className="mt-2 text-xs text-center">
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-semibold">
                    {rank === 1 && '🎊 챔피언 🎊'}
                    {rank === 2 && '⭐ 우수 학습자 ⭐'}
                    {rank === 3 && '🌟 우수 학습자 🌟'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
        <p>💪 계속 학습하여 순위를 올려보세요!</p>
      </div>
    </div>
  );
};

export default Leaderboard;

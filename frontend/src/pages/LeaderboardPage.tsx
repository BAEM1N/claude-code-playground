/**
 * Leaderboard Page
 * 전체 사용자 순위를 표시하는 리더보드 페이지
 */
import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  points: number;
  xp_gained: number;
  activities_count: number;
  badges_earned: number;
  level?: number;
}

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('weekly');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await gamificationAPI.getLeaderboard({ period });
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-100 to-gray-200';
    }
  };

  const periods = [
    { key: 'daily', label: '오늘' },
    { key: 'weekly', label: '이번 주' },
    { key: 'monthly', label: '이번 달' },
    { key: 'all_time', label: '전체' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">리더보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 리더보드</h1>
          <p className="text-gray-600">가장 열심히 학습한 사용자들의 순위입니다</p>
        </div>

        {/* Period Filter */}
        <div className="mb-6 flex justify-center gap-2">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                period === p.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {leaderboard && leaderboard.entries.length > 0 ? (
          <>
            {/* Top 3 Podium */}
            {leaderboard.entries.length >= 3 && (
              <div className="mb-8 flex items-end justify-center gap-4">
                {/* 2nd Place */}
                {leaderboard.entries[1] && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`bg-gradient-to-br ${getRankColor(
                        2
                      )} rounded-lg shadow-lg p-6 text-center w-40 mb-2`}
                    >
                      <div className="text-4xl mb-2">🥈</div>
                      <div className="w-16 h-16 rounded-full bg-white mx-auto mb-2 flex items-center justify-center">
                        {leaderboard.entries[1].avatar_url ? (
                          <img
                            src={leaderboard.entries[1].avatar_url}
                            alt={leaderboard.entries[1].username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 truncate">
                        {leaderboard.entries[1].username}
                      </p>
                      <p className="text-sm text-gray-700 font-semibold">
                        {leaderboard.entries[1].points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="bg-gray-300 w-40 h-24 rounded-t-lg"></div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard.entries[0] && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`bg-gradient-to-br ${getRankColor(
                        1
                      )} rounded-lg shadow-xl p-6 text-center w-44 mb-2 border-4 border-yellow-500`}
                    >
                      <div className="text-5xl mb-2">👑</div>
                      <div className="w-20 h-20 rounded-full bg-white mx-auto mb-2 flex items-center justify-center border-4 border-yellow-500">
                        {leaderboard.entries[0].avatar_url ? (
                          <img
                            src={leaderboard.entries[0].avatar_url}
                            alt={leaderboard.entries[0].username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">👤</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-lg truncate">
                        {leaderboard.entries[0].username}
                      </p>
                      <p className="text-base text-gray-700 font-semibold">
                        {leaderboard.entries[0].points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="bg-yellow-400 w-44 h-32 rounded-t-lg"></div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard.entries[2] && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`bg-gradient-to-br ${getRankColor(
                        3
                      )} rounded-lg shadow-lg p-6 text-center w-40 mb-2`}
                    >
                      <div className="text-4xl mb-2">🥉</div>
                      <div className="w-16 h-16 rounded-full bg-white mx-auto mb-2 flex items-center justify-center">
                        {leaderboard.entries[2].avatar_url ? (
                          <img
                            src={leaderboard.entries[2].avatar_url}
                            alt={leaderboard.entries[2].username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 truncate">
                        {leaderboard.entries[2].username}
                      </p>
                      <p className="text-sm text-gray-700 font-semibold">
                        {leaderboard.entries[2].points.toLocaleString()} P
                      </p>
                    </div>
                    <div className="bg-orange-400 w-40 h-20 rounded-t-lg"></div>
                  </div>
                )}
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        순위
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        레벨
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        포인트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        XP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        활동
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        배지
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.entries.map((entry: LeaderboardEntry) => (
                      <tr
                        key={entry.user_id}
                        className={`hover:bg-gray-50 transition-colors ${
                          entry.rank === leaderboard.user_rank ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getMedalEmoji(entry.rank) && (
                              <span className="text-2xl">{getMedalEmoji(entry.rank)}</span>
                            )}
                            <span className="text-lg font-semibold text-gray-900">
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {entry.avatar_url ? (
                                <img
                                  src={entry.avatar_url}
                                  alt={entry.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">👤</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{entry.username}</p>
                              {entry.rank === leaderboard.user_rank && (
                                <span className="text-xs text-indigo-600 font-medium">나</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                            Lv. {entry.level || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {entry.points.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {entry.xp_gained.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {entry.activities_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          🏅 {entry.badges_earned}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User's Rank (if not in top list) */}
            {leaderboard.user_rank && leaderboard.user_rank > leaderboard.entries.length && (
              <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <p className="text-center text-indigo-900">
                  <span className="font-semibold">내 순위:</span> #{leaderboard.user_rank} / {leaderboard.total_users}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">아직 데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;

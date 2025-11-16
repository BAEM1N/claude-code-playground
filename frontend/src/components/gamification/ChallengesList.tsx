/**
 * Challenges List Component
 * 주간/월간 챌린지 목록 및 진행 상황 표시
 */
import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../../services/api';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly';
  goal_type: 'xp' | 'problems_solved' | 'study_hours' | 'streak_days' | 'badges_earned';
  goal_value: number;
  current_progress: number;
  reward_xp: number;
  reward_badges?: string[];
  status: 'active' | 'completed' | 'expired';
  start_date: string;
  end_date: string;
  participants_count: number;
  is_joined: boolean;
  is_claimed: boolean;
}

const ChallengesList: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    loadChallenges();
  }, [filter, statusFilter]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') params.type = filter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await gamificationAPI.getChallenges(params);
      setChallenges(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load challenges:', err);
      setError('챌린지 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await gamificationAPI.joinChallenge(challengeId);
      await loadChallenges();
    } catch (err) {
      console.error('Failed to join challenge:', err);
      alert('챌린지 참여에 실패했습니다');
    }
  };

  const handleClaimReward = async (challengeId: string) => {
    try {
      await gamificationAPI.claimChallengeReward(challengeId);
      await loadChallenges();
      alert('보상을 받았습니다!');
    } catch (err) {
      console.error('Failed to claim reward:', err);
      alert('보상 수령에 실패했습니다');
    }
  };

  const getProgressPercentage = (challenge: Challenge) => {
    return Math.min((challenge.current_progress / challenge.goal_value) * 100, 100);
  };

  const getGoalTypeLabel = (goalType: string) => {
    switch (goalType) {
      case 'xp':
        return 'XP 획득';
      case 'problems_solved':
        return '문제 해결';
      case 'study_hours':
        return '학습 시간';
      case 'streak_days':
        return '연속 출석';
      case 'badges_earned':
        return '배지 획득';
      default:
        return goalType;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'weekly' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500';
  };

  const getTypeIcon = (type: string) => {
    return type === 'weekly' ? '📅' : '🗓️';
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">챌린지</h1>
        <p className="text-gray-600 mt-2">주간/월간 챌린지에 참여하고 보상을 받으세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 주간
            </button>
            <button
              onClick={() => setFilter('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🗓️ 월간
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              모두
            </button>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-600">현재 진행중인 챌린지가 없습니다</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const progress = getProgressPercentage(challenge);
            const daysRemaining = getDaysRemaining(challenge.end_date);
            const isCompleted = challenge.current_progress >= challenge.goal_value;

            return (
              <div
                key={challenge.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${getTypeColor(challenge.type)} p-4 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getTypeIcon(challenge.type)}</span>
                        <span className="text-sm font-medium opacity-90">
                          {challenge.type === 'weekly' ? '주간 챌린지' : '월간 챌린지'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{challenge.title}</h3>
                    </div>
                    {challenge.status === 'completed' && (
                      <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        완료
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 text-sm">{challenge.description}</p>

                  {/* Goal */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {getGoalTypeLabel(challenge.goal_type)}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {challenge.current_progress.toLocaleString()} / {challenge.goal_value.toLocaleString()}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getTypeColor(challenge.type)} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progress.toFixed(0)}% 완료</p>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">보상:</span>
                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                      ⭐ {challenge.reward_xp.toLocaleString()} XP
                    </div>
                    {challenge.reward_badges && challenge.reward_badges.length > 0 && (
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                        🏅 배지 {challenge.reward_badges.length}개
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                    <span>👥 {challenge.participants_count.toLocaleString()}명 참여 중</span>
                    {challenge.status === 'active' && (
                      <span className={daysRemaining <= 3 ? 'text-red-600 font-semibold' : ''}>
                        ⏰ {daysRemaining}일 남음
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {!challenge.is_joined ? (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className={`w-full bg-gradient-to-r ${getTypeColor(challenge.type)} text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity`}
                      >
                        챌린지 참여하기
                      </button>
                    ) : isCompleted && !challenge.is_claimed ? (
                      <button
                        onClick={() => handleClaimReward(challenge.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity animate-pulse"
                      >
                        🎁 보상 받기
                      </button>
                    ) : challenge.is_claimed ? (
                      <div className="w-full bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-lg text-center">
                        ✓ 보상 수령 완료
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-lg text-center">
                        참여 중 ({progress.toFixed(0)}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChallengesList;

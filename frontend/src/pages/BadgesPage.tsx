/**
 * Badges Page
 * 사용자가 획득한 배지와 획득 가능한 배지를 표시하는 페이지
 */
import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../services/api';

interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon_emoji?: string;
  icon_url?: string;
  badge_type: string;
  category: string;
  xp_reward: number;
  points_reward: number;
  is_secret: boolean;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  xp_earned: number;
  points_earned: number;
  is_favorited: boolean;
  badge: Badge;
}

const BadgesPage: React.FC = () => {
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const [myBadgesRes, allBadgesRes] = await Promise.all([
        gamificationAPI.getMyBadges(),
        gamificationAPI.getAllBadges(),
      ]);
      setMyBadges(myBadgesRes.data);
      setAllBadges(allBadgesRes.data);
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (badgeId: string, currentValue: boolean) => {
    try {
      await gamificationAPI.updateBadge(badgeId, { is_favorited: !currentValue });
      setMyBadges(prev =>
        prev.map(b => (b.id === badgeId ? { ...b, is_favorited: !currentValue } : b))
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'platinum':
        return 'from-cyan-400 to-blue-500';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      case 'bronze':
        return 'from-orange-400 to-orange-600';
      case 'special':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const categories = [
    { key: 'all', label: '전체', emoji: '🎯' },
    { key: 'learning', label: '학습', emoji: '📚' },
    { key: 'achievement', label: '업적', emoji: '🏆' },
    { key: 'streak', label: '스트릭', emoji: '🔥' },
    { key: 'social', label: '소셜', emoji: '👥' },
    { key: 'skill', label: '스킬', emoji: '💻' },
    { key: 'competition', label: '대회', emoji: '🎮' },
    { key: 'special_event', label: '특별', emoji: '⭐' },
  ];

  const earnedBadgeIds = new Set(myBadges.map(b => b.badge.id));
  const filteredBadges = allBadges.filter(
    badge =>
      (selectedCategory === 'all' || badge.category === selectedCategory) &&
      !earnedBadgeIds.has(badge.id)
  );

  const filteredMyBadges = myBadges.filter(
    badge => selectedCategory === 'all' || badge.badge.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">배지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏅 배지 컬렉션</h1>
          <p className="text-gray-600">
            획득한 배지: <span className="font-semibold text-indigo-600">{myBadges.length}</span> /{' '}
            {allBadges.length}
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* My Badges */}
        {filteredMyBadges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ 획득한 배지</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMyBadges.map(userBadge => (
                <div
                  key={userBadge.id}
                  className={`bg-gradient-to-br ${getBadgeTypeColor(
                    userBadge.badge.badge_type
                  )} rounded-lg shadow-lg p-6 text-white relative group hover:scale-105 transition-transform`}
                >
                  {/* Favorite Star */}
                  <button
                    onClick={() => handleToggleFavorite(userBadge.id, userBadge.is_favorited)}
                    className="absolute top-2 right-2 text-2xl hover:scale-125 transition-transform"
                  >
                    {userBadge.is_favorited ? '⭐' : '☆'}
                  </button>

                  <div className="text-center">
                    <div className="text-6xl mb-3">
                      {userBadge.badge.icon_emoji || '🏅'}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{userBadge.badge.name}</h3>
                    <p className="text-sm opacity-90 mb-3">{userBadge.badge.description}</p>

                    <div className="bg-white bg-opacity-20 rounded-lg p-2 mb-2">
                      <p className="text-xs opacity-75">획득일</p>
                      <p className="text-sm font-medium">
                        {new Date(userBadge.earned_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>+{userBadge.xp_earned} XP</span>
                      <span>+{userBadge.points_earned} P</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Badges */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 획득 가능한 배지</h2>
          {filteredBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBadges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-white border-2 border-gray-200 rounded-lg shadow p-6 relative opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-3 grayscale">
                      {badge.icon_emoji || '🏅'}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{badge.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>

                    <div className="bg-gray-100 rounded-lg p-2 mb-2">
                      <p className="text-xs text-gray-500">보상</p>
                      <p className="text-sm font-medium text-gray-700">
                        {badge.xp_reward} XP · {badge.points_reward} P
                      </p>
                    </div>

                    <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                      {badge.badge_type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">모든 배지를 획득했습니다! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgesPage;

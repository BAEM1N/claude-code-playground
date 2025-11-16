/**
 * Profile Customization Component
 * 사용자가 획득한 배지로 프로필을 꾸밀 수 있는 페이지
 */
import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../../services/api';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at: string;
  is_equipped: boolean;
}

interface Profile {
  user_id: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  equipped_badges: Badge[];
}

const ProfileCustomization: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myBadges, setMyBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    loadProfileAndBadges();
  }, []);

  const loadProfileAndBadges = async () => {
    try {
      setLoading(true);
      const [profileRes, badgesRes] = await Promise.all([
        gamificationAPI.getProfile(),
        gamificationAPI.getMyBadges(),
      ]);
      setProfile(profileRes.data);
      setMyBadges(badgesRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load profile and badges:', err);
      setError('프로필 데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipBadge = async (badge: Badge) => {
    if (!profile) return;

    try {
      // Check if max equipped badges reached (e.g., max 3)
      if (profile.equipped_badges.length >= 3 && !badge.is_equipped) {
        alert('최대 3개의 배지만 장착할 수 있습니다. 기존 배지를 해제하세요.');
        return;
      }

      await gamificationAPI.equipBadge(badge.id);
      await loadProfileAndBadges();
      setSelectedBadge(null);
    } catch (err) {
      console.error('Failed to equip badge:', err);
      alert('배지 장착에 실패했습니다');
    }
  };

  const handleUnequipBadge = async (badge: Badge) => {
    try {
      await gamificationAPI.unequipBadge(badge.id);
      await loadProfileAndBadges();
    } catch (err) {
      console.error('Failed to unequip badge:', err);
      alert('배지 해제에 실패했습니다');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400 shadow-yellow-400/50';
      case 'epic':
        return 'border-purple-400 shadow-purple-400/50';
      case 'rare':
        return 'border-blue-400 shadow-blue-400/50';
      default:
        return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">프로필 커스터마이징</h1>
        <p className="text-gray-600 mt-2">획득한 배지로 프로필을 꾸며보세요</p>
      </div>

      {/* Profile Preview */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                '👤'
              )}
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
              {profile.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{profile.username}</h2>
            <p className="text-white/90 mb-4">레벨 {profile.level} • {profile.total_xp.toLocaleString()} XP</p>

            {/* Equipped Badges */}
            <div className="space-y-2">
              <p className="text-sm text-white/80">장착 중인 배지 ({profile.equipped_badges.length}/3)</p>
              <div className="flex gap-3">
                {profile.equipped_badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative group bg-white/20 backdrop-blur-sm rounded-lg p-3 border-2 ${getRarityBorder(badge.rarity)} shadow-lg`}
                    title={badge.name}
                  >
                    <div className="text-3xl">{badge.icon}</div>
                    <button
                      onClick={() => handleUnequipBadge(badge)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {[...Array(3 - profile.equipped_badges.length)].map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border-2 border-white/20 border-dashed w-[68px] h-[68px] flex items-center justify-center text-white/40"
                  >
                    +
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          내 배지 컬렉션 ({myBadges.length})
        </h3>

        {myBadges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🏅</div>
            <p>아직 획득한 배지가 없습니다</p>
            <p className="text-sm mt-2">퀘스트를 완료하고 배지를 모아보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {myBadges.map((badge) => (
              <div
                key={badge.id}
                className={`relative group cursor-pointer transition-all hover:scale-105 ${
                  badge.is_equipped ? 'ring-4 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedBadge(badge)}
              >
                <div
                  className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-lg p-4 text-center shadow-lg`}
                >
                  <div className="text-5xl mb-2">{badge.icon}</div>
                  <p className="text-xs font-semibold text-white truncate">{badge.name}</p>
                  {badge.is_equipped && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      장착중
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`inline-block bg-gradient-to-br ${getRarityColor(selectedBadge.rarity)} rounded-2xl p-8 mb-4`}
              >
                <div className="text-8xl">{selectedBadge.icon}</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedBadge.description}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-500">등급:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(selectedBadge.rarity)}`}
                >
                  {selectedBadge.rarity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                획득일: {new Date(selectedBadge.unlocked_at).toLocaleDateString('ko-KR')}
              </p>

              <div className="flex gap-3">
                {selectedBadge.is_equipped ? (
                  <button
                    onClick={() => handleUnequipBadge(selectedBadge)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    해제하기
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquipBadge(selectedBadge)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    장착하기
                  </button>
                )}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCustomization;

import React from 'react';

const AchievementBadge = ({ achievement, size = 'md', showDetails = true }) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const getBadgeColor = (category) => {
    const colors = {
      attendance: 'from-blue-400 to-blue-600',
      assignment: 'from-purple-400 to-purple-600',
      quiz: 'from-green-400 to-green-600',
      participation: 'from-yellow-400 to-yellow-600',
      streak: 'from-orange-400 to-orange-600',
      level: 'from-pink-400 to-pink-600',
      special: 'from-red-400 to-red-600',
    };
    return colors[category] || 'from-gray-400 to-gray-600';
  };

  const getRarityBorder = (rarity) => {
    const borders = {
      common: 'border-gray-400',
      uncommon: 'border-green-500',
      rare: 'border-blue-500',
      epic: 'border-purple-500',
      legendary: 'border-yellow-500',
    };
    return borders[rarity] || 'border-gray-400';
  };

  const getRarityGlow = (rarity) => {
    const glows = {
      common: '',
      uncommon: 'shadow-lg shadow-green-500/50',
      rare: 'shadow-lg shadow-blue-500/50',
      epic: 'shadow-lg shadow-purple-500/50',
      legendary: 'shadow-xl shadow-yellow-500/70 animate-pulse',
    };
    return glows[rarity] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUnlocked = achievement.unlocked || achievement.earned_at;

  return (
    <div
      className={`relative ${
        showDetails ? 'p-4' : 'p-2'
      } rounded-lg bg-white border-2 ${getRarityBorder(
        achievement.rarity
      )} ${getRarityGlow(achievement.rarity)} transition-all hover:scale-105 ${
        !isUnlocked ? 'opacity-60 grayscale' : ''
      }`}
    >
      {/* Achievement Icon */}
      <div className="flex justify-center mb-2">
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${getBadgeColor(
            achievement.category
          )} shadow-md`}
        >
          <span className="filter drop-shadow-lg">
            {achievement.icon || '🏆'}
          </span>
        </div>
      </div>

      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <div className="text-white text-4xl">🔒</div>
        </div>
      )}

      {/* Achievement Details */}
      {showDetails && (
        <div className="text-center">
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {achievement.description}
          </p>

          {/* Rarity Badge */}
          {achievement.rarity && (
            <div className="inline-block mb-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold uppercase ${
                  achievement.rarity === 'legendary'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                    : achievement.rarity === 'epic'
                    ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white'
                    : achievement.rarity === 'rare'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                    : achievement.rarity === 'uncommon'
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                    : 'bg-gray-400 text-white'
                }`}
              >
                {achievement.rarity}
              </span>
            </div>
          )}

          {/* Points */}
          {achievement.points_earned !== undefined && (
            <div className="flex items-center justify-center gap-1 text-sm text-yellow-600 font-semibold mb-1">
              <span>⭐</span>
              <span>+{achievement.points_earned} 포인트</span>
            </div>
          )}

          {/* Progress Bar (for in-progress achievements) */}
          {!isUnlocked &&
            achievement.progress !== undefined &&
            achievement.target !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>진행도</span>
                  <span>
                    {achievement.progress} / {achievement.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${getBadgeColor(
                      achievement.category
                    )} h-2 rounded-full transition-all`}
                    style={{
                      width: `${Math.min(
                        (achievement.progress / achievement.target) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

          {/* Earned Date */}
          {isUnlocked && achievement.earned_at && (
            <div className="text-xs text-gray-500 mt-2">
              {formatDate(achievement.earned_at)}
            </div>
          )}
        </div>
      )}

      {/* Compact Mode - Show only icon with tooltip */}
      {!showDetails && isUnlocked && (
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-700 truncate">
            {achievement.title}
          </div>
        </div>
      )}

      {/* New Badge for recently earned */}
      {isUnlocked && achievement.is_new && (
        <div className="absolute top-1 right-1">
          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-bounce">
            NEW!
          </span>
        </div>
      )}
    </div>
  );
};

// Achievement Grid Component
export const AchievementGrid = ({ achievements, size = 'md', columns = 4 }) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4`}>
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
          showDetails={true}
        />
      ))}
    </div>
  );
};

// Achievement Showcase Component (for displaying single achievement prominently)
export const AchievementShowcase = ({ achievement, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative animate-bounce-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            🎉 업적 달성! 🎉
          </h2>

          <AchievementBadge achievement={achievement} size="xl" showDetails={true} />

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              +{achievement.points_earned} 포인트!
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;

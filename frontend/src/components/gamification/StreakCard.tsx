/**
 * Streak Card Component
 * 연속 학습일 표시 컴포넌트
 */
import React from 'react';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  longestStreak,
  compact = false,
}) => {
  const getStreakEmoji = (days: number) => {
    if (days === 0) return '😴';
    if (days < 3) return '🔥';
    if (days < 7) return '🔥🔥';
    if (days < 30) return '🔥🔥🔥';
    return '👑';
  };

  const getStreakMessage = (days: number) => {
    if (days === 0) return '오늘 학습을 시작하세요!';
    if (days === 1) return '좋은 시작입니다!';
    if (days < 3) return '계속 진행하세요!';
    if (days < 7) return '대단해요!';
    if (days < 30) return '놀라운 노력입니다!';
    if (days < 100) return '전설이 되어가고 있어요!';
    return '당신은 전설입니다!';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
        <span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
        <div>
          <p className="text-sm font-semibold text-orange-900">{currentStreak}일 연속</p>
          <p className="text-xs text-orange-600">{getStreakMessage(currentStreak)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">학습 스트릭</h3>
        <span className="text-4xl">{getStreakEmoji(currentStreak)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
          <p className="text-sm opacity-90 mb-1">현재 스트릭</p>
          <p className="text-3xl font-bold">{currentStreak}</p>
          <p className="text-xs opacity-75">일 연속</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
          <p className="text-sm opacity-90 mb-1">최장 스트릭</p>
          <p className="text-3xl font-bold">{longestStreak}</p>
          <p className="text-xs opacity-75">일</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-medium opacity-90">{getStreakMessage(currentStreak)}</p>
      </div>

      {currentStreak > 0 && (
        <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
          <p className="text-xs opacity-75 mb-2">다음 목표</p>
          <div className="flex items-center gap-2">
            {[3, 7, 30, 100].map((milestone) => (
              <div
                key={milestone}
                className={`flex-1 h-2 rounded-full ${
                  currentStreak >= milestone
                    ? 'bg-white'
                    : 'bg-white bg-opacity-20'
                }`}
                title={`${milestone}일`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs mt-1 opacity-75">
            <span>3</span>
            <span>7</span>
            <span>30</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakCard;

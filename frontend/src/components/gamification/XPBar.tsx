/**
 * XP Progress Bar Component
 * 사용자의 레벨, XP, 진행도를 표시하는 컴포넌트
 */
import React from 'react';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP?: number;
  compact?: boolean;
}

const XPBar: React.FC<XPBarProps> = ({
  level,
  currentXP,
  xpToNextLevel,
  totalXP,
  compact = false,
}) => {
  const progressPercentage = (currentXP / xpToNextLevel) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg">
          {level}
        </div>
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg">
            {level}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Level {level}</h3>
            <p className="text-sm text-gray-600">
              {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
            </p>
          </div>
        </div>
        {totalXP !== undefined && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Total XP</p>
            <p className="font-semibold text-gray-900">{totalXP.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 transition-all duration-500 ease-out rounded-full relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-600 text-right">
          {progressPercentage.toFixed(1)}% to Level {level + 1}
        </div>
      </div>
    </div>
  );
};

export default XPBar;

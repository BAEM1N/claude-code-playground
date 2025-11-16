/**
 * Badge Unlocked Modal
 * 배지 획득 시 표시되는 축하 모달 (framer-motion 애니메이션 포함)
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji?: string;
  badge_type: string;
  xp_reward: number;
  points_reward: number;
}

interface BadgeUnlockedModalProps {
  isOpen: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({
  isOpen,
  badge,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen || !badge) return undefined;

    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: getBadgeColors(badge.badge_type),
    });

    // Auto close after 5 seconds
    const timeout = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isOpen, badge, onClose]);

  const getBadgeColors = (badgeType: string): string[] => {
    switch (badgeType) {
      case 'platinum':
        return ['#00d4ff', '#0099cc', '#0066ff'];
      case 'gold':
        return ['#ffd700', '#ffb700', '#ff8800'];
      case 'silver':
        return ['#c0c0c0', '#a8a8a8', '#909090'];
      case 'bronze':
        return ['#cd7f32', '#b8722c', '#a36426'];
      case 'special':
        return ['#9333ea', '#c026d3', '#ec4899'];
      default:
        return ['#6366f1', '#8b5cf6', '#a855f7'];
    }
  };

  const getBadgeGradient = (badgeType: string): string => {
    switch (badgeType) {
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
        return 'from-indigo-500 to-purple-600';
    }
  };

  if (!badge) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -100 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className={`bg-gradient-to-br ${getBadgeGradient(
              badge.badge_type
            )} rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge unlocked text */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">🎉 배지 획득!</h2>
              <p className="text-white text-opacity-90">새로운 배지를 얻었습니다</p>
            </motion.div>

            {/* Badge icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
                className="text-9xl inline-block"
              >
                {badge.icon_emoji || '🏅'}
              </motion.div>
            </motion.div>

            {/* Badge details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 mb-6"
            >
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                {badge.name}
              </h3>
              <p className="text-white text-opacity-90 text-center mb-4">
                {badge.description}
              </p>

              {/* Badge type */}
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-1 bg-white bg-opacity-30 rounded-full text-white font-semibold text-sm uppercase">
                  {badge.badge_type}
                </span>
              </div>

              {/* Rewards */}
              <div className="flex justify-center gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <p className="text-white text-sm opacity-80">XP</p>
                  <p className="text-white font-bold text-lg">+{badge.xp_reward}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <p className="text-white text-sm opacity-80">포인트</p>
                  <p className="text-white font-bold text-lg">+{badge.points_reward}</p>
                </div>
              </div>
            </motion.div>

            {/* Close button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              확인
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeUnlockedModal;

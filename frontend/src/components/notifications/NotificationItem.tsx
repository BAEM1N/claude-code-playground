/**
 * Notification Item Component
 * Individual notification display
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  notification_type?: string;
  priority?: string;
  title: string;
  content: string;
  icon?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark as read
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return created.toLocaleDateString('ko-KR');
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'normal':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-gray-300';
    }
  };

  const getNotificationIcon = (): string => {
    if (notification.icon) return notification.icon;

    // Fallback icons based on type
    switch (notification.type || notification.notification_type) {
      case 'level_up':
        return '👑';
      case 'badge_earned':
        return '🏅';
      case 'streak_milestone':
        return '🔥';
      case 'rank_change':
        return '📊';
      case 'team_invite':
      case 'team_message':
        return '👥';
      case 'achievement':
        return '🎯';
      case 'quest_complete':
        return '✅';
      case 'challenge_invite':
        return '⚔️';
      case 'friend_request':
        return '🤝';
      case 'mention':
        return '💬';
      case 'file_upload':
        return '📁';
      case 'assignment':
        return '📝';
      case 'announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
        notification.action_url ? 'cursor-pointer' : ''
      } ${
        !notification.is_read ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-white hover:bg-gray-50'
      } transition-colors relative group`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {getNotificationIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1.5" />
            )}
          </div>

          {/* Content */}
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.content}
          </p>

          {/* Time */}
          <p className="mt-1 text-xs text-gray-500">
            {getTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismissClick}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;

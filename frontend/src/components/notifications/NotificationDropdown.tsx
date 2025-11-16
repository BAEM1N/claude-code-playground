/**
 * Notification Dropdown Component
 * Displays list of notifications in a dropdown
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NotificationItem from './NotificationItem';

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

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onNotificationRead,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/notifications?limit=20&unread_only=${unreadOnly}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setError(null);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        onNotificationRead();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        onNotificationRead();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/dismiss`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        onNotificationRead();
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-[32rem] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">알림</h3>
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              !unreadOnly
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              unreadOnly
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            읽지 않음
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-sm text-gray-500">
              {unreadOnly ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            모든 알림 보기 →
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

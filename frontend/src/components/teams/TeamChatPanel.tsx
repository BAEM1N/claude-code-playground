/**
 * Team Chat Panel Component
 * Main chat interface for team messaging
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamMessageList from './TeamMessageList';
import TeamMessageInput from './TeamMessageInput';

interface Message {
  id: string;
  team_id: string;
  user_id: string;
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  message_type: string;
  content: string;
  metadata?: any;
  reply_to_id?: string;
  reactions: { [emoji: string]: string[] };
  is_edited: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
}

interface TeamChatPanelProps {
  teamId: string;
  teamName: string;
  currentUserId: string;
}

const TeamChatPanel: React.FC<TeamChatPanelProps> = ({
  teamId,
  teamName,
  currentUserId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(true); // Silent reload
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await fetch(`/api/v1/teams/${teamId}/messages?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setError(null);
      } else if (response.status === 403) {
        setError('You do not have access to this team chat');
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      if (!silent) setError('Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`/api/v1/teams/${teamId}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleSendMessage = async (content: string, _metadata?: any) => {
    try {
      const params = new URLSearchParams({
        content,
        message_type: 'text',
      });

      if (replyingTo) {
        params.append('reply_to_id', replyingTo.id);
      }

      const response = await fetch(`/api/v1/teams/${teamId}/messages?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setReplyingTo(null);
        loadUnreadCount();
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const params = new URLSearchParams({ content: newContent });

      const response = await fetch(`/api/v1/teams/${teamId}/messages/${messageId}?${params}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const updated = await response.json();
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: updated.content, is_edited: updated.is_edited }
              : msg
          )
        );
      } else {
        alert('Failed to edit message');
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/v1/teams/${teamId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        alert('Failed to delete message');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const handleReaction = async (messageId: string, emoji: string, add: boolean) => {
    try {
      const url = `/api/v1/teams/${teamId}/messages/${messageId}/reactions${add ? '' : `/${emoji}`}`;
      const params = add ? new URLSearchParams({ emoji }) : '';

      const response = await fetch(`${url}${add && params ? `?${params}` : ''}`, {
        method: add ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const { reactions } = await response.json();
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, reactions } : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadMessages()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{teamName} 채팅</h2>
            <p className="text-sm text-gray-500">{messages.length} messages</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            <TeamMessageList
              messages={messages}
              currentUserId={currentUserId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReaction={handleReaction}
              onReply={handleReply}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 bg-gray-100 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Replying to {replyingTo.user.full_name || replyingTo.user.email}</p>
                <p className="text-sm text-gray-700 truncate">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <TeamMessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default TeamChatPanel;

/**
 * Team Message List Component
 * Displays list of team messages
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';

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

interface TeamMessageListProps {
  messages: Message[];
  currentUserId: string;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string, add: boolean) => void;
  onReply: (message: Message) => void;
}

const TeamMessageList: React.FC<TeamMessageListProps> = ({
  messages,
  currentUserId,
  onEdit,
  onDelete,
  onReaction,
  onReply,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '💯', '🚀'];

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = (messageId: string) => {
    if (editContent.trim()) {
      onEdit(messageId, editContent.trim());
      cancelEdit();
    }
  };

  const handleReactionClick = (messageId: string, emoji: string, hasReacted: boolean) => {
    onReaction(messageId, emoji, !hasReacted);
    setShowEmojiPicker(null);
  };

  const getUserDisplayName = (user: Message['user']): string => {
    return user.full_name || user.email?.split('@')[0] || 'Unknown User';
  };

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.user_id === currentUserId;
        const isEditing = editingId === message.id;
        const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
          >
            <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-2xl`}>
              {/* Avatar */}
              <div className="flex-shrink-0 mx-2">
                {showAvatar ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {getUserDisplayName(message.user).charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {/* User name and time */}
                {showAvatar && (
                  <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName(message.user)}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`relative rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(message.id)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {message.is_edited && (
                        <span className={`text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'} ml-2`}>
                          (edited)
                        </span>
                      )}
                    </>
                  )}

                  {/* Reactions */}
                  {Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUserId);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(message.id, emoji, hasReacted)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              hasReacted
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            } hover:opacity-75`}
                          >
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Action buttons (shown on hover) */}
                  {!isEditing && (
                    <div
                      className={`absolute ${isOwnMessage ? 'left-0 -ml-32' : 'right-0 -mr-32'} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
                    >
                      {/* Emoji picker */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                          className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-600"
                          title="Add reaction"
                        >
                          😊
                        </button>
                        {showEmojiPicker === message.id && (
                          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg p-2 flex gap-1 z-10">
                            {commonEmojis.map(emoji => {
                              const hasReacted = message.reactions[emoji]?.includes(currentUserId);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactionClick(message.id, emoji, hasReacted)}
                                  className="text-lg hover:bg-gray-100 p-1 rounded"
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Reply */}
                      <button
                        onClick={() => onReply(message)}
                        className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
                        title="Reply"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>

                      {/* Edit (only own messages) */}
                      {isOwnMessage && (
                        <button
                          onClick={() => startEdit(message)}
                          className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete (only own messages) */}
                      {isOwnMessage && (
                        <button
                          onClick={() => onDelete(message.id)}
                          className="p-1 rounded bg-white border border-gray-300 hover:bg-red-50"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TeamMessageList;

/**
// @ts-nocheck
 * Chat Page Component
// @ts-nocheck
 * Real-time messaging with WebSocket integration
// @ts-nocheck
 */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { channelsAPI, messagesAPI } from '../services/api';
import wsService from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface Message {
  id: string;
  content: string;
  user_name?: string;
  created_at?: string;
  channel_id: string;
  files?: Array<{
    id: string;
    filename: string;
  }>;
}

const ChatPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>(
    ['channels', courseId],
    async () => {
      const { data } = await (channelsAPI as any).getChannels(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      onSuccess: (data) => {
        if (data && data.length > 0 && !selectedChannel) {
          setSelectedChannel(data[0]);
        }
      },
    }
  );

  // Fetch messages for selected channel
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>(
    ['messages', selectedChannel?.id],
    async () => {
      const { data } = await (messagesAPI as any).getMessages(selectedChannel!.id);
      return data;
    },
    {
      enabled: !!selectedChannel?.id,
      refetchInterval: 10000, // Poll every 10 seconds as fallback
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (content: string) => (messagesAPI as any).createMessage(selectedChannel!.id, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', selectedChannel?.id]);
        setMessageInput('');
      },
      onError: (err) => {
        setError('메시지 전송에 실패했습니다.');
        console.error('Failed to send message:', err);
      },
    }
  );

  // WebSocket connection
  useEffect(() => {
    if (!courseId || !user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket
    wsService.connect(courseId, token);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.channel_id === selectedChannel?.id) {
        queryClient.invalidateQueries(['messages', selectedChannel.id]);
      }
    };

    wsService.on('message.new', handleNewMessage);

    // Cleanup
    return () => {
      wsService.off('message.new', handleNewMessage);
    };
  }, [courseId, user, selectedChannel, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendMessageMutation.mutate(messageInput);
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setError(null);
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Channel List Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">채널</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels && channels.length > 0 ? (
            <div className="py-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedChannel?.id === channel.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">#</span>
                    <span
                      className={`font-medium ${
                        selectedChannel?.id === channel.id ? 'text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      {channel.name}
                    </span>
                  </div>
                  {channel.description && (
                    <p className="text-xs text-gray-500 mt-1 ml-6">{channel.description}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              채널이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    #{selectedChannel.name}
                  </h1>
                  {selectedChannel.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {message.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-medium text-gray-900">
                          {message.user_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.created_at &&
                            formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                      {/* File attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span>{file.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="mt-2">메시지가 없습니다</p>
                    <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`#${selectedChannel.name}에 메시지 보내기...`}
                    rows={1}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendMessageMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </form>
              <p className="mt-2 text-xs text-gray-500">
                Shift+Enter로 줄바꿈, Enter로 전송
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2">채널을 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

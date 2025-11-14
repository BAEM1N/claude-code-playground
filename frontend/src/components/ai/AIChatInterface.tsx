/**
 * AI Chat Interface Component
 * Provides a conversational interface for AI assistant
 */
// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat, useAIConversation, useAIProviders } from '../../hooks/useAI';
import { AIProvider, AIMessage } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface AIChatInterfaceProps {
  courseId?: number;
  conversationId?: number;
  onConversationCreated?: (conversationId: number) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  courseId,
  conversationId: initialConversationId,
  onConversationCreated,
}) => {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | undefined>(initialConversationId);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: providersData } = useAIProviders();
  const { data: conversationData, isLoading: conversationLoading } = useAIConversation(conversationId);
  const chatMutation = useAIChat();

  // Load conversation messages
  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default provider
  useEffect(() => {
    if (providersData?.default_provider) {
      setSelectedProvider(providersData.default_provider);
    }
  }, [providersData]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now(),
      role: 'user',
      content: message.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await chatMutation.mutateAsync({
        message: userMessage.content,
        conversation_id: conversationId,
        course_id: courseId,
        provider: selectedProvider,
      });

      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        onConversationCreated?.(response.conversation_id);
      }

      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: '죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (conversationLoading) {
    return <LoadingSpinner message="대화를 불러오는 중..." />;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">AI 어시스턴트</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="provider-select" className="text-sm text-gray-600">
            모델:
          </label>
          <select
            id="provider-select"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={chatMutation.isLoading}
          >
            {providersData?.providers
              .filter((p) => p.is_available)
              .map((provider) => (
                <option key={provider.provider} value={provider.provider}>
                  {provider.provider.toUpperCase()}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-gray-500">AI 어시스턴트와 대화를 시작해보세요</p>
            <p className="text-sm text-gray-400 mt-2">
              코드 리뷰, 개념 설명, 퀴즈 생성 등 다양한 도움을 받을 수 있습니다
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                {msg.tokens_used && (
                  <p className="text-xs mt-1 opacity-70">
                    {msg.tokens_used} tokens
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {chatMutation.isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={chatMutation.isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || chatMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {chatMutation.isLoading ? '전송 중...' : '전송'}
          </button>
        </div>
        {chatMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            메시지 전송에 실패했습니다. 다시 시도해주세요.
          </p>
        )}
      </div>
    </div>
  );
};

export default AIChatInterface;

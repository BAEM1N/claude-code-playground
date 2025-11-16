/**
 * AI Conversations History Page
 * Shows all AI conversations and allows viewing/continuing them
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIConversations, useDeleteAIConversation } from '../hooks/useAI';
import { AIChatInterface } from '../components/ai';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDateTime } from '../utils/formatters';

const AIConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();
  const { data: conversations, isLoading, refetch } = useAIConversations();
  const deleteMutation = useDeleteAIConversation();

  const handleDelete = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 대화를 삭제하시겠습니까?')) return;

    try {
      await deleteMutation.mutateAsync(conversationId);
      refetch();
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      chat: '채팅',
      code_review: '코드 리뷰',
      explain_concept: '개념 설명',
      generate_quiz: '퀴즈 생성',
      summarize: '요약',
      answer_question: '질문 답변',
      custom: '사용자 정의',
    };
    return labels[taskType] || taskType;
  };

  const getTaskTypeColor = (taskType: string) => {
    const colors: Record<string, string> = {
      chat: 'bg-blue-100 text-blue-800',
      code_review: 'bg-purple-100 text-purple-800',
      explain_concept: 'bg-green-100 text-green-800',
      generate_quiz: 'bg-yellow-100 text-yellow-800',
      summarize: 'bg-pink-100 text-pink-800',
      answer_question: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[taskType] || colors.custom;
  };

  if (isLoading) {
    return <LoadingSpinner message="대화 목록을 불러오는 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI 대화 기록</h1>
              <p className="mt-1 text-sm text-gray-600">
                이전 대화를 확인하고 이어서 대화하세요
              </p>
            </div>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              새 대화 시작
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedConversationId ? (
          /* Chat View */
          <div>
            <button
              onClick={() => setSelectedConversationId(undefined)}
              className="mb-4 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              대화 목록으로 돌아가기
            </button>
            <div className="h-[calc(100vh-250px)]">
              <AIChatInterface
                conversationId={selectedConversationId}
              />
            </div>
          </div>
        ) : (
          /* List View */
          <div>
            {conversations && conversations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {conversations.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-purple-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {conversation.title || `대화 #${conversation.id}`}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getTaskTypeColor(conversation.task_type)}`}>
                              {getTaskTypeLabel(conversation.task_type)}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                              {conversation.provider.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {conversation.message_count}개 메시지
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDateTime(conversation.created_at)}
                            </span>
                            {conversation.updated_at && conversation.updated_at !== conversation.created_at && (
                              <span className="text-xs text-gray-500">
                                (최근: {formatDateTime(conversation.updated_at)})
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(conversation.id, e)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          disabled={deleteMutation.isLoading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  대화 기록이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  AI 어시스턴트와 대화를 시작하면 여기에 기록이 표시됩니다
                </p>
                <button
                  onClick={() => navigate('/ai-assistant')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  첫 대화 시작하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConversationsPage;

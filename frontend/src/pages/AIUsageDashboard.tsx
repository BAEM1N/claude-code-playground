/**
 * AI Usage Dashboard Page
 * Shows detailed AI usage statistics and analytics
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useMyAIUsageStats } from '../hooks/useAI';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const AIUsageDashboard: React.FC = () => {
  const [days, setDays] = useState(30);
  const { data: stats, isLoading, error } = useMyAIUsageStats(days);

  const getDayRangeOptions = () => [
    { value: 7, label: '최근 7일' },
    { value: 30, label: '최근 30일' },
    { value: 90, label: '최근 90일' },
  ];

  if (isLoading) {
    return <LoadingSpinner message="사용 통계를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">통계를 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  const totalCost = stats?.total_tokens
    ? (stats.total_tokens / 1000000) * 0.5 // Rough estimate
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI 사용 통계</h1>
              <p className="mt-1 text-sm text-gray-600">
                AI 어시스턴트 사용 내역 및 분석
              </p>
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {getDayRangeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 요청</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_requests || 0}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">토큰 사용</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_tokens ? `${(stats.total_tokens / 1000).toFixed(1)}K` : '0'}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 응답 시간</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.average_response_time_ms
                    ? `${(stats.average_response_time_ms / 1000).toFixed(1)}s`
                    : '-'}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">예상 비용</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Usage by Provider */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">제공자별 사용량</h2>
            <div className="space-y-3">
              {stats?.requests_by_provider &&
                Object.entries(stats.requests_by_provider).map(([provider, count]: [string, any]) => {
                  const percentage = stats.total_requests > 0
                    ? ((count / stats.total_requests) * 100).toFixed(1)
                    : 0;
                  return (
                    <div key={provider}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {provider}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count}회 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {(!stats?.requests_by_provider || Object.keys(stats.requests_by_provider).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  사용 데이터가 없습니다
                </p>
              )}
            </div>
          </div>

          {/* Usage by Task */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">작업별 사용량</h2>
            <div className="space-y-3">
              {stats?.requests_by_task &&
                Object.entries(stats.requests_by_task).map(([task, count]: [string, any]) => {
                  const percentage = stats.total_requests > 0
                    ? ((count / stats.total_requests) * 100).toFixed(1)
                    : 0;
                  const taskLabels: Record<string, string> = {
                    chat: '채팅',
                    code_review: '코드 리뷰',
                    explain_concept: '개념 설명',
                    generate_quiz: '퀴즈 생성',
                    summarize: '요약',
                  };
                  return (
                    <div key={task}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {taskLabels[task] || task}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count}회 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {(!stats?.requests_by_task || Object.keys(stats.requests_by_task).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  사용 데이터가 없습니다
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 비용 절감 팁</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>간단한 질문에는 GPT-4o-mini나 Gemini Flash를 사용하세요</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>코드 리뷰 시 전체 코드가 아닌 핵심 부분만 제출하세요</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>대화가 너무 길어지면 새 대화를 시작하여 컨텍스트 길이를 줄이세요</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIUsageDashboard;

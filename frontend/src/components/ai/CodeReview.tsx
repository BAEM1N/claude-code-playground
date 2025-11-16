/**
 * AI Code Review Component
 * Provides AI-powered code review functionality
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useCodeReview, useCodeReviewFeedback, useAIProviders } from '../../hooks/useAI';
import { AIProvider } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface CodeReviewProps {
  initialCode?: string;
  initialLanguage?: string;
  submissionId?: number;
  onReviewComplete?: (review: string) => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
];

export const CodeReview: React.FC<CodeReviewProps> = ({
  initialCode = '',
  initialLanguage = 'python',
  submissionId,
  onReviewComplete,
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [context, setContext] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [review, setReview] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const { data: providersData } = useAIProviders();
  const reviewMutation = useCodeReview();
  const feedbackMutation = useCodeReviewFeedback();

  const handleReview = async () => {
    if (!code.trim()) return;

    try {
      const response = await reviewMutation.mutateAsync({
        code: code.trim(),
        language,
        context: context.trim() || undefined,
        submission_id: submissionId,
        provider: selectedProvider,
      });

      setReview(response.review);
      setReviewId(response.review_id || null);
      onReviewComplete?.(response.review);
    } catch (error) {
      console.error('Code review failed:', error);
    }
  };

  const handleFeedback = async (wasHelpful: boolean) => {
    if (!reviewId) return;

    try {
      await feedbackMutation.mutateAsync({
        review_id: reviewId,
        was_helpful: wasHelpful,
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleReset = () => {
    setReview(null);
    setReviewId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 코드 리뷰</h2>

      {/* Code Input */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
              프로그래밍 언어
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={reviewMutation.isLoading}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
              AI 모델
            </label>
            <select
              id="provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={reviewMutation.isLoading}
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

        <div>
          <label htmlFor="code-input" className="block text-sm font-medium text-gray-700 mb-1">
            코드
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="리뷰받고 싶은 코드를 입력하세요..."
            className="w-full h-64 px-4 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={reviewMutation.isLoading}
          />
        </div>

        <div>
          <label htmlFor="context-input" className="block text-sm font-medium text-gray-700 mb-1">
            추가 정보 (선택사항)
          </label>
          <textarea
            id="context-input"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="이 코드의 목적이나 특별히 검토받고 싶은 부분을 설명해주세요..."
            className="w-full h-24 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={reviewMutation.isLoading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleReview}
          disabled={!code.trim() || reviewMutation.isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {reviewMutation.isLoading ? '분석 중...' : '코드 리뷰 받기'}
        </button>
        {review && (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            새 리뷰
          </button>
        )}
      </div>

      {/* Error Message */}
      {reviewMutation.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">코드 리뷰 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {/* Loading */}
      {reviewMutation.isLoading && (
        <LoadingSpinner size="md" message="AI가 코드를 분석하고 있습니다..." />
      )}

      {/* Review Result */}
      {review && !reviewMutation.isLoading && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">리뷰 결과</h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {review}
              </pre>
            </div>
          </div>

          {/* Feedback */}
          {reviewId && !feedbackMutation.isLoading && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">이 리뷰가 도움이 되셨나요?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  👍 도움됨
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  👎 별로
                </button>
              </div>
            </div>
          )}

          {feedbackMutation.isLoading && (
            <div className="text-center text-sm text-gray-600">피드백을 제출하는 중...</div>
          )}

          {feedbackMutation.isSuccess && (
            <div className="text-center text-sm text-green-600">
              피드백을 제출해주셔서 감사합니다!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeReview;

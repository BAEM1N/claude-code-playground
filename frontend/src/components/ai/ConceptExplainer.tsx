/**
 * AI Concept Explainer Component
 * Provides AI-powered concept explanations
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useExplainConcept, useAIProviders } from '../../hooks/useAI';
import { AIProvider } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface ConceptExplainerProps {
  initialConcept?: string;
  onExplanationComplete?: (explanation: string) => void;
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 'beginner', label: '초급', description: '기초부터 쉽게 설명' },
  { value: 'intermediate', label: '중급', description: '개념과 활용법 설명' },
  { value: 'advanced', label: '고급', description: '심화 개념 및 내부 동작 설명' },
];

export const ConceptExplainer: React.FC<ConceptExplainerProps> = ({
  initialConcept = '',
  onExplanationComplete,
}) => {
  const [concept, setConcept] = useState(initialConcept);
  const [level, setLevel] = useState<DifficultyLevel>('intermediate');
  const [context, setContext] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [explanation, setExplanation] = useState<string | null>(null);

  const { data: providersData } = useAIProviders();
  const explainMutation = useExplainConcept();

  const handleExplain = async () => {
    if (!concept.trim()) return;

    try {
      const response = await explainMutation.mutateAsync({
        concept: concept.trim(),
        level,
        context: context.trim() || undefined,
        provider: selectedProvider,
      });

      setExplanation(response.explanation);
      onExplanationComplete?.(response.explanation);
    } catch (error) {
      console.error('Concept explanation failed:', error);
    }
  };

  const handleReset = () => {
    setExplanation(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 개념 설명</h2>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="concept-input" className="block text-sm font-medium text-gray-700 mb-1">
            설명받고 싶은 개념
          </label>
          <input
            id="concept-input"
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="예: Python 데코레이터, React Hooks, 알고리즘 시간복잡도..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={explainMutation.isLoading}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
            <div className="space-y-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    value={option.value}
                    checked={level === option.value}
                    onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                    className="mr-2"
                    disabled={explainMutation.isLoading}
                  />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-gray-600 ml-2">- {option.description}</span>
                  </div>
                </label>
              ))}
            </div>
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
              disabled={explainMutation.isLoading}
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
          <label htmlFor="context-input" className="block text-sm font-medium text-gray-700 mb-1">
            추가 맥락 (선택사항)
          </label>
          <textarea
            id="context-input"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="특정 상황이나 배경 지식을 설명하면 더 정확한 답변을 받을 수 있습니다..."
            className="w-full h-24 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={explainMutation.isLoading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleExplain}
          disabled={!concept.trim() || explainMutation.isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {explainMutation.isLoading ? '설명 생성 중...' : '설명 받기'}
        </button>
        {explanation && (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            새 질문
          </button>
        )}
      </div>

      {/* Error Message */}
      {explainMutation.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">설명 생성 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {/* Loading */}
      {explainMutation.isLoading && (
        <LoadingSpinner size="md" message="AI가 개념을 설명하고 있습니다..." />
      )}

      {/* Explanation Result */}
      {explanation && !explainMutation.isLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            설명
          </h3>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-white p-4 rounded border border-blue-100">
              {explanation}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptExplainer;

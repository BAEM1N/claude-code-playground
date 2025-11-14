/**
 * AI Assistant Page
 * Main page for AI assistant features
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AIChatInterface,
  CodeReview,
  ConceptExplainer,
  QuizGenerator,
} from '../components/ai';

type AIFeature = 'chat' | 'code-review' | 'concept' | 'quiz';

const AIAssistantPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeFeature, setActiveFeature] = useState<AIFeature>('chat');

  const features: { id: AIFeature; label: string; icon: string; description: string }[] = [
    {
      id: 'chat',
      label: '채팅',
      icon: '💬',
      description: 'AI와 자유롭게 대화하기',
    },
    {
      id: 'code-review',
      label: '코드 리뷰',
      icon: '🔍',
      description: '코드 분석 및 개선 제안',
    },
    {
      id: 'concept',
      label: '개념 설명',
      icon: '💡',
      description: '프로그래밍 개념 쉽게 배우기',
    },
    {
      id: 'quiz',
      label: '퀴즈 생성',
      icon: '📝',
      description: 'AI가 만드는 맞춤형 퀴즈',
    },
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return (
          <AIChatInterface
            courseId={courseId ? parseInt(courseId) : undefined}
          />
        );
      case 'code-review':
        return <CodeReview />;
      case 'concept':
        return <ConceptExplainer />;
      case 'quiz':
        return courseId ? (
          <QuizGenerator courseId={parseInt(courseId)} />
        ) : (
          <div className="text-center text-gray-600 py-12">
            퀴즈 생성은 코스 페이지에서만 사용 가능합니다.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI 어시스턴트</h1>
              <p className="mt-1 text-sm text-gray-600">
                AI의 도움을 받아 학습하고, 코드를 개선하고, 문제를 해결하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeFeature === feature.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{feature.icon}</span>
                {feature.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Description */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-blue-800">
            {features.find((f) => f.id === activeFeature)?.description}
          </p>
        </div>
      </div>

      {/* Feature Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[calc(100vh-300px)]">{renderFeature()}</div>
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-medium text-gray-900 mb-1">안전한 사용</h3>
              <p className="text-sm text-gray-600">
                모든 대화는 암호화되어 안전하게 저장됩니다
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-medium text-gray-900 mb-1">빠른 응답</h3>
              <p className="text-sm text-gray-600">
                최신 AI 모델로 신속하고 정확한 답변을 제공합니다
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900 mb-1">학습 기록</h3>
              <p className="text-sm text-gray-600">
                AI 사용 내역을 확인하고 학습 과정을 추적하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;

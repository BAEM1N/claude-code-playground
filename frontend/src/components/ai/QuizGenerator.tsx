/**
 * AI Quiz Generator Component
 * Generates quizzes using AI based on topics
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useGenerateQuiz, useAIProviders } from '../../hooks/useAI';
import { AIProvider, QuizQuestion } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface QuizGeneratorProps {
  courseId: number;
  onQuizGenerated?: (questions: QuizQuestion[]) => void;
}

type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false' | 'coding';
type Difficulty = 'easy' | 'medium' | 'hard';

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: '객관식' },
  { value: 'short_answer', label: '주관식' },
  { value: 'true_false', label: 'O/X' },
  { value: 'coding', label: '코딩' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: '쉬움', color: 'green' },
  { value: 'medium', label: '보통', color: 'yellow' },
  { value: 'hard', label: '어려움', color: 'red' },
];

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ courseId, onQuizGenerated }) => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple_choice']);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[] | null>(null);

  const { data: providersData } = useAIProviders();
  const generateMutation = useGenerateQuiz();

  const handleTypeToggle = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedTypes.length === 0) return;

    try {
      const response = await generateMutation.mutateAsync({
        topic: topic.trim(),
        num_questions: numQuestions,
        difficulty,
        question_types: selectedTypes,
        course_id: courseId,
        provider: selectedProvider,
      });

      setGeneratedQuestions(response.questions);
      onQuizGenerated?.(response.questions);
    } catch (error) {
      console.error('Quiz generation failed:', error);
    }
  };

  const handleReset = () => {
    setGeneratedQuestions(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 퀴즈 생성</h2>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="topic-input" className="block text-sm font-medium text-gray-700 mb-1">
            퀴즈 주제
          </label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: Python 리스트와 딕셔너리, 자료구조 기초..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generateMutation.isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="num-questions" className="block text-sm font-medium text-gray-700 mb-1">
              문제 개수
            </label>
            <input
              id="num-questions"
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={generateMutation.isLoading}
            />
          </div>

          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
              AI 모델
            </label>
            <select
              id="provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={generateMutation.isLoading}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  difficulty === option.value
                    ? `bg-${option.color}-600 text-white`
                    : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                }`}
                disabled={generateMutation.isLoading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">문제 유형</label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedTypes.includes(option.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(option.value)}
                  onChange={() => handleTypeToggle(option.value)}
                  className="mr-2"
                  disabled={generateMutation.isLoading}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || selectedTypes.length === 0 || generateMutation.isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {generateMutation.isLoading ? '생성 중...' : '퀴즈 생성'}
        </button>
        {generatedQuestions && (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            새 퀴즈
          </button>
        )}
      </div>

      {/* Error Message */}
      {generateMutation.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">퀴즈 생성 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {/* Loading */}
      {generateMutation.isLoading && (
        <LoadingSpinner size="md" message="AI가 퀴즈를 생성하고 있습니다..." />
      )}

      {/* Generated Questions */}
      {generatedQuestions && !generateMutation.isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              생성된 문제 ({generatedQuestions.length}개)
            </h3>
            <span className="text-sm text-gray-600">
              총 {generatedQuestions.reduce((sum, q) => sum + q.points, 0)}점
            </span>
          </div>

          {generatedQuestions.map((question, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  문제 {index + 1}. {question.question}
                </h4>
                <span className="text-sm text-blue-600 font-medium">{question.points}점</span>
              </div>

              {/* Multiple Choice Options */}
              {question.type === 'multiple_choice' && question.options && (
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded mr-2 text-sm">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className="text-sm text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Correct Answer (Hidden by default, can be toggled) */}
              {question.correct_answer && (
                <details className="mt-3">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                    정답 보기
                  </summary>
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>정답:</strong> {question.correct_answer}
                    </p>
                    {question.explanation && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>해설:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                </details>
              )}

              {/* Sample Answer for Short Answer/Coding */}
              {question.sample_answer && (
                <details className="mt-3">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                    예시 답안 보기
                  </summary>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {question.sample_answer}
                    </pre>
                  </div>
                </details>
              )}

              {/* Key Points */}
              {question.key_points && question.key_points.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-1">핵심 포인트:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {question.key_points.map((point, pointIndex) => (
                      <li key={pointIndex}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;

// @ts-nocheck
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizList from '../components/quiz/QuizList';
import QuizForm from '../components/quiz/QuizForm';
import QuestionEditor from '../components/quiz/QuestionEditor';
import QuizTaking from '../components/quiz/QuizTaking';
import QuizResults from '../components/quiz/QuizResults';
import GradingInterface from '../components/quiz/GradingInterface';
import { QuizGenerator } from '../components/ai';
import { useAuth } from '../contexts/AuthContext';

type ViewType = 'list' | 'create' | 'edit' | 'questions' | 'take' | 'results' | 'grade' | 'ai-generate';

const QuizPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [view, setView] = useState<ViewType>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const userRole = user?.role || 'student';
  const isInstructor = userRole === 'instructor' || userRole === 'assistant';

  const handleCreateQuiz = () => {
    setSelectedQuiz(null);
    setView('create');
  };

  const handleQuizSaved = () => {
    setView('list');
    setSelectedQuiz(null);
  };

  const handleQuizSubmitted = (attemptId: string) => {
    setAttemptId(attemptId);
    setView('results');
  };

  const handleRetakeQuiz = () => {
    setView('take');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedQuiz(null);
    setSelectedQuestion(null);
    setAttemptId(null);
  };

  const renderView = () => {
    switch (view) {
      case 'create':
      case 'edit':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <QuizForm
              courseId={courseId}
              quizId={selectedQuiz?.id}
              onSuccess={handleQuizSaved}
              onCancel={handleBackToList}
            />
          </div>
        );

      case 'questions':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-2xl font-bold mb-2">{selectedQuiz?.title}</h2>
              <p className="text-gray-600">{selectedQuiz?.description}</p>
            </div>
            <QuestionEditor
              quizId={selectedQuiz?.id}
              question={selectedQuestion}
              onSuccess={() => {
                setSelectedQuestion(null);
                // Optionally refresh question list here
              }}
              onCancel={() => setSelectedQuestion(null)}
            />
          </div>
        );

      case 'take':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <QuizTaking
              quizId={selectedQuiz?.id}
              onComplete={handleQuizSubmitted}
            />
          </div>
        );

      case 'results':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <QuizResults
              attemptId={attemptId}
              onRetake={selectedQuiz?.max_attempts > 1 ? handleRetakeQuiz : null}
            />
          </div>
        );

      case 'grade':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <GradingInterface
              quizId={selectedQuiz?.id}
              attemptId={attemptId}
            />
          </div>
        );

      case 'ai-generate':
        return (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 목록으로 돌아가기
            </button>
            <QuizGenerator
              courseId={parseInt(courseId)}
              onQuizGenerated={(questions) => {
                console.log('Quiz generated:', questions);
                // 생성된 퀴즈를 저장하거나 수동 퀴즈 생성으로 이동할 수 있음
              }}
            />
          </div>
        );

      case 'list':
      default:
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">퀴즈 & 시험</h1>
                <p className="mt-2 text-gray-600">
                  퀴즈를 풀고 학습을 평가하세요.
                </p>
              </div>
              {isInstructor && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('ai-generate')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 퀴즈 생성
                  </button>
                  <button
                    onClick={handleCreateQuiz}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium"
                  >
                    + 새 퀴즈 만들기
                  </button>
                </div>
              )}
            </div>

            <QuizList
              courseId={courseId}
              userRole={userRole}
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderView()}
    </div>
  );
};

export default QuizPage;

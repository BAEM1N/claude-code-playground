import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizList from '../components/quiz/QuizList';
import QuizForm from '../components/quiz/QuizForm';
import QuestionEditor from '../components/quiz/QuestionEditor';
import QuizTaking from '../components/quiz/QuizTaking';
import QuizResults from '../components/quiz/QuizResults';
import GradingInterface from '../components/quiz/GradingInterface';
import { useAuth } from '../contexts/AuthContext';

const QuizPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'questions', 'take', 'results', 'grade'
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  const userRole = user?.role || 'student';
  const isInstructor = userRole === 'instructor' || userRole === 'assistant';

  const handleCreateQuiz = () => {
    setSelectedQuiz(null);
    setView('create');
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setView('edit');
  };

  const handleManageQuestions = (quiz) => {
    setSelectedQuiz(quiz);
    setView('questions');
  };

  const handleTakeQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setView('take');
  };

  const handleViewResults = (quiz, attemptId) => {
    setSelectedQuiz(quiz);
    setAttemptId(attemptId);
    setView('results');
  };

  const handleGradeAttempt = (quiz, attemptId) => {
    setSelectedQuiz(quiz);
    setAttemptId(attemptId);
    setView('grade');
  };

  const handleQuizSaved = () => {
    setView('list');
    setSelectedQuiz(null);
  };

  const handleQuizSubmitted = (attemptId) => {
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
              quiz={selectedQuiz}
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
              onSubmit={handleQuizSubmitted}
              onCancel={handleBackToList}
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
                <button
                  onClick={handleCreateQuiz}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium"
                >
                  + 새 퀴즈 만들기
                </button>
              )}
            </div>

            <QuizList
              courseId={courseId}
              userRole={userRole}
              onEdit={handleEditQuiz}
              onManageQuestions={handleManageQuestions}
              onTake={handleTakeQuiz}
              onViewResults={handleViewResults}
              onGrade={handleGradeAttempt}
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

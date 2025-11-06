import React, { useState, useEffect, useRef } from 'react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const QuizTaking = ({ quizId, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [focusLost, setFocusLost] = useState(0);
  const [tabSwitched, setTabSwitched] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    startQuiz();

    // Anti-cheat tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLost(prev => prev + 1);
        trackBehavior({ focus_lost_count: focusLost + 1 });
      }
    };

    const handleBlur = () => {
      setTabSwitched(prev => prev + 1);
      trackBehavior({ tab_switch_count: tabSwitched + 1 });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startQuiz = async () => {
    try {
      setLoading(true);

      // Get quiz details
      const quizResponse = await quizAPI.getQuiz(quizId);
      setQuiz(quizResponse.data);

      // Get questions
      const questionsResponse = await quizAPI.getQuestions(quizId);
      setQuestions(questionsResponse.data);

      // Start attempt
      const attemptResponse = await quizAPI.startQuiz(quizId);
      setAttempt(attemptResponse.data);

      // Set timer if duration is specified
      if (quizResponse.data.duration_minutes) {
        setTimeRemaining(quizResponse.data.duration_minutes * 60);
        startTimer();
      }

      // Initialize answers
      const initialAnswers = {};
      questionsResponse.data.forEach(q => {
        initialAnswers[q.id] = null;
      });
      setAnswers(initialAnswers);

    } catch (err) {
      setError(err.response?.data?.detail || '퀴즈를 시작할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const trackBehavior = async (data) => {
    if (attempt) {
      try {
        await quizAPI.trackBehavior(attempt.id, data);
      } catch (err) {
        console.error('Failed to track behavior:', err);
      }
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    if (!window.confirm('퀴즈를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
      return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer || {}
      }));

      const response = await quizAPI.submitQuiz(attempt.id, {
        answers: answersArray
      });

      onComplete?.(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || '제출에 실패했습니다.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question, index) => {
    const answer = answers[question.id];

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {index + 1}. {question.question_text}
              </h3>
              <span className="text-sm text-gray-500">{question.points}점</span>
            </div>
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={answer?.selected === option.id}
                    onChange={(e) => handleAnswerChange(question.id, { selected: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3">{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {index + 1}. {question.question_text}
              </h3>
              <span className="text-sm text-gray-500">{question.points}점</span>
            </div>
            <div className="space-y-2">
              {['true', 'false'].map((value) => (
                <label
                  key={value}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={answer?.value === value}
                    onChange={(e) => handleAnswerChange(question.id, { value: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3">{value === 'true' ? 'O (참)' : 'X (거짓)'}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {index + 1}. {question.question_text}
              </h3>
              <span className="text-sm text-gray-500">{question.points}점</span>
            </div>
            <input
              type="text"
              value={answer?.text || ''}
              onChange={(e) => handleAnswerChange(question.id, { text: e.target.value })}
              placeholder="답을 입력하세요"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'essay':
        return (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {index + 1}. {question.question_text}
              </h3>
              <span className="text-sm text-gray-500">{question.points}점</span>
            </div>
            <textarea
              value={answer?.text || ''}
              onChange={(e) => handleAnswerChange(question.id, { text: e.target.value })}
              placeholder="답을 작성하세요"
              rows={6}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !attempt) return <ErrorAlert message={error} />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{quiz?.title}</h1>
            <p className="text-gray-600 mt-1">
              총 {questions.length}문제 · {quiz?.total_points}점
            </p>
          </div>

          {timeRemaining !== null && (
            <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Anti-cheat warning */}
        {(focusLost > 0 || tabSwitched > 0) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ 화면 이탈 감지: 포커스 이탈 {focusLost}회, 탭 전환 {tabSwitched}회
            </p>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Questions */}
      <div className="mb-6">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Submit Button */}
      <div className="bg-white p-6 rounded-lg shadow sticky bottom-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            답변 완료: {Object.values(answers).filter(a => a !== null && (a.selected || a.value || a.text)).length} / {questions.length}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>

      {/* Warning overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-4 right-4 bg-red-50 border border-red-200 p-4 rounded-lg pointer-events-auto">
          <p className="text-sm text-red-800 font-medium">⚠️ 화면을 벗어나지 마세요</p>
          <p className="text-xs text-red-600 mt-1">모든 행동이 기록됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;

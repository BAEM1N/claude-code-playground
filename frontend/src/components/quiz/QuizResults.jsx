import React, { useState, useEffect } from 'react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const QuizResults = ({ attemptId, onRetake }) => {
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [attemptRes, answersRes] = await Promise.all([
        quizAPI.getAttempt(attemptId),
        quizAPI.getAttemptAnswers(attemptId),
      ]);

      setAttempt(attemptRes.data);
      setAnswers(answersRes.data);

      // Get quiz details
      if (attemptRes.data.quiz_id) {
        const quizRes = await quizAPI.getQuiz(attemptRes.data.quiz_id);
        setQuiz(quizRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || '결과를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!attempt) return null;

  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.is_correct).length;
  const totalPoints = answers.reduce((sum, a) => sum + a.question.points, 0);
  const earnedPoints = answers.reduce((sum, a) => sum + (a.points_earned || 0), 0);
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints * 100) : 0;

  const isPassed = quiz?.passing_score ? percentage >= quiz.passing_score : null;

  const getResultColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultMessage = () => {
    if (percentage >= 90) return '🎉 훌륭해요!';
    if (percentage >= 70) return '👍 잘했어요!';
    if (percentage >= 50) return '💪 조금 더 노력해요!';
    return '📚 다시 공부하고 재도전하세요!';
  };

  const renderAnswerReview = (answer, index) => {
    const question = answer.question;

    const getAnswerStatus = () => {
      if (!answer.is_graded) return { color: 'bg-gray-100 border-gray-300', text: '채점 대기' };
      if (answer.is_correct) return { color: 'bg-green-50 border-green-300', text: '정답' };
      if (answer.points_earned > 0) return { color: 'bg-blue-50 border-blue-300', text: '부분 정답' };
      return { color: 'bg-red-50 border-red-300', text: '오답' };
    };

    const status = getAnswerStatus();

    return (
      <div key={answer.id} className={`p-4 rounded-lg border-2 ${status.color}`}>
        {/* Question Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-600">문제 {index + 1}</span>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                answer.is_correct ? 'bg-green-200 text-green-800' :
                answer.points_earned > 0 ? 'bg-blue-200 text-blue-800' :
                'bg-red-200 text-red-800'
              }`}>
                {status.text}
              </span>
            </div>
            <p className="text-base">{question.question_text}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-sm text-gray-600">획득 점수</div>
            <div className="font-bold text-lg">
              {answer.points_earned || 0} / {question.points}
            </div>
          </div>
        </div>

        {/* Answer Content */}
        {quiz?.show_correct_answers && (
          <div className="space-y-2 mb-3">
            {renderAnswerContent(answer)}
          </div>
        )}

        {/* Explanation */}
        {quiz?.show_correct_answers && question.explanation && (
          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
            <strong className="text-blue-900">💡 해설:</strong>
            <p className="text-blue-800 mt-1">{question.explanation}</p>
          </div>
        )}

        {/* Feedback */}
        {answer.feedback && (
          <div className="mt-3 p-3 bg-purple-50 rounded text-sm">
            <strong className="text-purple-900">📝 교수 피드백:</strong>
            <p className="text-purple-800 mt-1">{answer.feedback}</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnswerContent = (answer) => {
    const question = answer.question;

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-1">
            {question.options?.map((option) => {
              const isSelected = answer.selected_option === option.id;
              const isCorrect = option.is_correct;

              return (
                <div
                  key={option.id}
                  className={`p-2 rounded text-sm ${
                    isCorrect ? 'bg-green-100 border border-green-300' :
                    isSelected ? 'bg-red-100 border border-red-300' :
                    'bg-gray-50'
                  }`}
                >
                  <span className="font-semibold">{option.id.toUpperCase()}.</span> {option.text}
                  {isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ 정답</span>}
                  {isSelected && !isCorrect && <span className="ml-2 text-red-600 font-semibold">✗ 선택함</span>}
                  {isSelected && isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ 선택함</span>}
                </div>
              );
            })}
          </div>
        );

      case 'true_false':
        const correctAnswer = question.correct_answer === 'true' ? 'O (참)' : 'X (거짓)';
        const studentAnswer = answer.selected_option === 'true' ? 'O (참)' : 'X (거짓)';

        return (
          <div className="space-y-1 text-sm">
            <div className={`p-2 rounded ${answer.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>내 답변:</strong> {studentAnswer}
              {answer.is_correct ?
                <span className="ml-2 text-green-600 font-semibold">✓</span> :
                <span className="ml-2 text-red-600 font-semibold">✗</span>
              }
            </div>
            {!answer.is_correct && (
              <div className="p-2 rounded bg-green-100">
                <strong>정답:</strong> {correctAnswer}
              </div>
            )}
          </div>
        );

      case 'short_answer':
        return (
          <div className="space-y-1 text-sm">
            <div className={`p-2 rounded ${answer.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>내 답변:</strong> {answer.text_answer || '(답변 없음)'}
              {answer.is_correct ?
                <span className="ml-2 text-green-600 font-semibold">✓</span> :
                <span className="ml-2 text-red-600 font-semibold">✗</span>
              }
            </div>
            {!answer.is_correct && (
              <div className="p-2 rounded bg-green-100">
                <strong>정답:</strong> {question.correct_answer}
                {question.case_sensitive && <span className="text-xs ml-2">(대소문자 구분)</span>}
              </div>
            )}
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-1 text-sm">
            <div className="p-3 bg-white border rounded">
              <strong>내 답변:</strong>
              <div className="mt-1 whitespace-pre-wrap">
                {answer.text_answer || '(답변 없음)'}
              </div>
            </div>
            {!answer.is_graded && (
              <div className="text-xs text-gray-600 italic">
                ⏳ 교수님의 채점을 기다리고 있습니다.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const allGraded = answers.every(a => a.is_graded);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-2">퀴즈 결과</h2>
        <div className={`text-6xl font-bold mb-2 ${getResultColor()}`}>
          {percentage.toFixed(1)}%
        </div>
        <div className="text-2xl mb-4">{getResultMessage()}</div>

        {isPassed !== null && (
          <div className={`inline-block px-6 py-2 rounded-full font-semibold ${
            isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPassed ? '✓ 합격' : '✗ 불합격'} (합격선: {quiz.passing_score}%)
          </div>
        )}

        {!allGraded && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
            ⏳ 일부 문제가 아직 채점되지 않았습니다. 점수가 변경될 수 있습니다.
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-gray-600 mb-1">총 문항</div>
          <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-gray-600 mb-1">정답</div>
          <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-gray-600 mb-1">획득 점수</div>
          <div className="text-2xl font-bold text-blue-600">{earnedPoints.toFixed(1)}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-gray-600 mb-1">총 점수</div>
          <div className="text-2xl font-bold text-purple-600">{totalPoints}</div>
        </div>
      </div>

      {/* Time Info */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">시작 시간:</span>
            <span className="ml-2 font-semibold">
              {new Date(attempt.started_at).toLocaleString('ko-KR')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">제출 시간:</span>
            <span className="ml-2 font-semibold">
              {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('ko-KR') : '미제출'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">소요 시간:</span>
            <span className="ml-2 font-semibold">
              {attempt.time_taken ? `${Math.floor(attempt.time_taken / 60)}분 ${attempt.time_taken % 60}초` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      {quiz?.show_correct_answers || quiz?.show_results_immediately ? (
        <div className="space-y-3">
          <h3 className="text-xl font-bold">문제별 결과</h3>
          {answers.map((answer, index) => renderAnswerReview(answer, index))}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
          <p>정답 및 해설은 교수님의 설정에 따라 공개됩니다.</p>
        </div>
      )}

      {/* Retake Option */}
      {quiz && onRetake && quiz.max_attempts > attempt.attempt_number && (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">
            재시도 가능: {attempt.attempt_number} / {quiz.max_attempts}회
          </p>
          <button
            onClick={onRetake}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            다시 시도하기
          </button>
        </div>
      )}

      {/* No retake available */}
      {quiz && quiz.max_attempts <= attempt.attempt_number && (
        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600 text-sm">
          최대 시도 횟수에 도달했습니다.
        </div>
      )}
    </div>
  );
};

export default QuizResults;

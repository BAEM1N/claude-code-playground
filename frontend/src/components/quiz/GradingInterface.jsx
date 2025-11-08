import React, { useState, useEffect } from 'react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const GradingInterface = ({ quizId, attemptId }) => {
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      const [attemptRes, answersRes] = await Promise.all([
        quizAPI.getAttempt(attemptId),
        quizAPI.getAttemptAnswers(attemptId),
      ]);
      setAttempt(attemptRes.data);
      setAnswers(answersRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || '채점 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeAnswer = async (answerId, points, feedback) => {
    try {
      setSaving(true);
      await quizAPI.gradeAnswer(answerId, {
        points_earned: points,
        feedback: feedback,
      });

      // Refresh attempt details to get updated score
      await fetchAttemptDetails();
    } catch (err) {
      alert(err.response?.data?.detail || '채점에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocalGradeUpdate = (answerId, field, value) => {
    setAnswers(prev => prev.map(answer =>
      answer.id === answerId
        ? { ...answer, [field]: value }
        : answer
    ));
  };

  const getAnswerStatusColor = (answer) => {
    if (!answer.is_graded) return 'bg-yellow-50 border-yellow-300';
    if (answer.points_earned === answer.question.points) return 'bg-green-50 border-green-300';
    if (answer.points_earned === 0) return 'bg-red-50 border-red-300';
    return 'bg-blue-50 border-blue-300'; // Partial credit
  };

  const renderAnswerContent = (answer) => {
    const question = answer.question;

    switch (question.question_type) {
      case 'multiple_choice':
        const selectedOption = question.options?.find(opt => opt.id === answer.selected_option);
        const correctOption = question.options?.find(opt => opt.is_correct);
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>학생 답변:</strong> {selectedOption?.text || answer.selected_option}
              {answer.is_correct && <span className="ml-2 text-green-600">✓ 정답</span>}
              {!answer.is_correct && <span className="ml-2 text-red-600">✗ 오답</span>}
            </div>
            {correctOption && (
              <div className="text-sm text-green-700">
                <strong>정답:</strong> {correctOption.text}
              </div>
            )}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>학생 답변:</strong> {answer.selected_option === 'true' ? 'O (참)' : 'X (거짓)'}
              {answer.is_correct && <span className="ml-2 text-green-600">✓ 정답</span>}
              {!answer.is_correct && <span className="ml-2 text-red-600">✗ 오답</span>}
            </div>
            <div className="text-sm text-green-700">
              <strong>정답:</strong> {question.correct_answer === 'true' ? 'O (참)' : 'X (거짓)'}
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>학생 답변:</strong> {answer.text_answer || '(답변 없음)'}
              {answer.is_correct && <span className="ml-2 text-green-600">✓ 정답</span>}
              {answer.is_correct === false && <span className="ml-2 text-red-600">✗ 오답</span>}
            </div>
            <div className="text-sm text-green-700">
              <strong>정답:</strong> {question.correct_answer}
              {question.case_sensitive && <span className="text-xs ml-2">(대소문자 구분)</span>}
            </div>
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>학생 답변:</strong>
              <div className="mt-1 p-3 bg-white border rounded whitespace-pre-wrap">
                {answer.text_answer || '(답변 없음)'}
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-sm text-gray-500">알 수 없는 문제 유형</div>;
    }
  };

  const needsManualGrading = (answer) => {
    return answer.question.question_type === 'essay' ||
           (answer.question.question_type === 'short_answer' && !answer.is_graded);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!attempt) return null;

  const totalQuestions = answers.length;
  const gradedAnswers = answers.filter(a => a.is_graded).length;
  const totalEarned = answers.reduce((sum, a) => sum + (a.points_earned || 0), 0);
  const totalPossible = answers.reduce((sum, a) => sum + a.question.points, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Attempt Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">채점 인터페이스</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">학생</div>
            <div className="font-semibold">{attempt.student_name || 'Unknown'}</div>
          </div>

          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">채점 진행</div>
            <div className="font-semibold">{gradedAnswers} / {totalQuestions}</div>
          </div>

          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-gray-600">획득 점수</div>
            <div className="font-semibold">{totalEarned.toFixed(1)} / {totalPossible}</div>
          </div>

          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-gray-600">제출 시간</div>
            <div className="font-semibold text-sm">
              {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('ko-KR') : 'N/A'}
            </div>
          </div>
        </div>

        {/* Anti-cheat warnings */}
        {(attempt.focus_lost_count > 5 || attempt.tab_switch_count > 3) && (
          <div className="bg-red-50 border border-red-300 rounded p-3 text-sm">
            <strong>⚠️ 부정행위 의심:</strong>
            <div className="mt-1">
              포커스 이탈: {attempt.focus_lost_count}회 | 탭 전환: {attempt.tab_switch_count}회
            </div>
          </div>
        )}
      </div>

      {/* Answers List */}
      <div className="space-y-4">
        {answers.map((answer, index) => (
          <div
            key={answer.id}
            className={`bg-white p-5 rounded-lg shadow border-2 ${getAnswerStatusColor(answer)}`}
          >
            {/* Question Header */}
            <div className="mb-3 pb-3 border-b">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-600">문제 {index + 1}</span>
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                    {answer.question.question_type}
                  </span>
                  <h3 className="text-lg mt-1">{answer.question.question_text}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">배점</div>
                  <div className="font-bold">{answer.question.points}점</div>
                </div>
              </div>
            </div>

            {/* Answer Content */}
            <div className="mb-4">
              {renderAnswerContent(answer)}
            </div>

            {/* Explanation */}
            {answer.question.explanation && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                <strong>해설:</strong> {answer.question.explanation}
              </div>
            )}

            {/* Manual Grading Section */}
            {needsManualGrading(answer) && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      부여 점수 *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={answer.question.points}
                      step="0.1"
                      value={answer.points_earned || 0}
                      onChange={(e) => handleLocalGradeUpdate(answer.id, 'points_earned', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600">
                      최대 {answer.question.points}점
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    피드백 (선택)
                  </label>
                  <textarea
                    value={answer.feedback || ''}
                    onChange={(e) => handleLocalGradeUpdate(answer.id, 'feedback', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="학생에게 제공할 피드백을 입력하세요"
                  />
                </div>

                <button
                  onClick={() => handleGradeAnswer(answer.id, answer.points_earned, answer.feedback)}
                  disabled={saving}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                >
                  {saving ? '저장 중...' : '채점 완료'}
                </button>
              </div>
            )}

            {/* Already Graded */}
            {answer.is_graded && !needsManualGrading(answer) && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <strong>획득 점수:</strong> {answer.points_earned} / {answer.question.points}
                  </div>
                  <div className="text-xs text-gray-500">자동 채점 완료</div>
                </div>
                {answer.feedback && (
                  <div className="mt-2 text-sm text-gray-700">
                    <strong>피드백:</strong> {answer.feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Final Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">최종 점수</div>
            <div className="text-3xl font-bold text-blue-600">
              {totalEarned.toFixed(1)} / {totalPossible}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ({((totalEarned / totalPossible) * 100).toFixed(1)}%)
            </div>
          </div>

          {gradedAnswers === totalQuestions ? (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
              ✓ 채점 완료
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-medium">
              {totalQuestions - gradedAnswers}개 문제 채점 필요
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingInterface;

// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuiz, useCreateQuiz, useUpdateQuiz } from '../../hooks/useQuizzes';
import ErrorAlert from '../common/ErrorAlert';

const QuizForm = ({ courseId, quizId = null, onSuccess, onCancel }) => {
  const { data: existingQuiz } = useQuiz(quizId);
  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quiz_type: 'quiz',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    total_points: 100,
    passing_score: 60,
    randomize_questions: false,
    randomize_options: false,
    show_results_immediately: true,
    allow_review: true,
    max_attempts: 1,
  });

  useEffect(() => {
    if (existingQuiz) {
      setFormData({
        ...existingQuiz,
        start_time: new Date(existingQuiz.start_time).toISOString().slice(0, 16),
        end_time: new Date(existingQuiz.end_time).toISOString().slice(0, 16),
      });
    }
  }, [existingQuiz]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const data = {
        ...formData,
        course_id: courseId,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (quizId) {
        await updateMutation.mutateAsync({ quizId, quizData: data });
      } else {
        await createMutation.mutateAsync(data);
      }

      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || '퀴즈 저장에 실패했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {quizId ? '퀴즈 수정' : '새 퀴즈 만들기'}
      </h2>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="예: 1주차 퀴즈"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="퀴즈에 대한 설명을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              유형 *
            </label>
            <select
              name="quiz_type"
              value={formData.quiz_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="quiz">퀴즈</option>
              <option value="midterm">중간고사</option>
              <option value="final">기말고사</option>
              <option value="practice">연습문제</option>
            </select>
          </div>
        </div>

        {/* Time Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">시간 설정</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간 *
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간 *
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제한 시간 (분)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              비워두면 제한 시간 없음
            </p>
          </div>
        </div>

        {/* Scoring */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">채점</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                총 점수 *
              </label>
              <input
                type="number"
                name="total_points"
                value={formData.total_points}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                합격 점수
              </label>
              <input
                type="number"
                name="passing_score"
                value={formData.passing_score}
                onChange={handleChange}
                min="0"
                max={formData.total_points}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">옵션</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 시도 횟수 *
            </label>
            <input
              type="number"
              name="max_attempts"
              value={formData.max_attempts}
              onChange={handleChange}
              required
              min="1"
              max="10"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="randomize_questions"
                checked={formData.randomize_questions}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">문제 순서 무작위</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="randomize_options"
                checked={formData.randomize_options}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">선택지 순서 무작위</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="show_results_immediately"
                checked={formData.show_results_immediately}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">제출 즉시 결과 표시</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="allow_review"
                checked={formData.allow_review}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">답안 복습 허용</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {(createMutation.isLoading || updateMutation.isLoading) ? '저장 중...' : quizId ? '수정하기' : '생성하기'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuizForm;

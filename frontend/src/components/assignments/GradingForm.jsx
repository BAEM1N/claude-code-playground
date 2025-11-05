/**
 * Grading Form Component (Instructor/Assistant)
 */
import React, { useState, useEffect } from 'react';
import { assignmentsAPI } from '../../services/api';

const GradingForm = ({ submission, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    points: 0,
    max_points: 100,
    feedback: '',
    letter_grade: '',
    is_released: false,
  });

  useEffect(() => {
    if (submission?.grade) {
      setFormData({
        points: submission.grade.points,
        max_points: submission.grade.max_points,
        feedback: submission.grade.feedback || '',
        letter_grade: submission.grade.letter_grade || '',
        is_released: submission.grade.is_released,
      });
    }
  }, [submission]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const calculatePercentage = () => {
    if (formData.max_points === 0) return 0;
    return ((formData.points / formData.max_points) * 100).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (submission.grade) {
        await assignmentsAPI.updateGrade(submission.id, formData);
      } else {
        await assignmentsAPI.gradeSubmission(submission.id, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {submission.grade ? '채점 수정' : '채점하기'}
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              받은 점수 *
            </label>
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleChange}
              required
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              만점 *
            </label>
            <input
              type="number"
              name="max_points"
              value={formData.max_points}
              onChange={handleChange}
              required
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Calculated Percentage */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium">백분율:</span>
            <span className="text-2xl font-bold text-blue-900">
              {calculatePercentage()}%
            </span>
          </div>
        </div>

        {/* Letter Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            등급 (선택사항)
          </label>
          <select
            name="letter_grade"
            value={formData.letter_grade}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택 안 함</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="B-">B-</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="C-">C-</option>
            <option value="D+">D+</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
        </div>

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            피드백
          </label>
          <textarea
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="학생에게 전달할 피드백을 작성하세요..."
          />
        </div>

        {/* Release Toggle */}
        <div className="flex items-center bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <input
            type="checkbox"
            name="is_released"
            checked={formData.is_released}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-yellow-900">
            <span className="font-medium">채점 결과 공개</span>
            <span className="block text-xs text-yellow-700 mt-1">
              체크하면 학생이 즉시 결과를 볼 수 있습니다
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : submission.grade ? '수정하기' : '채점 완료'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradingForm;

/**
 * Grading Form Component (Instructor/Assistant)
 */
import React, { useState, useEffect } from 'react';
import { assignmentsAPI } from '../../services/api';
import { ErrorAlert } from '../common/ErrorAlert';
import { formatPercentage } from '../../utils/formatters';

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

  // Rubric-based grading
  const [rubricScores, setRubricScores] = useState({});
  const hasRubric = submission?.assignment?.rubric && submission.assignment.rubric.criteria?.length > 0;

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

    // Initialize rubric scores if rubric exists
    if (hasRubric) {
      const initialScores = {};
      submission.assignment.rubric.criteria.forEach(criterion => {
        initialScores[criterion.id] = 0;
      });
      setRubricScores(initialScores);
      setFormData(prev => ({ ...prev, max_points: submission.assignment.max_points }));
    }
  }, [submission, hasRubric]);

  // Auto-calculate total points from rubric scores
  useEffect(() => {
    if (hasRubric && Object.keys(rubricScores).length > 0) {
      const totalPoints = Object.values(rubricScores).reduce((sum, score) => sum + (parseFloat(score) || 0), 0);
      setFormData(prev => ({ ...prev, points: totalPoints }));
    }
  }, [rubricScores, hasRubric]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleRubricScoreChange = (criterionId, value) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionId]: parseFloat(value) || 0
    }));
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

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rubric-based Grading */}
        {hasRubric ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">채점 기준표 기반 채점</h4>
              <p className="text-xs text-blue-700">
                각 항목별로 점수를 입력하면 자동으로 합산됩니다.
              </p>
            </div>

            {submission.assignment.rubric.criteria.map((criterion, index) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                      <h5 className="text-sm font-semibold text-gray-900">{criterion.name}</h5>
                    </div>
                    {criterion.description && (
                      <p className="text-xs text-gray-600 mt-1">{criterion.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    최대 {criterion.max_points}점
                  </span>
                </div>

                <div className="mt-3">
                  <input
                    type="number"
                    value={rubricScores[criterion.id] || 0}
                    onChange={(e) => handleRubricScoreChange(criterion.id, e.target.value)}
                    min="0"
                    max={criterion.max_points}
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`0 ~ ${criterion.max_points}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Manual Points Entry */
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
        )}

        {/* Calculated Percentage */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium">백분율:</span>
            <span className="text-2xl font-bold text-blue-900">
              {formatPercentage(formData.points / formData.max_points)}
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

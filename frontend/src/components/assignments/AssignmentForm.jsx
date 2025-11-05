/**
 * Assignment Form Component (Create/Edit)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI } from '../../services/api';

const AssignmentForm = ({ courseId, assignmentId, initialData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    start_date: '',
    max_points: 100,
    late_submission_allowed: false,
    late_penalty_percent: 0,
    allow_resubmission: false,
    show_solutions_after_due: false,
    is_published: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        due_date: initialData.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        due_date: new Date(formData.due_date).toISOString(),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      };

      if (assignmentId) {
        // Update existing assignment
        await assignmentsAPI.updateAssignment(assignmentId, submitData);
      } else {
        // Create new assignment
        await assignmentsAPI.createAssignment(courseId, submitData);
      }

      navigate(`/courses/${courseId}/assignments`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {assignmentId ? '과제 수정' : '새 과제 만들기'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과제 제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 중간고사 프로젝트"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과제 설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="과제에 대한 간단한 설명"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 지침
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="상세한 과제 요구사항 및 제출 방법"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마감 날짜 *
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배점 *
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

          {/* Late Submission */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="late_submission_allowed"
                checked={formData.late_submission_allowed}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                늦은 제출 허용
              </label>
            </div>

            {formData.late_submission_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  늦은 제출 감점 (%)
                </label>
                <input
                  type="number"
                  name="late_penalty_percent"
                  value={formData.late_penalty_percent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Other Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="allow_resubmission"
                checked={formData.allow_resubmission}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                재제출 허용
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="show_solutions_after_due"
                checked={formData.show_solutions_after_due}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                마감 후 해답 공개
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                <span className="font-medium">즉시 공개</span>
                <span className="text-gray-500 text-xs ml-1">
                  (체크하지 않으면 나중에 공개 가능)
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : assignmentId ? '수정하기' : '과제 만들기'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;

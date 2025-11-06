import React, { useState } from 'react';
import { attendanceAPI } from '../../services/api';
import ErrorAlert from '../common/ErrorAlert';

const AttendanceSessionForm = ({ courseId, sessionId = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    start_time: '',
    end_time: '',
    allow_late_minutes: 10,
    password: '',
    location_required: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        course_id: courseId,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (sessionId) {
        await attendanceAPI.updateSession(sessionId, data);
      } else {
        await attendanceAPI.createSession(data);
      }

      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || '출석 세션 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {sessionId ? '출석 세션 수정' : '새 출석 세션'}
      </h2>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            세션 제목 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="예: 1주차 강의 출석"
          />
        </div>

        {/* Time Range */}
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

        {/* Late Minutes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            지각 허용 시간 (분)
          </label>
          <input
            type="number"
            name="allow_late_minutes"
            value={formData.allow_late_minutes}
            onChange={handleChange}
            min="0"
            max="60"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            시작 시간 이후 이 시간 동안은 지각으로 처리됩니다.
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            출석 비밀번호 (선택)
          </label>
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호를 설정하면 학생들이 입력해야 합니다"
          />
        </div>

        {/* Location Required */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="location_required"
            checked={formData.location_required}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">
            위치 기반 출석 체크 활성화
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '저장 중...' : sessionId ? '수정하기' : '생성하기'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AttendanceSessionForm;

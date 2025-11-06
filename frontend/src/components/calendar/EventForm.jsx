import React, { useState } from 'react';
import { calendarAPI } from '../../services/api';
import ErrorAlert from '../common/ErrorAlert';

const EventForm = ({ event = null, courseId = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(event || {
    event_type: 'personal',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    meeting_url: '',
    reminder_minutes: 30,
    is_recurring: false,
    recurrence_rule: '',
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
        end_time: formData.all_day ? null : new Date(formData.end_time).toISOString(),
      };

      if (event) {
        await calendarAPI.updateEvent(event.id, data);
      } else {
        await calendarAPI.createEvent(data);
      }

      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || '일정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const eventTypes = courseId
    ? [
        { value: 'class', label: '강의' },
        { value: 'assignment', label: '과제' },
        { value: 'quiz', label: '퀴즈' },
        { value: 'exam', label: '시험' },
        { value: 'office_hours', label: '면담 시간' },
        { value: 'holiday', label: '휴일' },
      ]
    : [{ value: 'personal', label: '개인 일정' }];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {event ? '일정 수정' : '새 일정 추가'}
      </h2>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            일정 유형 *
          </label>
          <select
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
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
            placeholder="일정 제목을 입력하세요"
          />
        </div>

        {/* Description */}
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
            placeholder="일정 설명을 입력하세요"
          />
        </div>

        {/* All Day Checkbox */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="all_day"
              checked={formData.all_day}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">종일 일정</span>
          </label>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간 *
            </label>
            <input
              type={formData.all_day ? 'date' : 'datetime-local'}
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!formData.all_day && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간 *
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required={!formData.all_day}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            장소
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="예: 본관 301호"
          />
        </div>

        {/* Meeting URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회의 링크
          </label>
          <input
            type="url"
            name="meeting_url"
            value={formData.meeting_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://zoom.us/j/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Zoom, Google Meet 등의 온라인 회의 링크
          </p>
        </div>

        {/* Reminder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            알림 (분 전)
          </label>
          <select
            name="reminder_minutes"
            value={formData.reminder_minutes}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">알림 없음</option>
            <option value="5">5분 전</option>
            <option value="10">10분 전</option>
            <option value="15">15분 전</option>
            <option value="30">30분 전</option>
            <option value="60">1시간 전</option>
            <option value="1440">1일 전</option>
            <option value="10080">1주일 전</option>
          </select>
        </div>

        {/* Recurring Event */}
        <div>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">반복 일정</span>
          </label>

          {formData.is_recurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                반복 규칙
              </label>
              <select
                name="recurrence_rule"
                value={formData.recurrence_rule}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="FREQ=DAILY">매일</option>
                <option value="FREQ=WEEKLY">매주</option>
                <option value="FREQ=WEEKLY;BYDAY=MO,WE,FR">
                  매주 월/수/금
                </option>
                <option value="FREQ=WEEKLY;BYDAY=TU,TH">매주 화/목</option>
                <option value="FREQ=MONTHLY">매월</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                iCalendar RRULE 형식 (RFC 5545)
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {loading ? '저장 중...' : event ? '수정하기' : '추가하기'}
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

export default EventForm;

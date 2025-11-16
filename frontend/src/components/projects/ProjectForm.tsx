/**
 * Project Form Component
 * 프로젝트 생성 및 수정 폼
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamProjectsAPI } from '../../services/api';

interface ProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  course_id?: string;
}

const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('프로젝트 이름을 입력하세요');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('종료일은 시작일 이후여야 합니다');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await teamProjectsAPI.createProject(formData);
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('프로젝트 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">새 프로젝트 만들기</h1>
        <p className="text-gray-600 mt-2">팀과 협업할 프로젝트를 생성하세요</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            프로젝트 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 웹사이트 리뉴얼 프로젝트"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            프로젝트 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="프로젝트 목표와 주요 내용을 설명하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status and Priority */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              상태
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="planning">계획중</option>
              <option value="in_progress">진행중</option>
              <option value="on_hold">보류</option>
              <option value="completed">완료</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
              우선순위
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">낮음 🟢</option>
              <option value="medium">보통 🟡</option>
              <option value="high">높음 🟠</option>
              <option value="urgent">긴급 🔴</option>
            </select>
          </div>
        </div>

        {/* Start and End Date */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
              시작일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
              종료일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Project Templates (Optional Enhancement) */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📋 프로젝트 템플릿 (선택)</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              type="button"
              className="p-4 bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-lg text-left transition-all group"
            >
              <p className="font-semibold text-gray-900 group-hover:text-indigo-600">🚀 스프린트</p>
              <p className="text-xs text-gray-600 mt-1">2주 단위 개발 사이클</p>
            </button>
            <button
              type="button"
              className="p-4 bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-lg text-left transition-all group"
            >
              <p className="font-semibold text-gray-900 group-hover:text-indigo-600">📚 과제</p>
              <p className="text-xs text-gray-600 mt-1">학습 과제 관리</p>
            </button>
            <button
              type="button"
              className="p-4 bg-white border-2 border-gray-200 hover:border-indigo-500 rounded-lg text-left transition-all group"
            >
              <p className="font-semibold text-gray-900 group-hover:text-indigo-600">🎯 이벤트</p>
              <p className="text-xs text-gray-600 mt-1">단기 이벤트 기획</p>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? '생성 중...' : '프로젝트 생성'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;

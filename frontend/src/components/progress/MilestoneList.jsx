import React, { useState, useEffect } from 'react';
import { progressAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const MilestoneList = ({ courseId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, [courseId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getMilestones(courseId);
      setMilestones(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || '마일스톤을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'locked':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'locked':
        return '🔒';
      default:
        return '⭕';
    }
  };

  const getMilestoneStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'in_progress':
        return '진행 중';
      case 'locked':
        return '잠김';
      default:
        return '미정';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <p>설정된 마일스톤이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-2">🎯 학습 마일스톤</h2>
        <p className="text-purple-100">
          강의의 주요 목표와 진행 상황을 확인하세요
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">전체 진행도</span>
          <span className="text-sm font-semibold text-blue-600">
            {milestones.filter((m) => m.status === 'completed').length} / {milestones.length} 완료
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
            style={{
              width: `${
                (milestones.filter((m) => m.status === 'completed').length / milestones.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex gap-4">
              {/* Timeline Node */}
              <div className="flex-shrink-0 w-16 flex justify-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    milestone.status === 'completed'
                      ? 'bg-green-500 shadow-lg'
                      : milestone.status === 'in_progress'
                      ? 'bg-blue-500 shadow-lg animate-pulse'
                      : 'bg-gray-300'
                  } z-10 border-4 border-white`}
                >
                  {getMilestoneIcon(milestone.status)}
                </div>
              </div>

              {/* Milestone Card */}
              <div
                className={`flex-1 p-4 rounded-lg border-2 ${getMilestoneStatusColor(
                  milestone.status
                )}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{milestone.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          milestone.status === 'completed'
                            ? 'bg-green-200 text-green-800'
                            : milestone.status === 'in_progress'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {getMilestoneStatusText(milestone.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{milestone.description}</p>
                  </div>
                </div>

                {/* Progress Bar (if in progress) */}
                {milestone.status === 'in_progress' &&
                  milestone.progress !== undefined &&
                  milestone.target !== undefined && (
                    <div className="mt-3 mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>진행도</span>
                        <span>
                          {milestone.progress} / {milestone.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (milestone.progress / milestone.target) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* Details */}
                <div className="mt-3 space-y-1 text-sm">
                  {milestone.due_date && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">📅 목표일:</span>
                      <span className="font-semibold">{formatDate(milestone.due_date)}</span>
                    </div>
                  )}

                  {milestone.points_reward && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">🎁 보상:</span>
                      <span className="font-semibold text-yellow-600">
                        +{milestone.points_reward} 포인트
                      </span>
                    </div>
                  )}

                  {milestone.completed_at && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">✅ 완료일:</span>
                      <span className="font-semibold text-green-600">
                        {formatDate(milestone.completed_at)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                {milestone.requirements && milestone.requirements.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-semibold text-gray-700 mb-2">요구사항:</div>
                    <ul className="space-y-1">
                      {milestone.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400">•</span>
                          <span className={req.completed ? 'line-through text-gray-500' : ''}>
                            {req.description}
                          </span>
                          {req.completed && <span className="text-green-600">✓</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unlock Conditions */}
                {milestone.status === 'locked' && milestone.unlock_conditions && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      🔒 잠금 해제 조건:
                    </div>
                    <p className="text-sm text-gray-600">{milestone.unlock_conditions}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Message */}
      {milestones.every((m) => m.status === 'completed') && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-lg text-center text-white">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-2xl font-bold mb-2">축하합니다!</h3>
          <p>모든 마일스톤을 완료했습니다!</p>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;

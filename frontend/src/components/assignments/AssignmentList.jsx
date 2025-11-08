/**
 * Assignment List Component
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssignments } from '../../hooks/useAssignments';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { formatDateTime } from '../../utils/formatters';

const AssignmentList = ({ courseId, role }) => {
  const navigate = useNavigate();
  const isInstructor = role === 'instructor' || role === 'assistant';

  // React Query를 사용한 데이터 페칭 - 자동 캐싱 및 refetch 지원
  const { data: assignments = [], isLoading, error } = useAssignments(
    courseId,
    isInstructor
  );

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return <LoadingSpinner message="과제 목록 로딩 중..." />;
  }

  if (error) {
    return <ErrorAlert message={error?.message || '과제 목록을 불러오는데 실패했습니다.'} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">과제 목록</h2>
        {isInstructor && (
          <button
            onClick={() => navigate(`/courses/${courseId}/assignments/new`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 새 과제 만들기
          </button>
        )}
      </div>

      {/* Assignment Cards */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 등록된 과제가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}`)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    {!assignment.is_published && isInstructor && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        미공개
                      </span>
                    )}
                  </div>

                  {assignment.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">마감:</span>
                      <span
                        className={`font-medium ${
                          isOverdue(assignment.due_date)
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {formatDateTime(assignment.due_date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">배점:</span>
                      <span className="font-medium text-gray-900">
                        {assignment.max_points}점
                      </span>
                    </div>

                    {assignment.late_submission_allowed && (
                      <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                        늦은 제출 허용
                      </span>
                    )}

                    {assignment.allow_resubmission && (
                      <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                        재제출 가능
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {isOverdue(assignment.due_date) ? (
                    <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                      마감
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                      진행중
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;

/**
// @ts-nocheck
 * Assignment Detail Component (Student View)
// @ts-nocheck
 */
// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssignment, useMySubmission } from '../../hooks/useAssignments';
import SubmissionForm from './SubmissionForm';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

const AssignmentDetail = ({ assignmentId, courseId, role }) => {
  const navigate = useNavigate();
  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId);
  const { data: submission, isLoading: submissionLoading, refetch } = useMySubmission(assignmentId);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const isStudent = role === 'student';
  const isInstructor = role === 'instructor' || role === 'assistant';

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const canSubmit = () => {
    if (!assignment) return false;
    const overdue = isOverdue(assignment.due_date);

    if (overdue && !assignment.late_submission_allowed) return false;
    if (submission && !assignment.allow_resubmission) return false;

    return true;
  };

  if (assignmentLoading || submissionLoading) {
    return <LoadingSpinner message="과제 정보 로딩 중..." />;
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">과제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">마감:</span>
                <span className={`font-medium ${isOverdue(assignment.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDateTime(assignment.due_date)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">배점:</span>
                <span className="font-medium text-gray-900">{assignment.max_points}점</span>
              </div>
            </div>
          </div>

          {isInstructor && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                수정
              </button>
              <button
                onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}/submissions`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                제출 현황 보기
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {assignment.late_submission_allowed && (
            <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
              늦은 제출 허용 (-{assignment.late_penalty_percent}%)
            </span>
          )}
          {assignment.allow_resubmission && (
            <span className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full">
              재제출 가능
            </span>
          )}
          {isOverdue(assignment.due_date) && (
            <span className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-full">
              마감됨
            </span>
          )}
        </div>
      </div>

      {/* Description & Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {assignment.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">과제 설명</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}

        {assignment.instructions && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">상세 지침</h2>
            <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {assignment.instructions}
            </div>
          </div>
        )}
      </div>

      {/* Student Submission Section */}
      {isStudent && (
        <>
          {/* Existing Submission */}
          {submission && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">내 제출</h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">제출 시간:</span>
                    <span className="ml-2 font-medium">{formatDateTime(submission.submitted_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">상태:</span>
                    <span className={`ml-2 font-medium ${submission.is_late ? 'text-red-600' : 'text-green-600'}`}>
                      {submission.is_late ? '늦은 제출' : '정상 제출'}
                    </span>
                  </div>
                  {submission.attempt_number > 1 && (
                    <div>
                      <span className="text-gray-500">제출 횟수:</span>
                      <span className="ml-2 font-medium">{submission.attempt_number}회</span>
                    </div>
                  )}
                </div>

                {submission.content && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">제출 내용:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                )}
              </div>

              {/* Grade */}
              {submission.grade && submission.grade.is_released && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">채점 결과</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">점수:</span>
                      <span className="text-2xl font-bold text-blue-900">
                        {submission.grade.points} / {submission.grade.max_points}
                      </span>
                    </div>
                    {submission.grade.percentage && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">백분율:</span>
                        <span className="text-xl font-semibold text-blue-900">
                          {submission.grade.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {submission.grade.feedback && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-blue-800 mb-1">피드백:</p>
                        <p className="text-blue-900 whitespace-pre-wrap">{submission.grade.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button / Form */}
          {canSubmit() && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {showSubmissionForm ? (
                <SubmissionForm
                  assignmentId={assignmentId}
                  onSuccess={() => {
                    setShowSubmissionForm(false);
                    refetch();
                  }}
                  onCancel={() => setShowSubmissionForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowSubmissionForm(true)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {submission ? '재제출하기' : '과제 제출하기'}
                </button>
              )}
            </div>
          )}

          {!canSubmit() && !submission && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                {isOverdue(assignment.due_date)
                  ? '마감일이 지났습니다. 늦은 제출이 허용되지 않습니다.'
                  : '제출할 수 없습니다.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssignmentDetail;

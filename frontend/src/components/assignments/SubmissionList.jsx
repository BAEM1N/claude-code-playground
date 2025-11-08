/**
 * Submission List Component (Instructor/Assistant View)
 */
import React, { useState } from 'react';
import { useSubmissions } from '../../hooks/useAssignments';
import GradingForm from './GradingForm';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { formatDateTime } from '../../utils/formatters';

const SubmissionList = ({ assignmentId }) => {
  const { submissions, loading, error, refetch } = useSubmissions(assignmentId);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingForm, setShowGradingForm] = useState(false);

  const getStatusBadge = (submission) => {
    if (submission.grade && submission.grade.is_released) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
          채점 완료
        </span>
      );
    } else if (submission.grade) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
          채점됨 (미공개)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          제출됨
        </span>
      );
    }
  };

  const handleGradeClick = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingForm(true);
  };

  const handleGradingSuccess = () => {
    setShowGradingForm(false);
    setSelectedSubmission(null);
    refetch();
  };

  if (loading) {
    return <LoadingSpinner message="제출 현황 로딩 중..." />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">제출 현황</h2>
          <p className="text-gray-600 mt-1">총 {submissions.length}개 제출</p>
        </div>
      </div>

      {/* Grading Form Modal */}
      {showGradingForm && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Submission Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">제출 내용</h4>
                {selectedSubmission.content && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">
                    {selectedSubmission.content}
                  </p>
                )}
                {selectedSubmission.submission_text && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-500">추가 코멘트:</p>
                    <p className="text-gray-700">{selectedSubmission.submission_text}</p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600">
                  제출 시간: {formatDateTime(selectedSubmission.submitted_at)}
                </div>
              </div>

              {/* Grading Form */}
              <GradingForm
                submission={selectedSubmission}
                onSuccess={handleGradingSuccess}
                onCancel={() => {
                  setShowGradingForm(false);
                  setSelectedSubmission(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 제출된 과제가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학생
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      학생 {submission.student_id.slice(0, 8)}
                    </div>
                    {submission.attempt_number > 1 && (
                      <div className="text-xs text-gray-500">
                        {submission.attempt_number}회 제출
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTime(submission.submitted_at)}
                    </div>
                    {submission.is_late && (
                      <div className="text-xs text-red-600">늦은 제출</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.grade ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {submission.grade.points} / {submission.grade.max_points}
                        </div>
                        <div className="text-gray-500">
                          {submission.grade.percentage?.toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">미채점</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleGradeClick(submission)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {submission.grade ? '수정' : '채점'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionList;

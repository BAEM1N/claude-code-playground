/**
 * Submission List Page (Instructor/Assistant)
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubmissionList from '../components/assignments/SubmissionList';
import { useAssignment, useAssignmentStats } from '../hooks/useAssignments';

const SubmissionListPage = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { assignment, loading: assignmentLoading } = useAssignment(assignmentId);
  const { stats, loading: statsLoading } = useAssignmentStats(assignmentId);

  if (assignmentLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <button
          onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}`)}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← 과제로 돌아가기
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {assignment?.title}
        </h1>

        {/* Statistics */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">총 제출</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {stats.total_submissions}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">채점 완료</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {stats.graded_submissions}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">평균 점수</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {stats.average_score ? `${stats.average_score.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission List */}
      <SubmissionList assignmentId={assignmentId} />
    </div>
  );
};

export default SubmissionListPage;

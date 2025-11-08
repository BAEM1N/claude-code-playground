/**
 * Assignment Statistics Dashboard Component
 */
import React from 'react';
import { useAssignmentStats } from '../../hooks/useAssignments';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { formatPercentage } from '../../utils/formatters';

const AssignmentStatsDashboard = ({ assignmentId }) => {
  const { stats, loading, error } = useAssignmentStats(assignmentId);

  if (loading) {
    return <LoadingSpinner message="통계 로딩 중..." />;
  }

  if (error) {
    return <ErrorAlert message="통계를 불러오는데 실패했습니다." />;
  }

  if (!stats) return null;

  // Calculate grade distribution
  const getGradeDistribution = () => {
    const distribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

    if (stats.submissions && stats.submissions.length > 0) {
      stats.submissions.forEach(submission => {
        if (submission.grade && submission.grade.letter_grade) {
          const grade = submission.grade.letter_grade[0]; // Get first letter (A+, A, A- all count as A)
          if (distribution.hasOwnProperty(grade)) {
            distribution[grade]++;
          }
        }
      });
    }

    return distribution;
  };

  const gradeDistribution = getGradeDistribution();
  const maxCount = Math.max(...Object.values(gradeDistribution), 1);

  // Calculate submission stats
  const totalStudents = stats.total_submissions || 0;
  const submittedCount = stats.submissions?.filter(s => s.submitted_at).length || 0;
  const gradedCount = stats.graded_count || 0;
  const submissionRate = totalStudents > 0 ? formatPercentage(submittedCount / totalStudents, { multiply: true }) : '0.0%';
  const gradingRate = submittedCount > 0 ? formatPercentage(gradedCount / submittedCount, { multiply: true }) : '0.0%';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 제출</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{submittedCount}/{totalStudents}</p>
              <p className="text-xs text-gray-500 mt-1">{submissionRate}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">채점 완료</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{gradedCount}/{submittedCount}</p>
              <p className="text-xs text-gray-500 mt-1">{gradingRate}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 점수</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.average_score ? stats.average_score.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.average_score && stats.submissions?.[0]?.assignment?.max_points
                  ? formatPercentage(stats.average_score / stats.submissions[0].assignment.max_points, { multiply: true })
                  : ''}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">최고 점수</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.highest_score !== undefined ? stats.highest_score.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                최저: {stats.lowest_score !== undefined ? stats.lowest_score.toFixed(1) : '-'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">성적 분포</h3>

        {gradedCount === 0 ? (
          <div className="text-center py-8 text-gray-500">
            채점된 제출물이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(gradeDistribution).map(([grade, count]) => {
              const percentage = gradedCount > 0 ? formatPercentage(count / gradedCount, { multiply: true }) : '0.0%';
              const barWidth = maxCount > 0 ? (count / maxCount * 100) : 0;

              const gradeColors = {
                'A': 'bg-green-500',
                'B': 'bg-blue-500',
                'C': 'bg-yellow-500',
                'D': 'bg-orange-500',
                'F': 'bg-red-500'
              };

              return (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 w-8">{grade}</span>
                      <span className="text-xs text-gray-500">
                        {count}명 ({percentage})
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full ${gradeColors[grade]} transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${barWidth}%` }}
                    >
                      {count > 0 && (
                        <span className="text-xs font-medium text-white">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Timeline */}
      {stats.submissions && stats.submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제출 현황</h3>

          <div className="space-y-2">
            {stats.submissions.slice(0, 5).map((submission, index) => (
              <div key={submission.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {submission.student?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.student?.name || '익명'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString('ko-KR')
                        : '미제출'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {submission.grade ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {submission.grade.points}/{submission.grade.max_points}
                    </span>
                  ) : submission.submitted_at ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      채점 대기
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                      미제출
                    </span>
                  )}
                </div>
              </div>
            ))}

            {stats.submissions.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                외 {stats.submissions.length - 5}명
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentStatsDashboard;

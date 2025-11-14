/**
// @ts-nocheck
 * Dashboard Page Component
// @ts-nocheck
 * Main landing page showing course overview, recent activity, and notifications
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useCourse';
import { useMyAIUsageStats } from '../hooks/useAI';
import { useLearningPathRecommendations } from '../hooks/useLearningPaths';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { data: courses, isLoading, error } = useCourses();
  const { data: aiStats } = useMyAIUsageStats(30);
  const { data: recommendations } = useLearningPathRecommendations(3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert message="강의 목록을 불러오는데 실패했습니다." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                안녕하세요, {profile?.full_name || user?.email?.split('@')[0]}님!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                통합 커뮤니케이션 & 파일 관리 시스템에 오신 것을 환영합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/ai-assistant"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-4 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">AI 어시스턴트</h3>
                <p className="text-sm opacity-90 mt-1">코드 리뷰, 개념 설명, 퀴즈 생성</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </Link>
          <Link
            to="/coding-playground"
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-4 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">코딩 플레이그라운드</h3>
                <p className="text-sm opacity-90 mt-1">온라인 코드 실행 환경</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </Link>
          <Link
            to="/calendar"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg p-4 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">학습 캘린더</h3>
                <p className="text-sm opacity-90 mt-1">일정 관리 및 과제 확인</p>
              </div>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">수강 중인 강의</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {courses?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">완료한 과제</dt>
                    <dd className="text-3xl font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">진행 중인 퀴즈</dt>
                    <dd className="text-3xl font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <Link to="/ai-assistant" className="bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden shadow rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-700 truncate">AI 사용 (30일)</dt>
                    <dd className="text-3xl font-semibold text-purple-900">
                      {aiStats?.total_requests || 0}
                    </dd>
                    {aiStats && aiStats.total_tokens > 0 && (
                      <dd className="text-xs text-purple-600 mt-1">
                        {(aiStats.total_tokens / 1000).toFixed(1)}K tokens
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Course List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">내 강의</h2>
          </div>

          {courses && courses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {courses.map((course: any) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {course.name || course.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {course.description || '강의 설명이 없습니다.'}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>강사: {course.instructor_name || '정보 없음'}</span>
                          <span className="mx-2">•</span>
                          <span>학기: {course.semester || '정보 없음'}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">강의가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                아직 등록된 강의가 없습니다. 강의에 등록되면 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Learning Path Recommendations */}
        {recommendations && recommendations.recommendations.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">추천 학습 경로</h2>
              <Link
                to="/learning-paths"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                모두 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.recommendations.slice(0, 3).map((rec) => {
                const path = rec.learning_path;
                return (
                  <Link
                    key={path.id}
                    to={`/learning-paths/${path.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                  >
                    <div className={`${path.color || 'bg-indigo-600'} p-4 text-white`}>
                      <h3 className="text-lg font-semibold group-hover:underline mb-1">
                        {path.title}
                      </h3>
                      <div className="flex items-center text-xs opacity-90">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        추천 점수 {rec.recommendation_score.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{path.description}</p>
                      <div className="bg-indigo-50 rounded p-2">
                        <p className="text-xs text-indigo-900 font-medium mb-1">왜 추천하나요?</p>
                        <p className="text-xs text-indigo-700 line-clamp-2">{rec.recommendation_reason}</p>
                      </div>
                      {rec.user_progress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">진행률</span>
                            <span className="font-medium text-gray-900">{rec.user_progress.progress_percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${rec.user_progress.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 링크</h3>
            <div className="space-y-3">
              <Link
                to="/calendar"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                일정 보기
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
            <p className="text-sm text-gray-500">활동 내역이 없습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

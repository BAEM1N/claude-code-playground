/**
 * Course Detail Page Component
 * Shows course information and navigation to course features
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourse, useCourseRole } from '../hooks/useCourse';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const CoursePage = () => {
  const { courseId } = useParams();
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: userRole, isLoading: roleLoading } = useCourseRole(courseId);

  if (courseLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert message="강의 정보를 불러오는데 실패했습니다." />
      </div>
    );
  }

  const isInstructor = userRole === 'instructor';
  const isAssistant = userRole === 'assistant';
  const canManage = isInstructor || isAssistant;

  const features = [
    {
      name: '채팅',
      description: '실시간 커뮤니케이션 및 토론',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      href: `/courses/${courseId}/chat`,
      color: 'bg-blue-500',
    },
    {
      name: '파일',
      description: '강의 자료 및 파일 관리',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      href: `/courses/${courseId}/files`,
      color: 'bg-yellow-500',
    },
    {
      name: '과제',
      description: '과제 제출 및 채점',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      href: `/courses/${courseId}/assignments`,
      color: 'bg-green-500',
    },
    {
      name: '퀴즈',
      description: '퀴즈 및 평가',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      href: `/courses/${courseId}/quiz`,
      color: 'bg-purple-500',
    },
    {
      name: '출석',
      description: 'QR 출석 체크',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      href: `/courses/${courseId}/attendance`,
      color: 'bg-red-500',
    },
    {
      name: '진도',
      description: '학습 진도 추적',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      href: `/courses/${courseId}/progress`,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <Link
                  to="/"
                  className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {course?.name || course?.title}
                  </h1>
                  {course?.code && (
                    <p className="mt-1 text-sm text-gray-500">{course.code}</p>
                  )}
                </div>
              </div>

              <p className="mt-4 text-gray-600 max-w-3xl">
                {course?.description || '강의 설명이 없습니다.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                {course?.instructor_name && (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    강사: {course.instructor_name}
                  </div>
                )}
                {course?.semester && (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    학기: {course.semester}
                  </div>
                )}
                <div className="flex items-center">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      canManage
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isInstructor ? '강사' : isAssistant ? '조교' : '학생'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">강의 기능</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`${feature.color} p-3 rounded-lg text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Course Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">강의 정보</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {course?.schedule && (
              <div>
                <span className="font-medium">수업 시간:</span> {course.schedule}
              </div>
            )}
            {course?.location && (
              <div>
                <span className="font-medium">강의실:</span> {course.location}
              </div>
            )}
            {course?.syllabus && (
              <div>
                <span className="font-medium">강의계획서:</span>{' '}
                <a href={course.syllabus} className="text-blue-600 hover:underline">
                  다운로드
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;

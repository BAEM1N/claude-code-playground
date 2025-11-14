// @ts-nocheck
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLearningPath, useEnrollInPath, useUpdateItemProgress } from '../hooks/useLearningPaths';
import { DifficultyLevel, ProgressStatus, PathItemType } from '../types/learningPath';

const LearningPathDetailPage: React.FC = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);

  const { data: path, isLoading, refetch } = useLearningPath(pathId ? parseInt(pathId) : undefined);
  const enrollMutation = useEnrollInPath();
  const updateProgressMutation = useUpdateItemProgress();

  const handleEnroll = async () => {
    if (!pathId) return;
    try {
      await enrollMutation.mutateAsync(parseInt(pathId));
      setShowEnrollConfirm(false);
      refetch();
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  const handleMarkComplete = async (itemId: number) => {
    if (!pathId) return;
    try {
      await updateProgressMutation.mutateAsync({
        itemId,
        data: { status: ProgressStatus.COMPLETED },
        pathId: parseInt(pathId),
      });
      refetch();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleMarkInProgress = async (itemId: number) => {
    if (!pathId) return;
    try {
      await updateProgressMutation.mutateAsync({
        itemId,
        data: { status: ProgressStatus.IN_PROGRESS },
        pathId: parseInt(pathId),
      });
      refetch();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getItemTypeIcon = (type: PathItemType) => {
    switch (type) {
      case PathItemType.COURSE:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case PathItemType.ASSIGNMENT:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case PathItemType.QUIZ:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case PathItemType.RESOURCE:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getItemTypeLabel = (type: PathItemType) => {
    switch (type) {
      case PathItemType.COURSE:
        return '강의';
      case PathItemType.ASSIGNMENT:
        return '과제';
      case PathItemType.QUIZ:
        return '퀴즈';
      case PathItemType.RESOURCE:
        return '학습자료';
      default:
        return type;
    }
  };

  const getItemLink = (item: any) => {
    switch (item.item_type) {
      case PathItemType.COURSE:
        return `/courses/${item.item_id}`;
      case PathItemType.ASSIGNMENT:
        return `/courses/${item.item_id}/assignments`; // Assuming we need course ID
      case PathItemType.QUIZ:
        return `/courses/${item.item_id}/quizzes`; // Assuming we need course ID
      default:
        return '#';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">학습 경로를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">학습 경로를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate('/learning-paths')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            학습 경로 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isEnrolled = !!path.user_progress;
  const progress = path.user_progress?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/learning-paths')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          학습 경로 목록
        </button>

        {/* Header */}
        <div className={`${path.color || 'bg-indigo-600'} rounded-lg shadow-lg p-8 text-white mb-8`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{path.title}</h1>
              <p className="text-lg opacity-90 mb-4">{path.description}</p>

              <div className="flex flex-wrap gap-4 items-center">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {path.difficulty_level === DifficultyLevel.BEGINNER && '초급'}
                  {path.difficulty_level === DifficultyLevel.INTERMEDIATE && '중급'}
                  {path.difficulty_level === DifficultyLevel.ADVANCED && '고급'}
                </span>
                {path.estimated_hours && (
                  <span className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    약 {path.estimated_hours}시간
                  </span>
                )}
                <span className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  {path.total_items}개 항목 ({path.required_items}개 필수)
                </span>
              </div>

              {/* Tags */}
              {path.tags && path.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {path.tags.map((tag) => (
                    <span key={tag} className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Enroll Button */}
            {!isEnrolled && (
              <button
                onClick={() => setShowEnrollConfirm(true)}
                className="ml-6 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-medium whitespace-nowrap"
              >
                등록하기
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isEnrolled && (
            <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">진행률</span>
                <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {path.user_progress?.status === ProgressStatus.COMPLETED && (
                <p className="mt-2 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  완료했습니다!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Learning Path Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">학습 항목</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {path.items_with_progress && path.items_with_progress.length > 0 ? (
              path.items_with_progress.map((item, index) => {
                const isCompleted = item.user_progress?.status === ProgressStatus.COMPLETED;
                const isInProgress = item.user_progress?.status === ProgressStatus.IN_PROGRESS;
                const isLocked = item.is_locked;

                return (
                  <div
                    key={item.id}
                    className={`p-6 ${isLocked ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition`}
                  >
                    <div className="flex items-start">
                      {/* Order Number */}
                      <div className="flex-shrink-0 mr-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isInProgress
                            ? 'bg-indigo-500 text-white'
                            : isLocked
                            ? 'bg-gray-300 text-gray-600'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                item.item_type === PathItemType.COURSE ? 'bg-blue-100 text-blue-800' :
                                item.item_type === PathItemType.ASSIGNMENT ? 'bg-yellow-100 text-yellow-800' :
                                item.item_type === PathItemType.QUIZ ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                <span className="mr-1">{getItemTypeIcon(item.item_type)}</span>
                                {getItemTypeLabel(item.item_type)}
                              </span>
                              {item.is_required && (
                                <span className="text-xs text-red-600 font-medium">필수</span>
                              )}
                              {isLocked && (
                                <span className="flex items-center text-xs text-gray-500">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                  잠김
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}

                            {item.estimated_hours && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                약 {item.estimated_hours}시간
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          {!isLocked && isEnrolled && (
                            <div className="flex gap-2 ml-4">
                              {!isCompleted && (
                                <>
                                  {!isInProgress && (
                                    <button
                                      onClick={() => handleMarkInProgress(item.id)}
                                      className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 transition"
                                    >
                                      시작
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleMarkComplete(item.id)}
                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                                  >
                                    완료
                                  </button>
                                </>
                              )}
                              {!isLocked && item.item_type !== PathItemType.RESOURCE && (
                                <Link
                                  to={getItemLink(item)}
                                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                                >
                                  보기
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                아직 학습 항목이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Confirmation Modal */}
      {showEnrollConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">학습 경로 등록</h3>
            <p className="text-gray-600 mb-6">
              "{path.title}" 학습 경로에 등록하시겠습니까? 등록하면 진행 상황이 추적됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEnrollConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrollMutation.isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400"
              >
                {enrollMutation.isLoading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathDetailPage;

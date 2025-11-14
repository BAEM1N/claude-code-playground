// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLearningPaths, useLearningPathRecommendations } from '../hooks/useLearningPaths';
import { DifficultyLevel } from '../types/learningPath';

const LearningPathsPage: React.FC = () => {
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('recommended');

  const { data: allPaths, isLoading: pathsLoading } = useLearningPaths(
    difficultyFilter ? { difficulty: difficultyFilter } : undefined
  );

  const { data: recommendations, isLoading: recsLoading } = useLearningPathRecommendations(20);

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return 'bg-green-100 text-green-800';
      case DifficultyLevel.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case DifficultyLevel.ADVANCED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return '초급';
      case DifficultyLevel.INTERMEDIATE:
        return '중급';
      case DifficultyLevel.ADVANCED:
        return '고급';
      default:
        return difficulty;
    }
  };

  const getIconForPath = (icon?: string) => {
    // Default icons based on icon string
    if (!icon || icon === 'book') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    if (icon === 'code') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    if (icon === 'rocket') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학습 경로</h1>
          <p className="mt-2 text-gray-600">맞춤형 학습 경로로 체계적으로 학습하세요</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`${
                activeTab === 'recommended'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              추천 경로
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              모든 경로
            </button>
          </nav>
        </div>

        {/* Filters (only show for 'all' tab) */}
        {activeTab === 'all' && (
          <div className="mb-6 flex gap-4">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">모든 난이도</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
        )}

        {/* Content */}
        {activeTab === 'recommended' && (
          <div>
            {recsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">추천 경로를 불러오는 중...</p>
              </div>
            ) : recommendations && recommendations.recommendations.length > 0 ? (
              <>
                {/* Stats */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">완료한 경로</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.user_completed_paths}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">진행 중인 경로</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.user_in_progress_paths}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">추천 경로</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.total}</p>
                  </div>
                </div>

                {/* Recommended Paths */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.recommendations.map((rec) => {
                    const path = rec.learning_path;
                    const bgColor = path.color || 'bg-indigo-600';

                    return (
                      <Link
                        key={path.id}
                        to={`/learning-paths/${path.id}`}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                      >
                        {/* Header with color */}
                        <div className={`${bgColor} bg-gradient-to-r p-6 text-white`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {getIconForPath(path.icon)}
                              <h3 className="mt-3 text-xl font-semibold group-hover:underline">
                                {path.title}
                              </h3>
                            </div>
                            <div className="flex items-center bg-white bg-opacity-20 rounded-full px-2 py-1">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">{rec.recommendation_score.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{path.description}</p>

                          <div className="flex items-center justify-between mb-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty_level)}`}>
                              {getDifficultyLabel(path.difficulty_level)}
                            </span>
                            {path.estimated_hours && (
                              <span className="text-sm text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {path.estimated_hours}시간
                              </span>
                            )}
                          </div>

                          {/* Recommendation Reason */}
                          <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                            <p className="text-xs font-medium text-indigo-900 mb-1">왜 추천하나요?</p>
                            <p className="text-xs text-indigo-700">{rec.recommendation_reason}</p>
                          </div>

                          {/* Tags */}
                          {path.tags && path.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {path.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Progress if enrolled */}
                          {rec.user_progress && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600">진행률</span>
                                <span className="font-medium text-gray-900">{rec.user_progress.progress_percentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all"
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
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">추천 경로가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">먼저 학습 경로에 등록하여 추천을 받아보세요!</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('all')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    모든 경로 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div>
            {pathsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">학습 경로를 불러오는 중...</p>
              </div>
            ) : allPaths && allPaths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPaths.map((path) => {
                  const bgColor = path.color || 'bg-indigo-600';

                  return (
                    <Link
                      key={path.id}
                      to={`/learning-paths/${path.id}`}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      {/* Header with color */}
                      <div className={`${bgColor} bg-gradient-to-r p-6 text-white`}>
                        {getIconForPath(path.icon)}
                        <h3 className="mt-3 text-xl font-semibold group-hover:underline">
                          {path.title}
                        </h3>
                      </div>

                      {/* Body */}
                      <div className="p-6">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{path.description}</p>

                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty_level)}`}>
                            {getDifficultyLabel(path.difficulty_level)}
                          </span>
                          {path.estimated_hours && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {path.estimated_hours}시간
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {path.tags && path.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {path.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">학습 경로가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">아직 생성된 학습 경로가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathsPage;

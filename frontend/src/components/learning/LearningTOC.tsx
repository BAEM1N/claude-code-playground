/**
// @ts-nocheck
 * Learning Table of Contents Component
// @ts-nocheck
 * Gitbook-style navigation sidebar
// @ts-nocheck
 */
// @ts-nocheck
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const LearningTOC = ({ module, currentTopicId }) => {
  const [expandedChapters, setExpandedChapters] = useState({});

  if (!module || !module.chapters) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        목차를 불러오는 중...
      </div>
    );
  }

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⋯';
      default:
        return '○';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 border-r border-gray-200">
      {/* Module Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <Link
          to={`/learning/modules/${module.id}`}
          className="block hover:text-blue-600"
        >
          <h3 className="font-semibold text-gray-800 text-sm mb-1">
            {module.title}
          </h3>
          {module.estimated_hours && (
            <p className="text-xs text-gray-500">
              약 {module.estimated_hours}시간
            </p>
          )}
        </Link>
      </div>

      {/* Chapters and Topics */}
      <nav className="p-2">
        {module.chapters.map((chapter, chapterIndex) => {
          const isExpanded = expandedChapters[chapter.id] !== false; // Default to expanded
          const hasTopics = chapter.topics && chapter.topics.length > 0;

          return (
            <div key={chapter.id} className="mb-2">
              {/* Chapter Header */}
              <button
                onClick={() => hasTopics && toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded text-left group"
              >
                <div className="flex items-center flex-1">
                  {hasTopics && (
                    <span className="mr-2 text-gray-400 text-xs">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                  <span className="font-medium text-gray-700 text-sm group-hover:text-blue-600">
                    {chapterIndex + 1}. {chapter.title}
                  </span>
                </div>
              </button>

              {/* Topics */}
              {hasTopics && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {chapter.topics.map((topic, topicIndex) => {
                    const isActive = topic.id === currentTopicId;
                    const progress = topic.progress || {};

                    return (
                      <Link
                        key={topic.id}
                        to={`/learning/topics/${topic.id}`}
                        className={`
                          block px-3 py-2 rounded text-sm transition-colors
                          ${isActive
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-start">
                          <span className={`mr-2 mt-0.5 ${getStatusColor(progress.status)}`}>
                            {getStatusIcon(progress.status)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="flex-1">
                                {chapterIndex + 1}.{topicIndex + 1} {topic.title}
                              </span>
                              {topic.duration_minutes && (
                                <span className="text-xs text-gray-400 ml-2">
                                  {topic.duration_minutes}분
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {/* Content type badge */}
                              <span className={`
                                inline-block text-xs px-2 py-0.5 rounded
                                ${topic.content_type === 'markdown' ? 'bg-gray-200 text-gray-700' : ''}
                                ${topic.content_type === 'video' ? 'bg-red-100 text-red-700' : ''}
                                ${topic.content_type === 'notebook' ? 'bg-green-100 text-green-700' : ''}
                              `}>
                                {topic.content_type === 'markdown' && '📄 문서'}
                                {topic.content_type === 'video' && '🎥 영상'}
                                {topic.content_type === 'notebook' && '💻 실습'}
                              </span>
                              {topic.is_required && (
                                <span className="text-xs text-red-500">필수</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default LearningTOC;

/**
 * Learning Module View Component
 * Main learning interface with TOC sidebar and content viewer
 * Gitbook-style layout
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModuleFull, useTopic, useUpdateTopicProgress } from '../../hooks/useLearning';
import LearningTOC from './LearningTOC';
import TopicContentViewer from './TopicContentViewer';

const LearningModuleView = () => {
  const { moduleId, topicId } = useParams();
  const navigate = useNavigate();
  const [isTOCOpen, setIsTOCOpen] = useState(true);

  // Fetch module with all content
  const { data: module, isLoading: moduleLoading, error: moduleError } = useModuleFull(moduleId);

  // Fetch current topic
  const { data: currentTopic, isLoading: topicLoading } = useTopic(topicId);

  // Progress update
  const updateProgress = useUpdateTopicProgress();

  // Auto-redirect to first topic if no topic is selected
  useEffect(() => {
    if (module && !topicId) {
      const firstTopic = module.chapters?.[0]?.topics?.[0];
      if (firstTopic) {
        navigate(`/learning/modules/${moduleId}/topics/${firstTopic.id}`, { replace: true });
      }
    }
  }, [module, topicId, moduleId, navigate]);

  const handleProgressUpdate = async (progress) => {
    if (!currentTopic) return;

    try {
      await updateProgress.mutateAsync({
        topicId: currentTopic.id,
        progress
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // Navigate to next/previous topic
  const navigateToTopic = (direction) => {
    if (!module || !currentTopic) return;

    const allTopics = [];
    module.chapters.forEach(chapter => {
      chapter.topics.forEach(topic => {
        allTopics.push({ ...topic, chapterId: chapter.id });
      });
    });

    const currentIndex = allTopics.findIndex(t => t.id === currentTopic.id);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < allTopics.length) {
      navigate(`/learning/modules/${moduleId}/topics/${allTopics[nextIndex].id}`);
    }
  };

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">모듈을 불러오는 중...</div>
      </div>
    );
  }

  if (moduleError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded p-6 max-w-md">
          <p className="text-red-700 font-medium mb-2">모듈을 불러올 수 없습니다</p>
          <p className="text-sm text-red-600">{moduleError.message}</p>
          <button
            onClick={() => navigate('/learning')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            학습 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Table of Contents Sidebar */}
      <div className={`
        ${isTOCOpen ? 'w-80' : 'w-0'}
        transition-all duration-300 ease-in-out
        border-r border-gray-200 overflow-hidden
      `}>
        <LearningTOC
          module={module}
          currentTopicId={topicId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTOCOpen(!isTOCOpen)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="목차 토글"
            >
              <span className="text-xl">{isTOCOpen ? '◀' : '▶'}</span>
            </button>

            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">{module?.title}</span>
              {currentTopic && (
                <>
                  <span className="mx-2">/</span>
                  <span>{currentTopic.title}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToTopic('prev')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              ◀ 이전
            </button>
            <button
              onClick={() => navigateToTopic('next')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
            >
              다음 ▶
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto">
          {topicLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">콘텐츠를 불러오는 중...</div>
            </div>
          ) : currentTopic ? (
            <TopicContentViewer
              topic={currentTopic}
              onProgressUpdate={handleProgressUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">왼쪽 목차에서 학습할 항목을 선택하세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningModuleView;

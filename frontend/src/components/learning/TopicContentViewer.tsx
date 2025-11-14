/**
// @ts-nocheck
 * Topic Content Viewer Component
// @ts-nocheck
 * Renders different content types: Markdown, Video, Notebook
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';
import MarkdownViewer from './MarkdownViewer';
import VideoPlayer from './VideoPlayer';
import NotebookViewer from './NotebookViewer';

const TopicContentViewer = ({ topic, onProgressUpdate }) => {
  if (!topic) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">콘텐츠를 선택해주세요</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (topic.content_type) {
      case 'markdown':
        return (
          <MarkdownViewer
            content={topic.markdown_content}
            fileUrl={topic.markdown_file_url}
            onProgressUpdate={onProgressUpdate}
          />
        );

      case 'video':
        return (
          <VideoPlayer
            videoUrl={topic.video_url}
            videoSource={topic.video_source}
            thumbnail={topic.video_thumbnail_url}
            duration={topic.video_duration_seconds}
            initialPosition={topic.progress?.video_position_seconds || 0}
            onProgressUpdate={onProgressUpdate}
          />
        );

      case 'notebook':
        return (
          <NotebookViewer
            notebookData={topic.notebook_data}
            kernelType={topic.notebook_kernel}
            initialState={topic.progress?.notebook_state}
            onProgressUpdate={onProgressUpdate}
          />
        );

      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-700">
              지원하지 않는 콘텐츠 타입입니다: {topic.content_type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Topic Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {topic.title}
            </h1>
            {topic.description && (
              <p className="text-gray-600">
                {topic.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className={`
                inline-block px-3 py-1 rounded-full
                ${topic.content_type === 'markdown' ? 'bg-gray-100 text-gray-700' : ''}
                ${topic.content_type === 'video' ? 'bg-red-100 text-red-700' : ''}
                ${topic.content_type === 'notebook' ? 'bg-green-100 text-green-700' : ''}
              `}>
                {topic.content_type === 'markdown' && '📄 문서'}
                {topic.content_type === 'video' && '🎥 영상'}
                {topic.content_type === 'notebook' && '💻 실습'}
              </span>
              {topic.duration_minutes && (
                <span>⏱️ 약 {topic.duration_minutes}분</span>
              )}
              {topic.progress && (
                <span className={`
                  font-medium
                  ${topic.progress.status === 'completed' ? 'text-green-600' : ''}
                  ${topic.progress.status === 'in_progress' ? 'text-blue-600' : ''}
                  ${topic.progress.status === 'not_started' ? 'text-gray-500' : ''}
                `}>
                  {topic.progress.status === 'completed' && '✓ 완료'}
                  {topic.progress.status === 'in_progress' && '⋯ 진행 중'}
                  {topic.progress.status === 'not_started' && '○ 시작 전'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white">
        {renderContent()}
      </div>

      {/* Attachments */}
      {topic.attachments && topic.attachments.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">첨부 파일</h3>
          <div className="flex flex-wrap gap-2">
            {topic.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <span className="mr-2">📎</span>
                {attachment.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicContentViewer;

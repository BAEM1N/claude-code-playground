/**
 * Markdown Viewer Component
 * Renders markdown content with syntax highlighting
 *
 * NOTE: Requires react-markdown package
 * npm install --legacy-peer-deps react-markdown remark-gfm rehype-highlight
 */
import React, { useEffect } from 'react';

const MarkdownViewer = ({ content, fileUrl, onProgressUpdate }) => {
  // Mark as in progress when component mounts
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({ status: 'in_progress' });
    }
  }, [onProgressUpdate]);

  // Placeholder: react-markdown will be installed in Phase 2
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="prose prose-lg max-w-none">
        {content ? (
          <div className="markdown-content">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-blue-700 font-medium">📝 Markdown 렌더링</p>
              <p className="text-sm text-blue-600 mt-1">
                Phase 2에서 react-markdown을 사용한 완전한 렌더링이 구현됩니다.
              </p>
            </div>

            <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border border-gray-200">
              {content}
            </div>
          </div>
        ) : fileUrl ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-700">
              파일 URL로부터 콘텐츠를 불러오는 기능은 Phase 2에서 구현됩니다.
            </p>
            <p className="text-sm text-yellow-600 mt-2">URL: {fileUrl}</p>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-300 rounded p-4">
            <p className="text-gray-600">마크다운 콘텐츠가 없습니다.</p>
          </div>
        )}

        {/* Completion button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => onProgressUpdate && onProgressUpdate({ status: 'completed' })}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            ✓ 학습 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownViewer;

/**
 * Full-Featured Markdown Viewer Component
 * Complete implementation with:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting for code blocks
 * - HTML support
 * - Auto-linking
 * - Image loading
 * - Custom styling
 */
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css'; // Code highlighting theme

const MarkdownViewer = ({ content, fileUrl, onProgressUpdate }) => {
  const [markdownContent, setMarkdownContent] = useState(content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch markdown from URL if provided
  useEffect(() => {
    if (fileUrl && !content) {
      setIsLoading(true);
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`);
          return res.text();
        })
        .then(text => {
          setMarkdownContent(text);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [fileUrl, content]);

  // Mark as in progress when component mounts
  useEffect(() => {
    if (onProgressUpdate && markdownContent) {
      onProgressUpdate({ status: 'in_progress' });
    }
  }, [onProgressUpdate, markdownContent]);

  // Track scroll progress
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Auto-complete if scrolled to bottom
    if (scrollPercentage > 0.95 && onProgressUpdate) {
      onProgressUpdate({
        status: 'completed',
        scroll_position: scrollTop
      });
    } else if (onProgressUpdate) {
      onProgressUpdate({
        scroll_position: scrollTop
      });
    }
  };

  const handleComplete = () => {
    if (onProgressUpdate) {
      onProgressUpdate({ status: 'completed' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">마크다운을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">콘텐츠 로드 실패</h3>
          <p className="text-red-600 text-sm">{error}</p>
          {fileUrl && (
            <p className="text-red-500 text-xs mt-2">URL: {fileUrl}</p>
          )}
        </div>
      </div>
    );
  }

  if (!markdownContent) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <p className="text-gray-600">마크다운 콘텐츠가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="markdown-viewer-container h-full overflow-auto"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto p-8">
        {/* Markdown Content */}
        <div className="markdown-content prose prose-lg prose-slate max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h1:text-4xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-200
          prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
          prose-pre:shadow-lg
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
          prose-li:text-gray-700 prose-li:mb-2
          prose-table:border-collapse prose-table:w-full
          prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left
          prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
          prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
          prose-hr:border-gray-300 prose-hr:my-8
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              // Custom component renderers
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded-lg shadow-md my-6 max-w-full h-auto"
                  loading="lazy"
                  alt={props.alt || 'Image'}
                />
              ),
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-blue-600 hover:underline"
                  target={props.href?.startsWith('http') ? '_blank' : undefined}
                  rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code className="text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Task list support
              input: ({ node, ...props }) => {
                if (props.type === 'checkbox') {
                  return (
                    <input
                      {...props}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled
                    />
                  );
                }
                return <input {...props} />;
              },
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>

        {/* Completion Section */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>문서를 끝까지 읽으셨나요?</p>
              <p className="text-xs mt-1">페이지 하단까지 스크롤하면 자동으로 완료 처리됩니다.</p>
            </div>
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              ✓ 학습 완료
            </button>
          </div>
        </div>

        {/* Reading Progress Indicator */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownViewer;

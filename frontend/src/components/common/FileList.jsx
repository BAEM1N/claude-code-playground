/**
 * File List Display Component
 */
import React from 'react';
import { formatFileSize, formatDate } from '../../utils/formatters';

const FileList = ({ files = [], onDelete = null, showDelete = false }) => {
  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'document';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
    return 'document';
  };

  const getFileIconSVG = (type) => {
    const iconClass = "h-8 w-8";

    switch (type) {
      case 'image':
        return (
          <svg className={`${iconClass} text-purple-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'archive':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getFileTypeBadge = (fileType) => {
    const badgeClasses = {
      material: 'bg-blue-100 text-blue-800',
      solution: 'bg-green-100 text-green-800',
      rubric: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      material: '자료',
      solution: '정답',
      rubric: '채점기준'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badgeClasses[fileType] || 'bg-gray-100 text-gray-800'}`}>
        {labels[fileType] || fileType}
      </span>
    );
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        첨부된 파일이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* File Icon */}
            <div className="flex-shrink-0">
              {getFileIconSVG(getFileIcon(file.mime_type))}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.filename || file.original_name}
                </p>
                {file.file_type && getFileTypeBadge(file.file_type)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{formatFileSize(file.file_size)}</span>
                {file.created_at && (
                  <>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {/* Download Button */}
            <a
              href={file.download_url}
              download
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="다운로드"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>

            {/* Delete Button */}
            {showDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(file.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="삭제"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;

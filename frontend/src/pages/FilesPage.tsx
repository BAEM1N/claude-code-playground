/**
// @ts-nocheck
 * Files Page Component
// @ts-nocheck
 * File management with upload, download, and folder organization
// @ts-nocheck
 */
// @ts-nocheck
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { filesAPI } from '../services/api';
import { useCourseRole } from '../hooks/useCourse';
import FileUpload from '../components/common/FileUpload';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatFileSize, formatDate } from '../utils/formatters';

interface Folder {
  id: string;
  name: string;
  parent_id?: string;
}

interface FileItem {
  id: string;
  filename?: string;
  name?: string;
  size?: number;
  created_at?: string;
  uploader_name?: string;
}

const FilesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: userRole } = useCourseRole(courseId || '');
  const canManage = userRole === 'instructor' || userRole === 'assistant';

  // Fetch folders
  const { data: folders, isLoading: foldersLoading } = useQuery<Folder[]>(
    ['folders', courseId],
    async () => {
      const { data } = await (filesAPI as any).getFolders(courseId);
      return data;
    },
    {
      enabled: !!courseId,
    }
  );

  // Fetch files
  const { data: files, isLoading: filesLoading } = useQuery<FileItem[]>(
    ['files', courseId, selectedFolder?.id],
    async () => {
      const { data } = await (filesAPI as any).getFiles(courseId, {
        folder_id: selectedFolder?.id,
      });
      return data;
    },
    {
      enabled: !!courseId,
    }
  );

  // Create folder mutation
  const createFolderMutation = useMutation(
    (folderData: { name: string; parent_id?: string }) =>
      (filesAPI as any).createFolder(courseId, folderData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['folders', courseId]);
        setShowNewFolder(false);
        setNewFolderName('');
      },
      onError: (err) => {
        setError('폴더 생성에 실패했습니다.');
        console.error('Failed to create folder:', err);
      },
    }
  );

  // Upload file mutation
  const uploadFileMutation = useMutation(
    ({ file }: { file: File }) => (filesAPI as any).uploadFile(courseId, file, selectedFolder?.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['files', courseId, selectedFolder?.id]);
        setShowUpload(false);
      },
      onError: (err) => {
        setError('파일 업로드에 실패했습니다.');
        console.error('Failed to upload file:', err);
      },
    }
  );

  // Delete file mutation
  const deleteFileMutation = useMutation(
    (fileId: string) => (filesAPI as any).deleteFile(fileId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['files', courseId, selectedFolder?.id]);
      },
      onError: (err) => {
        setError('파일 삭제에 실패했습니다.');
        console.error('Failed to delete file:', err);
      },
    }
  );

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    createFolderMutation.mutate({
      name: newFolderName,
      parent_id: selectedFolder?.id,
    });
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    uploadedFiles.forEach((file) => {
      uploadFileMutation.mutate({ file });
    });
  };

  const handleFileDownload = async (fileId: string, filename: string) => {
    try {
      const { data } = await (filesAPI as any).downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('파일 다운로드에 실패했습니다.');
      console.error('Failed to download file:', err);
    }
  };

  const handleFileDelete = (fileId: string) => {
    if (window.confirm('이 파일을 삭제하시겠습니까?')) {
      deleteFileMutation.mutate(fileId);
    }
  };

  if (foldersLoading || filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">파일 관리</h1>
            {canManage && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  새 폴더
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  파일 업로드
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* New Folder Modal */}
        {showNewFolder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 폴더 만들기</h3>
              <form onSubmit={handleCreateFolder}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="폴더 이름"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  autoFocus
                />
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim() || createFolderMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    만들기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">파일 업로드</h3>
              <FileUpload
                onFileSelect={handleFileUpload}
                multiple
                accept="*/*"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folder Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">폴더</h2>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    !selectedFolder
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
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
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    전체 파일
                  </div>
                </button>

                {folders && folders.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedFolder?.id === folder.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
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
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          {folder.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">
                  {selectedFolder ? selectedFolder.name : '전체 파일'}
                </h2>
              </div>

              {files && files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          파일명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          크기
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로드 일시
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로더
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <svg
                                className="h-5 w-5 text-gray-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">
                                {file.filename || file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.size ? formatFileSize(file.size) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.created_at ? formatDate(file.created_at) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.uploader_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleFileDownload(file.id, file.filename || file.name || 'file')}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              다운로드
                            </button>
                            {canManage && (
                              <button
                                onClick={() => handleFileDelete(file.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={deleteFileMutation.isLoading}
                              >
                                삭제
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
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
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">파일이 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    파일을 업로드하여 시작하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;

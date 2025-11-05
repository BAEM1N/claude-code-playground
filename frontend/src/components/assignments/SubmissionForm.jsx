/**
 * Submission Form Component
 */
import React, { useState } from 'react';
import { assignmentsAPI } from '../../services/api';
import FileUpload from '../common/FileUpload';

const SubmissionForm = ({ assignmentId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    submission_text: '',
  });

  // File management
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Submit the assignment
      const response = await assignmentsAPI.submitAssignment(assignmentId, formData);
      const submissionId = response.data.id;

      // Upload files if any
      if (attachedFiles.length > 0) {
        setUploadingFiles(true);
        await uploadFiles(submissionId);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const uploadFiles = async (submissionId) => {
    const uploadPromises = attachedFiles.map(file =>
      assignmentsAPI.attachFileToSubmission(submissionId, file)
    );
    await Promise.all(uploadPromises);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">과제 제출</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          제출 내용 *
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows="8"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="과제 답안을 작성하세요..."
        />
      </div>

      {/* Additional Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          추가 코멘트
        </label>
        <textarea
          name="submission_text"
          value={formData.submission_text}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="선택사항: 추가로 전달할 내용이 있다면 작성하세요"
        />
      </div>

      {/* File Attachments */}
      <div className="pt-4 border-t border-gray-200">
        <FileUpload
          label="첨부 파일"
          onFileSelect={setAttachedFiles}
          accept="*/*"
          maxSizeMB={100}
          multiple={true}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || uploadingFiles}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploadingFiles ? '파일 업로드 중...' : loading ? '제출 중...' : '제출하기'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          취소
        </button>
      </div>
    </form>
  );
};

export default SubmissionForm;

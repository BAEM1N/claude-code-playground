import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyGroupsAPI } from '../../services/api';

const StudyGroupForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course_name: '',
    max_members: 10,
    is_public: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      const response = await studyGroupsAPI.createStudyGroup({
        name: formData.name,
        description: formData.description,
        course_name: formData.course_name || undefined,
        max_members: formData.max_members,
        is_public: formData.is_public,
      });

      navigate(`/study-groups/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create study group:', error);
      alert('Failed to create study group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Study Group</h1>
        <p className="text-gray-600">Start a new study group and invite others to join</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Group Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Data Structures Study Group"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what your group will study and any goals..."
            required
          />
        </div>

        {/* Course Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Course (Optional)
          </label>
          <input
            type="text"
            value={formData.course_name}
            onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., CS 101 - Introduction to Computer Science"
          />
        </div>

        {/* Max Members */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Members
          </label>
          <input
            type="number"
            min="2"
            max="50"
            value={formData.max_members}
            onChange={(e) =>
              setFormData({ ...formData, max_members: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Set the maximum number of members (2-50)
          </p>
        </div>

        {/* Privacy */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Privacy</label>
          <div className="space-y-3">
            <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="privacy"
                checked={formData.is_public}
                onChange={() => setFormData({ ...formData, is_public: true })}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Public</p>
                <p className="text-sm text-gray-600">
                  Anyone can find and join this group
                </p>
              </div>
            </label>
            <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="privacy"
                checked={!formData.is_public}
                onChange={() => setFormData({ ...formData, is_public: false })}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Private</p>
                <p className="text-sm text-gray-600">
                  Only invited members can join
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/study-groups')}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudyGroupForm;

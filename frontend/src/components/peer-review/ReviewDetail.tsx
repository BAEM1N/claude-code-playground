import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { peerReviewAPI } from '../../services/api';

interface Submission {
  id: string;
  assignment_title: string;
  student_name: string;
  submitted_at: string;
  content: string;
  files: Array<{ id: string; name: string; url: string }>;
}

interface ReviewCriteria {
  id: string;
  name: string;
  description: string;
  max_score: number;
}

const ReviewDetail: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  const criteria: ReviewCriteria[] = [
    { id: '1', name: 'Understanding', description: 'Demonstrates understanding of concepts', max_score: 5 },
    { id: '2', name: 'Completeness', description: 'All requirements are met', max_score: 5 },
    { id: '3', name: 'Code Quality', description: 'Code is well-written and organized', max_score: 5 },
    { id: '4', name: 'Creativity', description: 'Shows creative problem-solving', max_score: 5 },
  ];

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await peerReviewAPI.getSubmissionsToReview(assignmentId!, { limit: 5 });
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    const currentSubmission = submissions[currentIndex];
    if (!currentSubmission) return;

    // Validate scores
    const missingScores = criteria.filter(c => !scores[c.id]);
    if (missingScores.length > 0) {
      alert('Please provide scores for all criteria');
      return;
    }

    if (!feedback.trim()) {
      alert('Please provide overall feedback');
      return;
    }

    setSubmitting(true);
    try {
      await peerReviewAPI.submitReview(currentSubmission.id, {
        scores,
        feedback,
        strengths,
        improvements,
      });

      // Move to next submission or go back to list
      if (currentIndex < submissions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        resetForm();
      } else {
        navigate('/peer-review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setScores({});
    setFeedback('');
    setStrengths('');
    setImprovements('');
  };

  const handleSkip = () => {
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForm();
    } else {
      navigate('/peer-review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No submissions available for review</p>
          <button
            onClick={() => navigate('/peer-review')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const currentSubmission = submissions[currentIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Peer Review</h1>
          <span className="text-sm text-gray-600">
            Submission {currentIndex + 1} of {submissions.length}
          </span>
        </div>
        <h2 className="text-xl text-gray-700">{currentSubmission.assignment_title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Submission */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission</h3>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Submitted by: <span className="font-medium text-gray-900">Anonymous Student</span>
            </p>
            <p className="text-sm text-gray-600">
              Submitted: {new Date(currentSubmission.submitted_at).toLocaleString()}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap">{currentSubmission.content}</p>
            </div>
          </div>

          {currentSubmission.files && currentSubmission.files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h4>
              <div className="space-y-2">
                {currentSubmission.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-blue-600 hover:text-blue-700">{file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Review Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Review</h3>

          {/* Criteria Scores */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Evaluation Criteria</h4>
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{criterion.name}</p>
                      <p className="text-xs text-gray-600">{criterion.description}</p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {scores[criterion.id] || 0} / {criterion.max_score}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={criterion.max_score}
                    value={scores[criterion.id] || 0}
                    onChange={(e) =>
                      setScores({ ...scores, [criterion.id]: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strengths (Optional)
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What did the student do well?"
            />
          </div>

          {/* Areas for Improvement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement (Optional)
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What could be improved?"
            />
          </div>

          {/* Overall Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide constructive feedback..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;

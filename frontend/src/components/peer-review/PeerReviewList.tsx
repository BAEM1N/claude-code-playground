import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { peerReviewAPI } from '../../services/api';

interface Assignment {
  id: string;
  title: string;
  course_name: string;
  due_date: string;
  total_submissions: number;
  reviewed_count: number;
  required_reviews: number;
  status: 'open' | 'closed';
}

const PeerReviewList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'to_review' | 'my_reviews' | 'received'>('to_review');

  useEffect(() => {
    loadAssignments();
  }, [activeTab]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await peerReviewAPI.getReviewableAssignments({
        status: activeTab === 'to_review' ? 'open' : undefined,
      });
      setAssignments(response.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (assignment: Assignment) => {
    return Math.min(
      (assignment.reviewed_count / assignment.required_reviews) * 100,
      100
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Review</h1>
        <p className="text-gray-600">Review your peers' work and receive feedback on your submissions</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('to_review')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'to_review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            To Review
          </button>
          <button
            onClick={() => setActiveTab('my_reviews')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my_reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Reviews
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Received Reviews
          </button>
        </nav>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* To Review Tab */}
          {activeTab === 'to_review' && (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No assignments available for review</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{assignment.course_name}</p>

                        <div className="flex items-center space-x-6 text-sm text-gray-700">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Due:</span>
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Submissions:</span>
                            {assignment.total_submissions}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              Review Progress
                            </span>
                            <span className="text-sm text-gray-600">
                              {assignment.reviewed_count} / {assignment.required_reviews}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${getProgressPercentage(assignment)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                            assignment.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {assignment.status === 'open' ? 'Open' : 'Closed'}
                        </span>

                        <Link
                          to={`/peer-review/assignments/${assignment.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Start Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* My Reviews Tab */}
          {activeTab === 'my_reviews' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Your submitted reviews will appear here</p>
            </div>
          )}

          {/* Received Reviews Tab */}
          {activeTab === 'received' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Reviews you've received will appear here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PeerReviewList;

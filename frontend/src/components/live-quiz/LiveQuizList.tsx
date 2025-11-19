import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { liveQuizAPI } from '../../services/api';

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'poll';
  status: 'draft' | 'active' | 'ended';
  question_count: number;
  participant_count: number;
  created_at: string;
  scheduled_at?: string;
  course_name?: string;
}

const LiveQuizList: React.FC = () => {
  const navigate = useNavigate();
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'my_quizzes'>('active');
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'poll'>('all');

  useEffect(() => {
    if (activeTab === 'active') {
      loadActiveQuizzes();
    } else {
      loadMyQuizzes();
    }
  }, [activeTab, filterType]);

  const loadActiveQuizzes = async () => {
    setLoading(true);
    try {
      const response = await liveQuizAPI.getActiveQuizzes({
        type: filterType === 'all' ? undefined : filterType,
      });
      setActiveQuizzes(response.data || []);
    } catch (error) {
      console.error('Failed to load active quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyQuizzes = async () => {
    setLoading(true);
    try {
      const response = await liveQuizAPI.getMyQuizzes();
      setMyQuizzes(response.data || []);
    } catch (error) {
      console.error('Failed to load my quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuiz = async (quizId: string) => {
    try {
      await liveQuizAPI.joinQuiz(quizId);
      navigate(`/live-quiz/${quizId}`);
    } catch (error) {
      console.error('Failed to join quiz:', error);
      alert('Failed to join quiz');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'ended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayQuizzes = activeTab === 'active' ? activeQuizzes : myQuizzes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Quiz & Polls</h1>
            <p className="text-gray-600">Join live quizzes or create your own polls</p>
          </div>
          <button
            onClick={() => navigate('/live-quiz/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Quiz/Poll
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Now
          </button>
          <button
            onClick={() => setActiveTab('my_quizzes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my_quizzes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Quizzes
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'quiz' | 'poll')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="quiz">Quizzes Only</option>
          <option value="poll">Polls Only</option>
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {displayQuizzes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {activeTab === 'active' ? 'No active quizzes or polls' : 'You haven\'t created any quizzes yet'}
              </p>
              {activeTab === 'my_quizzes' && (
                <button
                  onClick={() => navigate('/live-quiz/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Quiz
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.type === 'quiz' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {quiz.type === 'quiz' ? 'Quiz' : 'Poll'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quiz.status)}`}>
                        {quiz.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-4">
                    <span>{quiz.question_count} questions</span>
                    <span>{quiz.participant_count} participants</span>
                  </div>

                  {/* Course */}
                  {quiz.course_name && (
                    <p className="text-sm text-blue-600 mb-4">{quiz.course_name}</p>
                  )}

                  {/* Action Button */}
                  {activeTab === 'active' ? (
                    <button
                      onClick={() => handleJoinQuiz(quiz.id)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Join Now
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      {quiz.status === 'draft' && (
                        <button
                          onClick={() => navigate(`/live-quiz/${quiz.id}/edit`)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <Link
                        to={`/live-quiz/${quiz.id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        {quiz.status === 'draft' ? 'Start' : 'View'}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveQuizList;

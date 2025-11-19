import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collaborativeEditorAPI } from '../../services/api';

interface Session {
  id: string;
  title: string;
  description: string;
  language: string;
  is_public: boolean;
  participant_count: number;
  max_participants: number;
  created_by: string;
  created_at: string;
}

const languageColors: Record<string, string> = {
  javascript: 'bg-yellow-100 text-yellow-800',
  typescript: 'bg-blue-100 text-blue-800',
  python: 'bg-green-100 text-green-800',
  java: 'bg-red-100 text-red-800',
  cpp: 'bg-purple-100 text-purple-800',
  csharp: 'bg-violet-100 text-violet-800',
  go: 'bg-cyan-100 text-cyan-800',
  rust: 'bg-orange-100 text-orange-800',
};

const EditorSessionList: React.FC = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'my_sessions'>('active');
  const [filterLanguage, setFilterLanguage] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'active') {
      loadActiveSessions();
    } else {
      loadMySessions();
    }
  }, [activeTab, filterLanguage]);

  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const response = await collaborativeEditorAPI.getActiveSessions({
        language: filterLanguage || undefined,
        is_public: true,
      });
      setActiveSessions(response.data || []);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMySessions = async () => {
    setLoading(true);
    try {
      const response = await collaborativeEditorAPI.getMySessions();
      setMySessions(response.data || []);
    } catch (error) {
      console.error('Failed to load my sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      await collaborativeEditorAPI.joinSession(sessionId);
      navigate(`/collab-editor/${sessionId}`);
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Failed to join session');
    }
  };

  const displaySessions = activeTab === 'active' ? activeSessions : mySessions;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaborative Code Editor</h1>
            <p className="text-gray-600">Code together in real-time with your peers</p>
          </div>
          <button
            onClick={() => navigate('/collab-editor/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Session
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
            Active Sessions
          </button>
          <button
            onClick={() => setActiveTab('my_sessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my_sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Sessions
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <select
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      ) : (
        <>
          {displaySessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {activeTab === 'active' ? 'No active sessions' : 'You haven\'t created any sessions yet'}
              </p>
              {activeTab === 'my_sessions' && (
                <button
                  onClick={() => navigate('/collab-editor/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Session
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displaySessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        languageColors[session.language] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {session.language}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {session.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{session.description}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-4">
                    <span>By {session.created_by}</span>
                    <span>{session.participant_count}/{session.max_participants}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(session.participant_count / session.max_participants) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {activeTab === 'active' ? (
                    <button
                      onClick={() => handleJoinSession(session.id)}
                      disabled={session.participant_count >= session.max_participants}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {session.participant_count >= session.max_participants ? 'Full' : 'Join Session'}
                    </button>
                  ) : (
                    <Link
                      to={`/collab-editor/${session.id}`}
                      className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Open Editor
                    </Link>
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

export default EditorSessionList;

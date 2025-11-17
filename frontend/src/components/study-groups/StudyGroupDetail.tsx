import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyGroupsAPI } from '../../services/api';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course_name?: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
}

interface Session {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string;
  rsvp_status?: 'attending' | 'not_attending' | 'maybe';
  attendee_count: number;
}

const StudyGroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'sessions' | 'discussion'>('overview');

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [groupRes, membersRes, sessionsRes] = await Promise.all([
        studyGroupsAPI.getStudyGroup(groupId!),
        studyGroupsAPI.getGroupMembers(groupId!),
        studyGroupsAPI.getSessions(groupId!, { upcoming: true }),
      ]);

      setGroup(groupRes.data);
      setMembers(membersRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (sessionId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    try {
      await studyGroupsAPI.rsvpSession(groupId!, sessionId, status);
      // Reload sessions to update RSVP status
      const response = await studyGroupsAPI.getSessions(groupId!, { upcoming: true });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await studyGroupsAPI.leaveGroup(groupId!);
      navigate('/study-groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Failed to leave group');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  group.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {group.is_public ? 'Public' : 'Private'}
              </span>
            </div>
            {group.course_name && (
              <p className="text-blue-600 mb-2">{group.course_name}</p>
            )}
            <p className="text-gray-600">{group.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              Created {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleLeaveGroup}
            className="ml-4 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Leave Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {(['overview', 'members', 'sessions', 'discussion'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-600">No upcoming sessions</p>
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900">{session.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-700">
                          <p>{new Date(session.scheduled_at).toLocaleString()}</p>
                          <p>{session.duration_minutes} min • {session.location}</p>
                        </div>
                        <span className="text-sm text-gray-600">
                          {session.attendee_count} attending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Member Count */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Members</h3>
              <p className="text-3xl font-bold text-blue-600">{members.length}</p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('discussion')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Discussion
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Schedule Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Members</h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Study Sessions</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Schedule New Session
            </button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-gray-600">No sessions scheduled</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {session.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{session.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-700">
                        <span>📅 {new Date(session.scheduled_at).toLocaleDateString()}</span>
                        <span>🕐 {session.duration_minutes} min</span>
                        <span>📍 {session.location}</span>
                        <span>👥 {session.attendee_count} attending</span>
                      </div>
                    </div>
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => handleRSVP(session.id, 'attending')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          session.rsvp_status === 'attending'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Attending
                      </button>
                      <button
                        onClick={() => handleRSVP(session.id, 'maybe')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          session.rsvp_status === 'maybe'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRSVP(session.id, 'not_attending')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          session.rsvp_status === 'not_attending'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Not Attending
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discussion Tab */}
      {activeTab === 'discussion' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Discussion</h2>
          <p className="text-gray-600">Discussion board coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default StudyGroupDetail;

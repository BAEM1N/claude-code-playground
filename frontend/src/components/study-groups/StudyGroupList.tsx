import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studyGroupsAPI } from '../../services/api';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course_name?: string;
  member_count: number;
  max_members: number;
  is_public: boolean;
  is_member: boolean;
  created_at: string;
  next_session?: {
    title: string;
    scheduled_at: string;
  };
}

const StudyGroupList: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my_groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublic, setFilterPublic] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllGroups();
    } else {
      loadMyGroups();
    }
  }, [activeTab, searchQuery, filterPublic]);

  const loadAllGroups = async () => {
    setLoading(true);
    try {
      const response = await studyGroupsAPI.getStudyGroups({
        search: searchQuery || undefined,
        is_public: filterPublic,
      });
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load study groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGroups = async () => {
    setLoading(true);
    try {
      const response = await studyGroupsAPI.getMyGroups();
      setMyGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await studyGroupsAPI.joinGroup(groupId);
      loadAllGroups();
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group');
    }
  };

  const displayGroups = activeTab === 'all' ? groups : myGroups;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Groups</h1>
            <p className="text-gray-600">Join or create study groups to learn together</p>
          </div>
          <button
            onClick={() => navigate('/study-groups/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setActiveTab('my_groups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my_groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Groups
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      {activeTab === 'all' && (
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPublic === undefined ? 'all' : filterPublic ? 'public' : 'private'}
            onChange={(e) =>
              setFilterPublic(
                e.target.value === 'all' ? undefined : e.target.value === 'public'
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Groups</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading groups...</p>
        </div>
      ) : (
        <>
          {displayGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {activeTab === 'all' ? 'No groups found' : 'You are not a member of any groups yet'}
              </p>
              {activeTab === 'my_groups' && (
                <button
                  onClick={() => navigate('/study-groups/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Group Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {group.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          group.is_public
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {group.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    {group.course_name && (
                      <p className="text-sm text-blue-600">{group.course_name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{group.description}</p>

                  {/* Stats */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Members</span>
                      <span className="font-medium text-gray-900">
                        {group.member_count} / {group.max_members}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(group.member_count / group.max_members) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Next Session */}
                  {group.next_session && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Next Session</p>
                      <p className="text-sm font-medium text-gray-900">
                        {group.next_session.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(group.next_session.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  {group.is_member ? (
                    <Link
                      to={`/study-groups/${group.id}`}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Group
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={group.member_count >= group.max_members}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {group.member_count >= group.max_members ? 'Full' : 'Join Group'}
                    </button>
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

export default StudyGroupList;

/**
 * Teams Page
 * 팀/길드 시스템 페이지 + 팀 채팅
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeamChatPanel from '../components/teams/TeamChatPanel';

interface Team {
  id: string;
  name: string;
  description: string;
  tag: string;
  icon_emoji: string;
  banner_color: string;
  total_members: number;
  max_members: number;
  total_team_xp: number;
  team_level: number;
  team_rank?: number;
  is_public: boolean;
  join_requires_approval: boolean;
  created_at: string;
}

const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);

      // Load all public teams
      const teamsResponse = await fetch('/api/v1/gamification/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const teamsData = await teamsResponse.json();
      setTeams(teamsData);

      // Load user's teams
      const myTeamsResponse = await fetch('/api/v1/gamification/teams/my-teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const myTeamsData = await myTeamsResponse.json();
      setMyTeams(myTeamsData);

      // Auto-select first team if available
      if (myTeamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(myTeamsData[0]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert('팀 이름을 입력하세요');
      return;
    }

    try {
      const response = await fetch('/api/v1/gamification/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: new URLSearchParams({
          name: newTeamName,
          description: newTeamDescription || '',
          is_public: 'true'
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTeamName('');
        setNewTeamDescription('');
        loadTeams();
      } else {
        const error = await response.json();
        alert(error.detail || '팀 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('팀 생성에 실패했습니다');
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/v1/gamification/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadTeams();
      } else {
        const error = await response.json();
        alert(error.detail || '팀 가입에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to join team:', error);
      alert('팀 가입에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">팀을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👥 팀 채팅</h1>
              <p className="text-sm text-gray-600">함께 학습하고 경쟁하는 팀</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAllTeams(!showAllTeams)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {showAllTeams ? '내 팀 보기' : '모든 팀 보기'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                + 팀 만들기
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Team List */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                {showAllTeams ? '모든 팀' : '내 팀'}
              </h2>

              {showAllTeams ? (
                /* All Teams */
                teams.length > 0 ? (
                  <div className="space-y-2">
                    {teams.map(team => (
                      <div
                        key={team.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: team.banner_color }}
                          >
                            {team.icon_emoji}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{team.name}</h3>
                            <p className="text-xs text-gray-500">
                              {team.total_members}/{team.max_members} members • Lv.{team.team_level}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          disabled={team.total_members >= team.max_members}
                          className={`w-full py-1.5 rounded text-sm font-medium transition-colors ${
                            team.total_members >= team.max_members
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {team.total_members >= team.max_members ? '가입 불가' : '팀 가입'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">팀이 없습니다</p>
                  </div>
                )
              ) : (
                /* My Teams */
                myTeams.length > 0 ? (
                  <div className="space-y-1">
                    {myTeams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                          selectedTeam?.id === team.id
                            ? 'bg-indigo-50 border-2 border-indigo-600'
                            : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                          style={{ backgroundColor: team.banner_color }}
                        >
                          {team.icon_emoji}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900">{team.name}</h3>
                          <p className="text-xs text-gray-500">
                            {team.total_members} members • Lv.{team.team_level}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">아직 팀에 가입하지 않았습니다</p>
                    <button
                      onClick={() => setShowAllTeams(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      팀 찾아보기 →
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedTeam && user ? (
              <TeamChatPanel
                key={selectedTeam.id}
                teamId={selectedTeam.id}
                teamName={selectedTeam.name}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    팀을 선택하세요
                  </h3>
                  <p className="text-gray-600">
                    왼쪽에서 팀을 선택하여 채팅을 시작하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">새 팀 만들기</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                팀 이름 *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="예: Python Ninjas"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                팀 설명
              </label>
              <textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="팀에 대해 설명해주세요"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTeamName('');
                  setNewTeamDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;

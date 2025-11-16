/**
 * Teams Page
 * 팀/길드 시스템 페이지
 */
import React, { useEffect, useState } from 'react';

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/gamification/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setTeams(data);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 팀</h1>
            <p className="text-gray-600">함께 학습하고 경쟁하는 팀에 가입하세요</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            + 팀 만들기
          </button>
        </div>

        {/* Teams Grid */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div
                key={team.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Banner */}
                <div
                  className="h-24 flex items-center justify-center text-6xl"
                  style={{ backgroundColor: team.banner_color }}
                >
                  {team.icon_emoji}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                    {team.tag && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium">
                        {team.tag}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description || '팀 설명이 없습니다'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">멤버</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {team.total_members}/{team.max_members}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">레벨</p>
                      <p className="text-lg font-semibold text-gray-900">
                        Lv. {team.team_level}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500">팀 XP</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {team.total_team_xp.toLocaleString()}
                    </p>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={team.total_members >= team.max_members}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                      team.total_members >= team.max_members
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {team.total_members >= team.max_members ? '가입 불가' : '팀 가입'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">아직 생성된 팀이 없습니다</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              첫 번째 팀 만들기
            </button>
          </div>
        )}
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

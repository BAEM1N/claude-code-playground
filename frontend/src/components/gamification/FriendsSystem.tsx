/**
 * Friends System Component
 * 친구 목록, 친구 요청, 친구 리더보드를 통합한 컴포넌트
 */
import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../../services/api';

interface Friend {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  current_streak: number;
  is_online: boolean;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_avatar_url?: string;
  from_level: number;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  weekly_xp?: number;
  monthly_xp?: number;
  is_me: boolean;
}

const FriendsSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'leaderboard' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadFriendRequests();
    } else if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, leaderboardPeriod]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const { data } = await gamificationAPI.getFriends();
      setFriends(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load friends:', err);
      setError('친구 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const { data } = await gamificationAPI.getFriendRequests();
      setFriendRequests(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load friend requests:', err);
      setError('친구 요청을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await gamificationAPI.getFriendLeaderboard({ period: leaderboardPeriod });
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('리더보드를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const { data } = await gamificationAPI.searchUsers(searchQuery);
      setSearchResults(data);
      setError(null);
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('사용자 검색에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await gamificationAPI.sendFriendRequest(userId);
      alert('친구 요청을 보냈습니다');
      await handleSearch(); // Refresh search results
    } catch (err) {
      console.error('Failed to send friend request:', err);
      alert('친구 요청 전송에 실패했습니다');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await gamificationAPI.acceptFriendRequest(requestId);
      await loadFriendRequests();
      alert('친구 요청을 수락했습니다');
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      alert('친구 요청 수락에 실패했습니다');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await gamificationAPI.rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      alert('친구 요청 거절에 실패했습니다');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('정말로 이 친구를 삭제하시겠습니까?')) return;

    try {
      await gamificationAPI.removeFriend(friendId);
      await loadFriends();
    } catch (err) {
      console.error('Failed to remove friend:', err);
      alert('친구 삭제에 실패했습니다');
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">친구</h1>
        <p className="text-gray-600 mt-2">친구와 함께 경쟁하고 성장하세요</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 친구 목록 ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors relative ${
              activeTab === 'requests'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✉️ 친구 요청
            {friendRequests.length > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏆 리더보드
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'search'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 친구 찾기
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Friends List */}
              {activeTab === 'friends' && (
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-gray-600 mb-2">아직 친구가 없습니다</p>
                      <p className="text-sm text-gray-500">친구를 추가하고 함께 성장하세요!</p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                      >
                        친구 찾기
                      </button>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl text-white">
                            {friend.avatar_url ? (
                              <img
                                src={friend.avatar_url}
                                alt={friend.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                          {friend.is_online && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{friend.username}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>레벨 {friend.level}</span>
                            <span>•</span>
                            <span>{friend.total_xp.toLocaleString()} XP</span>
                            <span>•</span>
                            <span>🔥 {friend.current_streak}일 연속</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Friend Requests */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {friendRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">✉️</div>
                      <p className="text-gray-600">새로운 친구 요청이 없습니다</p>
                    </div>
                  ) : (
                    friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl text-white">
                          {request.from_avatar_url ? (
                            <img
                              src={request.from_avatar_url}
                              alt={request.from_username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{request.from_username}</h3>
                          <p className="text-sm text-gray-600">레벨 {request.from_level}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  {/* Period Filter */}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setLeaderboardPeriod('weekly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        leaderboardPeriod === 'weekly'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      주간
                    </button>
                    <button
                      onClick={() => setLeaderboardPeriod('monthly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        leaderboardPeriod === 'monthly'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      월간
                    </button>
                    <button
                      onClick={() => setLeaderboardPeriod('all_time')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        leaderboardPeriod === 'all_time'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      전체
                    </button>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-gray-600">리더보드가 비어있습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                            entry.is_me
                              ? 'bg-indigo-50 border-2 border-indigo-500'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`text-2xl font-bold w-12 text-center ${getRankColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white">
                            {entry.avatar_url ? (
                              <img
                                src={entry.avatar_url}
                                alt={entry.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${entry.is_me ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {entry.username} {entry.is_me && '(나)'}
                            </h3>
                            <p className="text-sm text-gray-600">레벨 {entry.level}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {leaderboardPeriod === 'weekly'
                                ? entry.weekly_xp?.toLocaleString()
                                : leaderboardPeriod === 'monthly'
                                ? entry.monthly_xp?.toLocaleString()
                                : entry.total_xp.toLocaleString()}{' '}
                              XP
                            </p>
                            <p className="text-xs text-gray-500">
                              {leaderboardPeriod === 'weekly'
                                ? '이번 주'
                                : leaderboardPeriod === 'monthly'
                                ? '이번 달'
                                : '전체'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              {activeTab === 'search' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="사용자 이름 검색..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      검색
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-gray-600">사용자를 검색해보세요</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{user.username}</h3>
                            <p className="text-sm text-gray-600">레벨 {user.level}</p>
                          </div>
                          {user.is_friend ? (
                            <span className="text-green-600 font-semibold">이미 친구입니다</span>
                          ) : user.request_sent ? (
                            <span className="text-gray-600">요청 전송됨</span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user.user_id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              친구 추가
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsSystem;

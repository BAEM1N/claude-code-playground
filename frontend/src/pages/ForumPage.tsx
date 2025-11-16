// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { Forum, ForumPost, PaginatedPostsResponse, PostType } from '../types/forum';

const ForumPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const forumId = searchParams.get('forum');
  const postType = searchParams.get('type');
  const sortBy = searchParams.get('sort') || 'recent';

  useEffect(() => {
    loadForums();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [forumId, postType, sortBy, page]);

  const loadForums = async () => {
    try {
      const { data } = await forumAPI.getForums();
      setForums(data);
    } catch (error) {
      console.error('Error loading forums:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: 20,
        sort_by: sortBy,
      };

      if (forumId) params.forum_id = parseInt(forumId);
      if (postType) params.post_type = postType;

      const { data }: { data: PaginatedPostsResponse } = await forumAPI.getPosts(params);
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">커뮤니티 포럼</h1>
              <p className="mt-2 text-gray-600">질문하고, 토론하고, 지식을 공유하세요</p>
            </div>
            <button
              onClick={() => navigate('/forum/new')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              새 글 작성
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Forums & Filters */}
          <div className="lg:col-span-1">
            {/* Forums */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">포럼 카테고리</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange('forum', null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    !forumId
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>전체</span>
                    <span className="text-xs text-gray-500">{total}</span>
                  </div>
                </button>
                {forums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => handleFilterChange('forum', forum.id.toString())}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      forumId === forum.id.toString()
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {forum.icon && <span>{forum.icon}</span>}
                        <span>{forum.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{forum.post_count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Type Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">게시글 유형</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange('type', null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    !postType ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => handleFilterChange('type', PostType.QUESTION)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    postType === PostType.QUESTION
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Q&A
                  </div>
                </button>
                <button
                  onClick={() => handleFilterChange('type', PostType.DISCUSSION)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    postType === PostType.DISCUSSION
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    토론
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Posts List */}
          <div className="lg:col-span-3">
            {/* Sort Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">정렬:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'recent', label: '최신순' },
                    { value: 'popular', label: '인기순' },
                    { value: 'votes', label: '추천순' },
                    { value: 'unanswered', label: '미답변' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sort', option.value)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        sortBy === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center text-gray-500">로딩 중...</div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center text-gray-500">게시글이 없습니다</div>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/forum/posts/${post.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Vote Section */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="text-2xl font-bold text-gray-900">{post.vote_count}</div>
                        <div className="text-xs text-gray-500">추천</div>
                      </div>

                      {/* Stats Section */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div
                          className={`text-2xl font-bold ${
                            post.reply_count > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {post.reply_count}
                        </div>
                        <div className="text-xs text-gray-500">답변</div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.is_pinned && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              고정
                            </span>
                          )}
                          {post.post_type === PostType.QUESTION && (
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                post.is_solved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {post.is_solved ? '해결됨' : 'Q&A'}
                            </span>
                          )}
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition">
                          {post.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👁 {post.view_count}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(post.last_activity_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;

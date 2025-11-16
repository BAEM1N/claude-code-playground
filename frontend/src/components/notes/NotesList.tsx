/**
 * Notes List Component
 * 학습 노트 목록 표시 및 관리
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningNotesAPI } from '../../services/api';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  course_name?: string;
}

const NotesList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [view, setView] = useState<'all' | 'favorites' | 'shared'>('all');

  useEffect(() => {
    loadNotes();
    loadTags();
  }, [selectedTag, view]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      let response;

      if (view === 'favorites') {
        response = await learningNotesAPI.getFavorites();
      } else if (view === 'shared') {
        response = await learningNotesAPI.getSharedNotes();
      } else {
        const params: any = {};
        if (selectedTag) params.tag = selectedTag;
        if (searchQuery) params.search = searchQuery;
        response = await learningNotesAPI.getNotes(params);
      }

      setNotes(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load notes:', err);
      setError('노트를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const { data } = await learningNotesAPI.getTags();
      setAllTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleSearch = () => {
    loadNotes();
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await learningNotesAPI.toggleFavorite(noteId);
      await loadNotes();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('즐겨찾기 설정에 실패했습니다');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('이 노트를 삭제하시겠습니까?')) return;

    try {
      await learningNotesAPI.deleteNote(noteId);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('노트 삭제에 실패했습니다');
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학습 노트</h1>
          <p className="text-gray-600 mt-2">나만의 학습 노트를 작성하고 관리하세요</p>
        </div>
        <Link
          to="/notes/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          + 새 노트
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="노트 검색..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            검색
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 전체 노트
          </button>
          <button
            onClick={() => setView('favorites')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'favorites'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⭐ 즐겨찾기
          </button>
          <button
            onClick={() => setView('shared')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'shared'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 공유받은 노트
          </button>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 mb-4">노트가 없습니다</p>
          <Link
            to="/notes/new"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            첫 노트 만들기
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <Link
                    to={`/notes/${note.id}`}
                    className="flex-1"
                  >
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleToggleFavorite(note.id)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {note.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>
                {note.course_name && (
                  <p className="text-sm text-gray-500 mb-2">📚 {note.course_name}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {truncateContent(note.content.replace(/[#*`]/g, ''))}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50">
                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(note.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to={`/notes/${note.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;

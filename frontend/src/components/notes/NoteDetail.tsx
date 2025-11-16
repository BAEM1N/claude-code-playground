/**
 * Note Detail Component
 * 노트 상세 보기
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { learningNotesAPI } from '../../services/api';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  course_name?: string;
}

const NoteDetail: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const { data } = await learningNotesAPI.getNote(noteId!);
      setNote(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load note:', err);
      setError('노트를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!note) return;

    try {
      await learningNotesAPI.toggleFavorite(note.id);
      setNote({ ...note, is_favorite: !note.is_favorite });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('즐겨찾기 설정에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!note || !window.confirm('이 노트를 삭제하시겠습니까?')) return;

    try {
      await learningNotesAPI.deleteNote(note.id);
      navigate('/notes');
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('노트 삭제에 실패했습니다');
    }
  };

  const renderMarkdown = (markdown: string) => {
    let html = markdown;

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) =>
      `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>${code.trim()}</code></pre>`
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-2 py-1 rounded text-sm">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>');

    // Lists
    html = html.replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-4">$1</ul>');

    // Paragraphs
    html = html.split('\n\n').map(p => p.startsWith('<') ? p : `<p class="my-4">${p}</p>`).join('\n');

    return html;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || '노트를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/notes" className="text-gray-500 hover:text-gray-700">
          ← 노트 목록
        </Link>
      </div>

      {/* Note Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Title */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex-1">{note.title}</h1>
            <button
              onClick={handleToggleFavorite}
              className="text-3xl hover:scale-110 transition-transform"
            >
              {note.is_favorite ? '⭐' : '☆'}
            </button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            {note.author_name && <span>✍️ {note.author_name}</span>}
            {note.course_name && <span>📚 {note.course_name}</span>}
            <span>📅 {new Date(note.created_at).toLocaleDateString('ko-KR')}</span>
            {note.updated_at !== note.created_at && (
              <span>✏️ {new Date(note.updated_at).toLocaleDateString('ko-KR')} 수정됨</span>
            )}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
          />
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-3">
            <Link
              to={`/notes/${note.id}/edit`}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold py-3 rounded-lg transition-colors"
            >
              ✏️ 수정
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;

/**
 * Note Editor Component
 * Markdown 에디터로 학습 노트 작성/수정
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { learningNotesAPI } from '../../services/api';

interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
  course_id?: string;
}

const NoteEditor: React.FC = () => {
  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const { data } = await learningNotesAPI.getNote(noteId!);
      setFormData({
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        course_id: data.course_id,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load note:', err);
      setError('노트를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('제목을 입력하세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (noteId) {
        await learningNotesAPI.updateNote(noteId, formData);
      } else {
        await learningNotesAPI.createNote(formData);
      }

      navigate('/notes');
    } catch (err) {
      console.error('Failed to save note:', err);
      setError('노트 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const replacement = selectedText || placeholder;

    let newText = '';
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `**${replacement}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${replacement}*`;
        cursorOffset = 1;
        break;
      case 'code':
        newText = `\`${replacement}\``;
        cursorOffset = 1;
        break;
      case 'codeblock':
        newText = `\n\`\`\`\n${replacement}\n\`\`\`\n`;
        cursorOffset = 4;
        break;
      case 'heading':
        newText = `### ${replacement}`;
        cursorOffset = 4;
        break;
      case 'list':
        newText = `\n- ${replacement}`;
        cursorOffset = 3;
        break;
      case 'link':
        newText = `[${replacement}](url)`;
        cursorOffset = 1;
        break;
      default:
        return;
    }

    const newContent =
      formData.content.substring(0, start) +
      newText +
      formData.content.substring(end);

    setFormData((prev) => ({ ...prev, content: newContent }));

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + cursorOffset,
        start + cursorOffset + replacement.length
      );
    }, 0);
  };

  // Simple markdown to HTML converter for preview
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

  if (loading && noteId) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {noteId ? '노트 수정' : '새 노트 작성'}
        </h1>
        <p className="text-gray-600 mt-2">Markdown 문법으로 노트를 작성하세요</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-lg shadow p-6">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="노트 제목을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xl font-semibold"
            required
          />
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">태그</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="태그 입력 (Enter로 추가)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              추가
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 border-r pr-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 rounded ${
                    previewMode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {previewMode ? '📝 편집' : '👁️ 미리보기'}
                </button>
              </div>
              {!previewMode && (
                <>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('heading', '제목')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-medium"
                    title="제목"
                  >
                    H
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('bold', '굵게')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-bold"
                    title="굵게"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('italic', '기울임')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm italic"
                    title="기울임"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('code', '코드')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm font-mono"
                    title="인라인 코드"
                  >
                    {'</>'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('codeblock', '코드블록')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm"
                    title="코드 블록"
                  >
                    ```
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('list', '항목')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm"
                    title="리스트"
                  >
                    • 리스트
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('link', '링크')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 rounded text-sm"
                    title="링크"
                  >
                    🔗
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {previewMode ? (
              <div
                className="prose max-w-none min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content) }}
              />
            ) : (
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="# 제목&#10;&#10;노트 내용을 Markdown으로 작성하세요...&#10;&#10;```python&#10;# 코드 예제&#10;print('Hello, World!')&#10;```"
                className="w-full min-h-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-y"
                style={{ lineHeight: '1.6' }}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? '저장 중...' : noteId ? '수정하기' : '작성하기'}
          </button>
        </div>
      </form>

      {/* Markdown Cheatsheet */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">📚 Markdown 가이드</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1"><code># 제목</code> - 큰 제목</p>
            <p className="text-gray-600 mb-1"><code>## 제목</code> - 중간 제목</p>
            <p className="text-gray-600 mb-1"><code>**굵게**</code> - 굵은 글씨</p>
            <p className="text-gray-600 mb-1"><code>*기울임*</code> - 기울임</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1"><code>`코드`</code> - 인라인 코드</p>
            <p className="text-gray-600 mb-1"><code>```코드블록```</code> - 코드 블록</p>
            <p className="text-gray-600 mb-1"><code>- 항목</code> - 리스트</p>
            <p className="text-gray-600 mb-1"><code>[링크](url)</code> - 링크</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;

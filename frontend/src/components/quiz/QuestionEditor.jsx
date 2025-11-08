import React, { useState } from 'react';
import { quizAPI } from '../../services/api';
import ErrorAlert from '../common/ErrorAlert';

const QuestionEditor = ({ quizId, question = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(question || {
    question_type: 'multiple_choice',
    question_text: '',
    points: 1,
    order: 0,
    options: [
      { id: 'a', text: '', is_correct: false },
      { id: 'b', text: '', is_correct: false },
      { id: 'c', text: '', is_correct: false },
      { id: 'd', text: '', is_correct: false },
    ],
    correct_answer: '',
    case_sensitive: false,
    explanation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (question) {
        await quizAPI.updateQuestion(question.id, formData);
      } else {
        await quizAPI.createQuestion(quizId, formData);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || '문제 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const handleCorrectChange = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index
      }))
    }));
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + formData.options.length); // a, b, c, d...
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '', is_correct: false }]
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      alert('최소 2개의 선택지가 필요합니다.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const renderTypeSpecificFields = () => {
    switch (formData.question_type) {
      case 'multiple_choice':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              선택지 *
            </label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="radio"
                    name="correct"
                    checked={option.is_correct}
                    onChange={() => handleCorrectChange(index)}
                    className="w-4 h-4 text-green-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`선택지 ${option.id.toUpperCase()}`}
                    required
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                + 선택지 추가
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              정답을 선택하세요 (라디오 버튼 클릭)
            </p>
          </div>
        );

      case 'true_false':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정답 *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="correct_answer"
                  value="true"
                  checked={formData.correct_answer === 'true'}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-3 font-medium">O (참)</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="correct_answer"
                  value="false"
                  checked={formData.correct_answer === 'false'}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-3 font-medium">X (거짓)</span>
              </label>
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정답 *
              </label>
              <input
                type="text"
                name="correct_answer"
                value={formData.correct_answer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="정확한 답을 입력하세요"
              />
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="case_sensitive"
                checked={formData.case_sensitive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">대소문자 구분</span>
            </label>
          </div>
        );

      case 'essay':
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 서술형 문제는 자동 채점되지 않으며, 교수가 직접 채점해야 합니다.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {question ? '문제 수정' : '새 문제 추가'}
      </h2>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            문제 유형 *
          </label>
          <select
            name="question_type"
            value={formData.question_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="multiple_choice">객관식</option>
            <option value="true_false">O/X</option>
            <option value="short_answer">단답형</option>
            <option value="essay">서술형</option>
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            문제 *
          </label>
          <textarea
            name="question_text"
            value={formData.question_text}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="문제를 입력하세요"
          />
        </div>

        {/* Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              배점 *
            </label>
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleChange}
              required
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              순서
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            해설 (선택)
          </label>
          <textarea
            name="explanation"
            value={formData.explanation}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="정답 해설을 입력하세요"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {loading ? '저장 중...' : question ? '수정하기' : '추가하기'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuestionEditor;

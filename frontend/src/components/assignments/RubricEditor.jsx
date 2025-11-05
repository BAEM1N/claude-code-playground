/**
 * Rubric Editor Component for creating structured grading criteria
 */
import React, { useState, useEffect } from 'react';

const RubricEditor = ({ value, onChange, maxPoints = 100 }) => {
  const [criteria, setCriteria] = useState([]);

  useEffect(() => {
    if (value && value.criteria) {
      setCriteria(value.criteria);
    }
  }, [value]);

  useEffect(() => {
    // Update parent component when criteria change
    const totalPoints = criteria.reduce((sum, c) => sum + (parseFloat(c.max_points) || 0), 0);
    onChange({
      criteria,
      total_points: totalPoints
    });
  }, [criteria]);

  const addCriterion = () => {
    const newCriterion = {
      id: `criterion-${Date.now()}`,
      name: '',
      description: '',
      max_points: 0,
      order: criteria.length
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (index, field, value) => {
    const updated = [...criteria];
    updated[index] = {
      ...updated[index],
      [field]: field === 'max_points' ? parseFloat(value) || 0 : value
    };
    setCriteria(updated);
  };

  const removeCriterion = (index) => {
    const updated = criteria.filter((_, i) => i !== index);
    // Reorder remaining criteria
    updated.forEach((c, i) => c.order = i);
    setCriteria(updated);
  };

  const moveCriterion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= criteria.length) return;

    const updated = [...criteria];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].order = index;
    updated[newIndex].order = newIndex;
    setCriteria(updated);
  };

  const getTotalPoints = () => {
    return criteria.reduce((sum, c) => sum + (parseFloat(c.max_points) || 0), 0);
  };

  const totalPoints = getTotalPoints();
  const pointsWarning = totalPoints !== maxPoints;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">채점 기준표 (Rubric)</h3>
          <p className="text-sm text-gray-500 mt-1">
            구조화된 채점 항목을 작성하면 일관된 평가가 가능합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={addCriterion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          항목 추가
        </button>
      </div>

      {/* Total Points Summary */}
      <div className={`p-4 rounded-lg border-2 ${
        pointsWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">총 배점:</span>
          <span className={`text-lg font-bold ${
            pointsWarning ? 'text-yellow-800' : 'text-green-800'
          }`}>
            {totalPoints} / {maxPoints} 점
          </span>
        </div>
        {pointsWarning && (
          <p className="text-xs text-yellow-700 mt-2">
            ⚠️ 채점 기준 합계가 과제 배점과 일치하지 않습니다.
          </p>
        )}
      </div>

      {/* Criteria List */}
      {criteria.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            채점 기준 항목이 없습니다. '항목 추가' 버튼을 클릭하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
            >
              <div className="flex items-start gap-3">
                {/* Order Controls */}
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => moveCriterion(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="위로 이동"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCriterion(index, 'down')}
                    disabled={index === criteria.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="아래로 이동"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Criterion Fields */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        항목명 *
                      </label>
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                        placeholder="예: 코드 품질"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        배점 *
                      </label>
                      <input
                        type="number"
                        value={criterion.max_points}
                        onChange={(e) => updateCriterion(index, 'max_points', e.target.value)}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      설명 및 채점 기준
                    </label>
                    <textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                      rows="2"
                      placeholder="이 항목의 채점 기준을 설명하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                  title="삭제"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RubricEditor;

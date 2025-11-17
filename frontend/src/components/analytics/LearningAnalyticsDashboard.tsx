/**
 * Learning Analytics Dashboard
 * 개인 학습 분석 대시보드
 */
import React, { useEffect, useState } from 'react';
import { learningAnalyticsAPI } from '../../services/api';
import ActivityHeatmap from './ActivityHeatmap';

interface OverviewStats {
  total_study_hours: number;
  total_activities: number;
  current_streak: number;
  longest_streak: number;
  avg_daily_hours: number;
  total_completed: number;
}

interface StudyTimeByHour {
  hour: number;
  minutes: number;
  focus_score: number;
}

interface StrengthWeakness {
  topic: string;
  score: number;
  type: 'strength' | 'weakness';
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
}

const LearningAnalyticsDashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [studyTimeByHour, setStudyTimeByHour] = useState<StudyTimeByHour[]>([]);
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState<{
    strengths: StrengthWeakness[];
    weaknesses: StrengthWeakness[];
  }>({ strengths: [], weaknesses: [] });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [
        overviewRes,
        heatmapRes,
        studyTimeRes,
        strengthsRes,
        goalsRes,
        insightsRes,
      ] = await Promise.all([
        learningAnalyticsAPI.getOverview({ days: timeRange }),
        learningAnalyticsAPI.getActivityHeatmap({ year: new Date().getFullYear() }),
        learningAnalyticsAPI.getStudyTimeByHour({ days: timeRange }),
        learningAnalyticsAPI.getStrengthsWeaknesses(),
        learningAnalyticsAPI.getGoals(),
        learningAnalyticsAPI.getInsights(),
      ]);

      setOverview(overviewRes.data);
      setHeatmapData(heatmapRes.data);
      setStudyTimeByHour(studyTimeRes.data);
      setStrengthsWeaknesses(strengthsRes.data);
      setGoals(goalsRes.data);
      setInsights(insightsRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('분석 데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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

  if (!overview) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학습 분석</h1>
          <p className="text-gray-600 mt-2">나의 학습 패턴과 성과를 분석합니다</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}일
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">총 학습 시간</p>
          <p className="text-3xl font-bold">{overview.total_study_hours.toFixed(1)}h</p>
          <p className="text-sm opacity-75 mt-2">
            평균 {overview.avg_daily_hours.toFixed(1)}h/일
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">현재 연속</p>
          <p className="text-3xl font-bold">{overview.current_streak}일</p>
          <p className="text-sm opacity-75 mt-2">
            최장 {overview.longest_streak}일
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">완료한 활동</p>
          <p className="text-3xl font-bold">{overview.total_completed}</p>
          <p className="text-sm opacity-75 mt-2">
            총 {overview.total_activities} 활동
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">집중도</p>
          <p className="text-3xl font-bold">
            {studyTimeByHour.length > 0
              ? Math.round(
                  studyTimeByHour.reduce((sum, h) => sum + h.focus_score, 0) /
                    studyTimeByHour.length
                )
              : 0}
            %
          </p>
          <p className="text-sm opacity-75 mt-2">평균 집중 점수</p>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} />

      {/* Time Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">시간대별 학습 패턴</h3>
        <div className="space-y-2">
          {studyTimeByHour.map((item) => {
            const maxMinutes = Math.max(...studyTimeByHour.map((h) => h.minutes));
            const percentage = maxMinutes > 0 ? (item.minutes / maxMinutes) * 100 : 0;

            return (
              <div key={item.hour} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {item.hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all"
                    style={{ width: `${percentage}%` }}
                  >
                    {item.minutes > 0 && `${item.minutes}분`}
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  집중도 {item.focus_score}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💪</span> 강점
          </h3>
          {strengthsWeaknesses.strengths.length === 0 ? (
            <p className="text-gray-500 text-sm">데이터가 충분하지 않습니다</p>
          ) : (
            <div className="space-y-3">
              {strengthsWeaknesses.strengths.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{item.topic}</span>
                    <span className="text-green-600 font-semibold">{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📚</span> 개선 필요
          </h3>
          {strengthsWeaknesses.weaknesses.length === 0 ? (
            <p className="text-gray-500 text-sm">데이터가 충분하지 않습니다</p>
          ) : (
            <div className="space-y-3">
              {strengthsWeaknesses.weaknesses.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{item.topic}</span>
                    <span className="text-orange-600 font-semibold">{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">학습 목표</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = getProgressPercentage(goal.current, goal.target);
              const isCompleted = progress >= 100;

              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                    {isCompleted && <span className="text-green-600 text-xl">✓</span>}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    마감: {new Date(goal.deadline).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span> AI 인사이트
          </h3>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-gray-700 flex-1">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningAnalyticsDashboard;

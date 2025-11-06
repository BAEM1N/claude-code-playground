import React from 'react';
import { useLearningProgress, useAchievements, useLearningActivities } from '../../hooks/useProgress';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const ProgressDashboard = ({ courseId }) => {
  const { data: progress, isLoading: progressLoading, error: progressError } = useLearningProgress(courseId);
  const { data: achievements = [] } = useAchievements(courseId);
  const { data: activities = [] } = useLearningActivities(courseId, null, { limit: 5 });

  if (progressLoading) return <LoadingSpinner />;
  if (progressError) return <ErrorAlert message={progressError?.message || '진도 정보를 불러오는데 실패했습니다.'} />;
  if (!progress) return null;

  const recent_achievements = achievements.slice(0, 5);
  const recent_activities = activities;

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">레벨</div>
          <div className="text-3xl font-bold text-blue-600">{progress.level}</div>
          <div className="text-xs text-gray-500 mt-1">
            {progress.experience_points} XP
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">총 포인트</div>
          <div className="text-3xl font-bold text-green-600">{progress.total_points}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">출석률</div>
          <div className="text-3xl font-bold text-purple-600">
            {progress.attendance_rate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">평균 성적</div>
          <div className="text-3xl font-bold text-orange-600">
            {progress.average_grade ? progress.average_grade.toFixed(1) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">학습 연속 기록</h3>
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-gray-600">현재 연속</div>
            <div className="text-2xl font-bold text-orange-500">
              🔥 {progress.current_streak_days}일
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">최고 기록</div>
            <div className="text-2xl font-bold text-blue-500">
              ⭐ {progress.longest_streak_days}일
            </div>
          </div>
        </div>
      </div>

      {/* Assignment & Quiz Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">과제 진행도</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>완료 / 전체</span>
              <span className="font-semibold">
                {progress.completed_assignments} / {progress.total_assignments}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${progress.total_assignments > 0
                    ? (progress.completed_assignments / progress.total_assignments * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">퀴즈 진행도</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>완료 / 전체</span>
              <span className="font-semibold">
                {progress.completed_quizzes} / {progress.total_quizzes}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${progress.total_quizzes > 0
                    ? (progress.completed_quizzes / progress.total_quizzes * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recent_achievements && recent_achievements.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">최근 업적</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recent_achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl">{achievement.icon || '🏆'}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{achievement.title}</div>
                  <div className="text-xs text-gray-600">{achievement.description}</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    +{achievement.points_earned} 포인트
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {recent_activities && recent_activities.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
          <div className="space-y-2">
            {recent_activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="text-sm text-gray-700">{activity.activity_description}</div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.activity_date).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;

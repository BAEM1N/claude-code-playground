/**
 * Learning Progress hooks with React Query
 * Handles student progress tracking, achievements, milestones, and activities
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { progressAPI } from '../services/api';

/**
 * Hook for fetching student's learning progress in a course
 *
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID (optional, defaults to current user)
 * @returns {Object} React Query result
 */
export const useLearningProgress = (courseId, studentId = null) => {
  return useQuery(
    ['learningProgress', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => progressAPI.getProgress(courseId, studentId)
        : () => progressAPI.getMyProgress(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2분 - 진행도는 자주 업데이트될 수 있음
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching all students' progress in a course (instructor)
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useCourseProgress = (courseId) => {
  return useQuery(
    ['courseProgress', courseId],
    async () => {
      const { data } = await progressAPI.getCourseProgress(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3분
    }
  );
};

/**
 * Hook for fetching student's achievements
 *
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID (optional)
 * @returns {Object} React Query result
 */
export const useAchievements = (courseId, studentId = null) => {
  return useQuery(
    ['achievements', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => progressAPI.getAchievements(courseId, studentId)
        : () => progressAPI.getMyAchievements(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000, // 5분 - 업적은 자주 바뀌지 않음
    }
  );
};

/**
 * Hook for fetching learning activities
 *
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID (optional)
 * @param {Object} params - Additional query parameters (limit, offset, etc.)
 * @returns {Object} React Query result
 */
export const useLearningActivities = (courseId, studentId = null, params = {}) => {
  return useQuery(
    ['learningActivities', courseId, studentId, params],
    async () => {
      const endpoint = studentId
        ? () => progressAPI.getActivities(courseId, studentId, params)
        : () => progressAPI.getMyActivities(courseId, params);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 1 * 60 * 1000, // 1분 - 활동은 실시간으로 추적
    }
  );
};

/**
 * Hook for fetching course milestones
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useMilestones = (courseId) => {
  return useQuery(
    ['milestones', courseId],
    async () => {
      const { data } = await progressAPI.getMilestones(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
};

/**
 * Hook for fetching student's milestone completions
 *
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID (optional)
 * @returns {Object} React Query result
 */
export const useMilestoneCompletions = (courseId, studentId = null) => {
  return useQuery(
    ['milestoneCompletions', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => progressAPI.getMilestoneCompletions(courseId, studentId)
        : () => progressAPI.getMyMilestoneCompletions(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3분
    }
  );
};

/**
 * Hook for fetching leaderboard
 *
 * @param {string} courseId - Course ID
 * @param {Object} params - Query parameters (limit, metric, etc.)
 * @returns {Object} React Query result
 */
export const useLeaderboard = (courseId, params = {}) => {
  return useQuery(
    ['leaderboard', courseId, params],
    async () => {
      const { data } = await progressAPI.getLeaderboard(courseId, params);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for fetching progress statistics
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useProgressStatistics = (courseId) => {
  return useQuery(
    ['progressStatistics', courseId],
    async () => {
      const { data } = await progressAPI.getStatistics(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3분
    }
  );
};

/**
 * Hook for tracking a learning activity
 *
 * @returns {Object} useMutation result
 */
export const useTrackActivity = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, activityData }) => progressAPI.trackActivity(courseId, activityData),
    {
      onSuccess: (data, variables) => {
        // Invalidate progress and activities
        queryClient.invalidateQueries(['learningProgress', variables.courseId]);
        queryClient.invalidateQueries(['learningActivities', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for manually updating progress (instructor)
 *
 * @returns {Object} useMutation result
 */
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId, progressData }) =>
      progressAPI.updateProgress(courseId, studentId, progressData),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['courseProgress', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for creating a milestone
 *
 * @returns {Object} useMutation result
 */
export const useCreateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, milestoneData }) => progressAPI.createMilestone(courseId, milestoneData),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['milestones', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating a milestone
 *
 * @returns {Object} useMutation result
 */
export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ milestoneId, milestoneData }) => progressAPI.updateMilestone(milestoneId, milestoneData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones']);
      },
    }
  );
};

/**
 * Hook for deleting a milestone
 *
 * @returns {Object} useMutation result
 */
export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (milestoneId) => progressAPI.deleteMilestone(milestoneId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones']);
      },
    }
  );
};

/**
 * Hook for awarding an achievement
 *
 * @returns {Object} useMutation result
 */
export const useAwardAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId, achievementData }) =>
      progressAPI.awardAchievement(courseId, studentId, achievementData),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['achievements', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
      },
    }
  );
};

/**
 * Hook for recalculating progress (instructor/system)
 *
 * @returns {Object} useMutation result
 */
export const useRecalculateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId }) => progressAPI.recalculateProgress(courseId, studentId),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['courseProgress', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for exporting progress data
 *
 * @returns {Object} useMutation result
 */
export const useExportProgress = () => {
  return useMutation(
    ({ courseId, format = 'csv' }) => progressAPI.exportProgress(courseId, format),
    {
      // No query invalidation needed for export
    }
  );
};

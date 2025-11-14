/**
 * Learning Progress hooks with React Query
 * Handles student progress tracking, achievements, milestones, and activities
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { progressAPI } from '../services/api';
import { Progress, Achievement, Milestone } from '../types';

interface TrackActivityParams {
  courseId: string;
  activityData: any;
}

interface UpdateProgressParams {
  courseId: string;
  studentId: string;
  progressData: any;
}

interface CreateMilestoneParams {
  courseId: string;
  milestoneData: Partial<Milestone>;
}

interface UpdateMilestoneParams {
  milestoneId: string;
  milestoneData: Partial<Milestone>;
}

interface AwardAchievementParams {
  courseId: string;
  studentId: string;
  achievementData: Partial<Achievement>;
}

interface RecalculateProgressParams {
  courseId: string;
  studentId: string;
}

interface ExportProgressParams {
  courseId: string;
  format?: string;
}

/**
 * Hook for fetching student's learning progress in a course
 */
export const useLearningProgress = (courseId: string, studentId: string | null = null): UseQueryResult<Progress, AxiosError> => {
  return useQuery(
    ['learningProgress', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => (progressAPI as any).getProgress(courseId, studentId)
        : () => (progressAPI as any).getMyProgress(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching all students' progress in a course (instructor)
 */
export const useCourseProgress = (courseId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['courseProgress', courseId],
    async () => {
      const { data } = await (progressAPI as any).getCourseProgress(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching student's achievements
 */
export const useAchievements = (courseId: string, studentId: string | null = null): UseQueryResult<Achievement[], AxiosError> => {
  return useQuery(
    ['achievements', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => (progressAPI as any).getAchievements(courseId, studentId)
        : () => (progressAPI as any).getAchievements(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching learning activities
 */
export const useLearningActivities = (courseId: string, studentId: string | null = null, params: any = {}): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['learningActivities', courseId, studentId, params],
    async () => {
      const endpoint = studentId
        ? () => (progressAPI as any).getActivities(courseId, studentId, params)
        : () => (progressAPI as any).getMyActivities(courseId, params);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching course milestones
 */
export const useMilestones = (courseId: string): UseQueryResult<Milestone[], AxiosError> => {
  return useQuery(
    ['milestones', courseId],
    async () => {
      const { data } = await (progressAPI as any).getMilestones(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching student's milestone completions
 */
export const useMilestoneCompletions = (courseId: string, studentId: string | null = null): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['milestoneCompletions', courseId, studentId],
    async () => {
      const endpoint = studentId
        ? () => (progressAPI as any).getMilestoneCompletions(courseId, studentId)
        : () => (progressAPI as any).getMyMilestoneCompletions(courseId);
      const { data } = await endpoint();
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching leaderboard
 */
export const useLeaderboard = (courseId: string, params: any = {}): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['leaderboard', courseId, params],
    async () => {
      const { data } = await (progressAPI as any).getLeaderboard(courseId, params.limit || 10);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching progress statistics
 */
export const useProgressStatistics = (courseId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['progressStatistics', courseId],
    async () => {
      const { data } = await (progressAPI as any).getStatistics(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000,
    }
  );
};

/**
 * Hook for tracking a learning activity
 */
export const useTrackActivity = (): UseMutationResult<any, AxiosError, TrackActivityParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId: _courseId, activityData }: TrackActivityParams) => (progressAPI as any).logActivity(activityData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['learningProgress', variables.courseId]);
        queryClient.invalidateQueries(['learningActivities', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for manually updating progress (instructor)
 */
export const useUpdateProgress = (): UseMutationResult<any, AxiosError, UpdateProgressParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId, progressData }: UpdateProgressParams) =>
      (progressAPI as any).updateProgress(courseId, studentId, progressData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['courseProgress', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for creating a milestone
 */
export const useCreateMilestone = (): UseMutationResult<Milestone, AxiosError, CreateMilestoneParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId: _courseId, milestoneData }: CreateMilestoneParams) => (progressAPI as any).create(milestoneData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['milestones', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating a milestone
 */
export const useUpdateMilestone = (): UseMutationResult<Milestone, AxiosError, UpdateMilestoneParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ milestoneId, milestoneData }: UpdateMilestoneParams) => (progressAPI as any).update(milestoneId, milestoneData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones']);
      },
    }
  );
};

/**
 * Hook for deleting a milestone
 */
export const useDeleteMilestone = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (milestoneId: string) => (progressAPI as any).delete(milestoneId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones']);
      },
    }
  );
};

/**
 * Hook for awarding an achievement
 */
export const useAwardAchievement = (): UseMutationResult<any, AxiosError, AwardAchievementParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId, achievementData }: AwardAchievementParams) =>
      (progressAPI as any).awardAchievement(courseId, studentId, achievementData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['achievements', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
      },
    }
  );
};

/**
 * Hook for recalculating progress (instructor/system)
 */
export const useRecalculateProgress = (): UseMutationResult<any, AxiosError, RecalculateProgressParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, studentId }: RecalculateProgressParams) => (progressAPI as any).recalculateProgress(courseId, studentId),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['learningProgress', variables.courseId, variables.studentId]);
        queryClient.invalidateQueries(['courseProgress', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for exporting progress data
 */
export const useExportProgress = (): UseMutationResult<any, AxiosError, ExportProgressParams> => {
  return useMutation(
    ({ courseId, format = 'csv' }: ExportProgressParams) => (progressAPI as any).exportProgress(courseId, format),
    {
      // No query invalidation needed for export
    }
  );
};

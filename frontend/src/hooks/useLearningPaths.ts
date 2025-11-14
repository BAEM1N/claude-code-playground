/**
 * Learning Paths related hooks with React Query
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { learningPathsAPI } from '../services/api';
import {
  LearningPath,
  LearningPathWithProgress,
  LearningPathCreateRequest,
  RecommendationsResponse,
  EnrollmentResponse,
  UserPathItemProgressUpdate,
  UserPathItemProgress,
  UserLearningStats,
} from '../types/learningPath';

/**
 * Hook for fetching all learning paths
 */
export const useLearningPaths = (
  params?: { difficulty?: string; tag?: string }
): UseQueryResult<LearningPath[], AxiosError> => {
  return useQuery(
    ['learningPaths', params],
    async () => {
      const { data } = await learningPathsAPI.getLearningPaths(params);
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

/**
 * Hook for fetching a single learning path with user progress
 */
export const useLearningPath = (
  pathId: number | undefined
): UseQueryResult<LearningPathWithProgress, AxiosError> => {
  return useQuery(
    ['learningPath', pathId],
    async () => {
      if (!pathId) throw new Error('Path ID is required');
      const { data } = await learningPathsAPI.getLearningPath(pathId);
      return data;
    },
    {
      enabled: !!pathId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook for creating a learning path (instructor only)
 */
export const useCreateLearningPath = (): UseMutationResult<
  LearningPath,
  AxiosError,
  LearningPathCreateRequest
> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (request: LearningPathCreateRequest) => {
      const { data } = await learningPathsAPI.createLearningPath(request);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learningPaths']);
      },
    }
  );
};

/**
 * Hook for enrolling in a learning path
 */
export const useEnrollInPath = (): UseMutationResult<
  EnrollmentResponse,
  AxiosError,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (pathId: number) => {
      const { data } = await learningPathsAPI.enrollInPath(pathId);
      return data;
    },
    {
      onSuccess: (data, pathId) => {
        // Invalidate path detail to refresh progress
        queryClient.invalidateQueries(['learningPath', pathId]);
        queryClient.invalidateQueries(['learningPathRecommendations']);
        queryClient.invalidateQueries(['learningPathStats']);
      },
    }
  );
};

/**
 * Hook for updating item progress
 */
export const useUpdateItemProgress = (): UseMutationResult<
  UserPathItemProgress,
  AxiosError,
  { itemId: number; data: UserPathItemProgressUpdate; pathId?: number }
> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ itemId, data }) => {
      const { data: response } = await learningPathsAPI.updateItemProgress(itemId, data);
      return response;
    },
    {
      onSuccess: (data, variables) => {
        // Invalidate path detail to refresh progress
        if (variables.pathId) {
          queryClient.invalidateQueries(['learningPath', variables.pathId]);
        }
        queryClient.invalidateQueries(['learningPathStats']);
      },
    }
  );
};

/**
 * Hook for getting learning path recommendations
 */
export const useLearningPathRecommendations = (
  limit: number = 10
): UseQueryResult<RecommendationsResponse, AxiosError> => {
  return useQuery(
    ['learningPathRecommendations', limit],
    async () => {
      const { data } = await learningPathsAPI.getRecommendations(limit);
      return data;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

/**
 * Hook for getting user's learning statistics
 */
export const useLearningStats = (): UseQueryResult<UserLearningStats, AxiosError> => {
  return useQuery(
    ['learningPathStats'],
    async () => {
      const { data } = await learningPathsAPI.getMyStats();
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

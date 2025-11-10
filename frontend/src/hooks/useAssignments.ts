/**
 * Assignment hooks with React Query
 * Refactored to use React Query for better caching and state management
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { assignmentsAPI } from '../services/api';
import { Assignment, AssignmentSubmission, Grade } from '../types';
interface CreateAssignmentParams {
  courseId: string;
  assignmentData: Partial<Assignment>;
}

interface UpdateAssignmentParams {
  assignmentId: string;
  assignmentData: Partial<Assignment>;
}

interface SubmitAssignmentParams {
  assignmentId: string;
  submissionData: Partial<AssignmentSubmission>;
}

interface GradeSubmissionParams {
  submissionId: string;
  gradeData: Partial<Grade>;
}

/**
 * Hook for fetching assignments list
 *
 * @param courseId - Course ID
 * @param includeUnpublished - Include unpublished assignments (for instructors)
 * @returns React Query result
 */
export const useAssignments = (
  courseId: string,
  includeUnpublished: boolean = false
): UseQueryResult<Assignment[], AxiosError> => {
  return useQuery(
    ['assignments', courseId, includeUnpublished],
    async () => {
      const { data } = await assignmentsAPI.getAssignments(courseId, {
        include_unpublished: includeUnpublished,
      });
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3분
      cacheTime: 10 * 60 * 1000, // 10분
    }
  );
};

/**
 * Legacy wrapper for backward compatibility
 * Returns old API: { assignments, loading, error, refetch }
 */
export const useAssignmentsLegacy = (courseId: string, includeUnpublished: boolean = false) => {
  const query = useAssignments(courseId, includeUnpublished);
  return {
    assignments: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching single assignment
 *
 * @param assignmentId - Assignment ID
 * @returns React Query result
 */
export const useAssignment = (assignmentId: string): UseQueryResult<Assignment, AxiosError> => {
  return useQuery(
    ['assignment', assignmentId],
    async () => {
      const { data } = await assignmentsAPI.getAssignment(assignmentId);
      return data;
    },
    {
      enabled: !!assignmentId,
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
};

/**
 * Legacy wrapper for useAssignment
 */
export const useAssignmentLegacy = (assignmentId: string) => {
  const query = useAssignment(assignmentId);
  return {
    assignment: query.data || null,
    loading: query.isLoading,
    error: query.error?.message || null,
  };
};

/**
 * Hook for fetching assignment statistics
 *
 * @param assignmentId - Assignment ID
 * @returns React Query result
 */
export const useAssignmentStats = (assignmentId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['assignmentStats', assignmentId],
    async () => {
      const { data } = await assignmentsAPI.getAssignmentStats(assignmentId);
      return data;
    },
    {
      enabled: !!assignmentId,
      staleTime: 2 * 60 * 1000, // 2분 - 통계는 자주 변경될 수 있음
    }
  );
};

/**
 * Legacy wrapper for useAssignmentStats
 */
export const useAssignmentStatsLegacy = (assignmentId: string) => {
  const query = useAssignmentStats(assignmentId);
  return {
    stats: query.data || null,
    loading: query.isLoading,
    error: query.error?.message || null,
  };
};

/**
 * Hook for fetching student's submission
 *
 * @param assignmentId - Assignment ID
 * @returns React Query result
 */
export const useMySubmission = (assignmentId: string): UseQueryResult<AssignmentSubmission | null, AxiosError> => {
  return useQuery(
    ['mySubmission', assignmentId],
    async () => {
      try {
        const { data } = await assignmentsAPI.getMySubmission(assignmentId);
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return null; // No submission yet
        }
        throw err;
      }
    },
    {
      enabled: !!assignmentId,
      staleTime: 1 * 60 * 1000, // 1분 - 제출 상태는 자주 확인
      retry: false, // Don't retry on 404
    }
  );
};

/**
 * Legacy wrapper for useMySubmission
 */
export const useMySubmissionLegacy = (assignmentId: string) => {
  const query = useMySubmission(assignmentId);
  return {
    submission: query.data || null,
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching all submissions (instructor/assistant)
 *
 * @param assignmentId - Assignment ID
 * @returns React Query result
 */
export const useSubmissions = (assignmentId: string): UseQueryResult<AssignmentSubmission[], AxiosError> => {
  return useQuery(
    ['submissions', assignmentId],
    async () => {
      const { data } = await assignmentsAPI.getSubmissions(assignmentId);
      return data;
    },
    {
      enabled: !!assignmentId,
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Legacy wrapper for useSubmissions
 */
export const useSubmissionsLegacy = (assignmentId: string) => {
  const query = useSubmissions(assignmentId);
  return {
    submissions: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
};

/**
 * Hook for creating an assignment
 *
 * @returns useMutation result
 */
export const useCreateAssignment = (): UseMutationResult<any, AxiosError, CreateAssignmentParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, assignmentData }: CreateAssignmentParams) => assignmentsAPI.createAssignment(courseId, assignmentData),
    {
      onSuccess: (_data, variables) => {
        // Invalidate assignments list for this course
        queryClient.invalidateQueries(['assignments', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating an assignment
 *
 * @returns useMutation result
 */
export const useUpdateAssignment = (): UseMutationResult<any, AxiosError, UpdateAssignmentParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ assignmentId, assignmentData }: UpdateAssignmentParams) => assignmentsAPI.updateAssignment(assignmentId, assignmentData),
    {
      onSuccess: (_data, variables) => {
        // Invalidate specific assignment and its list
        queryClient.invalidateQueries(['assignment', variables.assignmentId]);
        queryClient.invalidateQueries(['assignments']);
      },
    }
  );
};

/**
 * Hook for deleting an assignment
 *
 * @returns useMutation result
 */
export const useDeleteAssignment = (): UseMutationResult<any, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (assignmentId: string) => assignmentsAPI.deleteAssignment(assignmentId),
    {
      onSuccess: () => {
        // Invalidate all assignments queries
        queryClient.invalidateQueries(['assignments']);
      },
    }
  );
};

/**
 * Hook for submitting an assignment
 *
 * @returns useMutation result
 */
export const useSubmitAssignment = (): UseMutationResult<any, AxiosError, SubmitAssignmentParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ assignmentId, submissionData }: SubmitAssignmentParams) => assignmentsAPI.submitAssignment(assignmentId, submissionData),
    {
      onSuccess: (_data, variables) => {
        // Invalidate my submission and assignment stats
        queryClient.invalidateQueries(['mySubmission', variables.assignmentId]);
        queryClient.invalidateQueries(['assignmentStats', variables.assignmentId]);
        queryClient.invalidateQueries(['submissions', variables.assignmentId]);
      },
    }
  );
};

/**
 * Hook for grading a submission
 *
 * @returns useMutation result
 */
export const useGradeSubmission = (): UseMutationResult<any, AxiosError, GradeSubmissionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ submissionId, gradeData }: GradeSubmissionParams) => assignmentsAPI.gradeSubmission(submissionId, gradeData),
    {
      onSuccess: () => {
        // Invalidate submissions and stats
        queryClient.invalidateQueries(['submissions']);
        queryClient.invalidateQueries(['assignmentStats']);
      },
    }
  );
};

/**
 * Assignment hooks with React Query
 * Refactored to use React Query for better caching and state management
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { assignmentsAPI } from '../services/api';

/**
 * Hook for fetching assignments list
 *
 * @param {string} courseId - Course ID
 * @param {boolean} includeUnpublished - Include unpublished assignments (for instructors)
 * @returns {Object} React Query result
 */
export const useAssignments = (courseId, includeUnpublished = false) => {
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
export const useAssignmentsLegacy = (courseId, includeUnpublished = false) => {
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
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} React Query result
 */
export const useAssignment = (assignmentId) => {
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
export const useAssignmentLegacy = (assignmentId) => {
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
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} React Query result
 */
export const useAssignmentStats = (assignmentId) => {
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
export const useAssignmentStatsLegacy = (assignmentId) => {
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
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} React Query result
 */
export const useMySubmission = (assignmentId) => {
  return useQuery(
    ['mySubmission', assignmentId],
    async () => {
      try {
        const { data } = await assignmentsAPI.getMySubmission(assignmentId);
        return data;
      } catch (err) {
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
export const useMySubmissionLegacy = (assignmentId) => {
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
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} React Query result
 */
export const useSubmissions = (assignmentId) => {
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
export const useSubmissionsLegacy = (assignmentId) => {
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
 * @returns {Object} useMutation result
 */
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, assignmentData }) => assignmentsAPI.createAssignment(courseId, assignmentData),
    {
      onSuccess: (data, variables) => {
        // Invalidate assignments list for this course
        queryClient.invalidateQueries(['assignments', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating an assignment
 *
 * @returns {Object} useMutation result
 */
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ assignmentId, assignmentData }) => assignmentsAPI.updateAssignment(assignmentId, assignmentData),
    {
      onSuccess: (data, variables) => {
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
 * @returns {Object} useMutation result
 */
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (assignmentId) => assignmentsAPI.deleteAssignment(assignmentId),
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
 * @returns {Object} useMutation result
 */
export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ assignmentId, submissionData }) => assignmentsAPI.submitAssignment(assignmentId, submissionData),
    {
      onSuccess: (data, variables) => {
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
 * @returns {Object} useMutation result
 */
export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ submissionId, gradeData }) => assignmentsAPI.gradeSubmission(submissionId, gradeData),
    {
      onSuccess: (data, variables) => {
        // Invalidate submissions and stats
        queryClient.invalidateQueries(['submissions']);
        queryClient.invalidateQueries(['assignmentStats']);
      },
    }
  );
};

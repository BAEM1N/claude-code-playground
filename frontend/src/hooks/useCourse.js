/**
 * Course related hooks with React Query
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { coursesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for fetching user's role in a specific course
 *
 * @param {string} courseId - Course ID
 * @returns {Object} { role, isLoading, error }
 */
export const useCourseRole = (courseId) => {
  const { user } = useAuth();

  return useQuery(
    ['courseRole', courseId, user?.id],
    async () => {
      if (!courseId || !user?.id) {
        return null;
      }

      try {
        const { data } = await coursesAPI.getMembers(courseId);
        const member = data.find((m) => m.user_id === user.id);
        return member?.role || 'student';
      } catch (error) {
        console.error('Failed to fetch course role:', error);
        return 'student'; // Default to student on error
      }
    },
    {
      enabled: !!courseId && !!user?.id,
      staleTime: 10 * 60 * 1000, // 10분 - 역할은 자주 바뀌지 않음
      cacheTime: 30 * 60 * 1000, // 30분
      retry: 2,
    }
  );
};

/**
 * Hook for fetching a single course
 *
 * @param {string} courseId - Course ID
 * @returns {Object} { data: course, isLoading, error, refetch }
 */
export const useCourse = (courseId) => {
  return useQuery(
    ['course', courseId],
    async () => {
      const { data } = await coursesAPI.getCourse(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching all courses
 *
 * @returns {Object} { data: courses, isLoading, error, refetch }
 */
export const useCourses = () => {
  return useQuery(
    ['courses'],
    async () => {
      const { data } = await coursesAPI.getMyCourses();
      return data;
    },
    {
      staleTime: 3 * 60 * 1000, // 3분
    }
  );
};

/**
 * Hook for fetching course members
 *
 * @param {string} courseId - Course ID
 * @returns {Object} { data: members, isLoading, error, refetch }
 */
export const useCourseMembers = (courseId) => {
  return useQuery(
    ['courseMembers', courseId],
    async () => {
      const { data } = await coursesAPI.getMembers(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for creating a course
 *
 * @returns {Object} useMutation object
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (courseData) => coursesAPI.createCourse(courseData),
    {
      onSuccess: () => {
        // Invalidate and refetch courses list
        queryClient.invalidateQueries(['courses']);
      },
    }
  );
};

/**
 * Hook for updating a course
 *
 * @returns {Object} useMutation object
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, courseData }) => coursesAPI.updateCourse(courseId, courseData),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific course and courses list
        queryClient.invalidateQueries(['course', variables.courseId]);
        queryClient.invalidateQueries(['courses']);
      },
    }
  );
};

/**
 * Hook for deleting a course
 *
 * @returns {Object} useMutation object
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (courseId) => coursesAPI.deleteCourse(courseId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses']);
      },
    }
  );
};

/**
 * Course related hooks with React Query
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { coursesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Course, User } from '../types';

interface UpdateCourseParams {
  courseId: string;
  courseData: Partial<Course>;
}

/**
 * Hook for fetching user's role in a specific course
 *
 * @param courseId - Course ID
 * @returns { role, isLoading, error }
 */
export const useCourseRole = (courseId: string): UseQueryResult<string | null, AxiosError> => {
  const { user } = useAuth();

  return useQuery(
    ['courseRole', courseId, user?.id],
    async () => {
      if (!courseId || !user?.id) {
        return null;
      }

      try {
        const { data } = await coursesAPI.getMembers(courseId);
        const member = data.find((m: any) => m.user_id === user.id);
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
 * @param courseId - Course ID
 * @returns { data: course, isLoading, error, refetch }
 */
export const useCourse = (courseId: string): UseQueryResult<Course, AxiosError> => {
  return useQuery(
    ['course', courseId],
    async () => {
      const { data } = await coursesAPI.getOne(courseId);
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
 * @returns { data: courses, isLoading, error, refetch }
 */
export const useCourses = (): UseQueryResult<Course[], AxiosError> => {
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
 * @param courseId - Course ID
 * @returns { data: members, isLoading, error, refetch }
 */
export const useCourseMembers = (courseId: string): UseQueryResult<User[], AxiosError> => {
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
 * @returns useMutation object
 */
export const useCreateCourse = (): UseMutationResult<Course, AxiosError, Partial<Course>> => {
  const queryClient = useQueryClient();

  return useMutation(
    (courseData: Partial<Course>) => coursesAPI.create(courseData),
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
 * @returns useMutation object
 */
export const useUpdateCourse = (): UseMutationResult<Course, AxiosError, UpdateCourseParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, courseData }: UpdateCourseParams) => coursesAPI.update(courseId, courseData),
    {
      onSuccess: (_data, variables) => {
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
 * @returns useMutation object
 */
export const useDeleteCourse = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (courseId: string) => coursesAPI.delete(courseId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses']);
      },
    }
  );
};

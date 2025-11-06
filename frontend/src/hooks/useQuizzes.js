/**
 * Quiz hooks with React Query
 * Handles quiz data fetching, caching, and mutations
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { quizAPI } from '../services/api';

/**
 * Hook for fetching quizzes list
 *
 * @param {string} courseId - Course ID
 * @param {Object} params - Additional query parameters
 * @returns {Object} React Query result
 */
export const useQuizzes = (courseId, params = {}) => {
  return useQuery(
    ['quizzes', courseId, params],
    async () => {
      const { data } = await quizAPI.getQuizzes(courseId, params);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2분
      cacheTime: 10 * 60 * 1000, // 10분
    }
  );
};

/**
 * Hook for fetching a single quiz
 *
 * @param {string} quizId - Quiz ID
 * @returns {Object} React Query result
 */
export const useQuiz = (quizId) => {
  return useQuery(
    ['quiz', quizId],
    async () => {
      const { data } = await quizAPI.getQuiz(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
};

/**
 * Hook for fetching quiz questions
 *
 * @param {string} quizId - Quiz ID
 * @returns {Object} React Query result
 */
export const useQuizQuestions = (quizId) => {
  return useQuery(
    ['quizQuestions', quizId],
    async () => {
      const { data } = await quizAPI.getQuestions(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
};

/**
 * Hook for fetching quiz attempts
 *
 * @param {string} quizId - Quiz ID
 * @returns {Object} React Query result
 */
export const useQuizAttempts = (quizId) => {
  return useQuery(
    ['quizAttempts', quizId],
    async () => {
      const { data } = await quizAPI.getAttempts(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 1 * 60 * 1000, // 1분 - 시도 정보는 자주 변경될 수 있음
    }
  );
};

/**
 * Hook for fetching a single quiz attempt
 *
 * @param {string} attemptId - Attempt ID
 * @returns {Object} React Query result
 */
export const useQuizAttempt = (attemptId) => {
  return useQuery(
    ['quizAttempt', attemptId],
    async () => {
      const { data } = await quizAPI.getAttempt(attemptId);
      return data;
    },
    {
      enabled: !!attemptId,
      staleTime: 30 * 1000, // 30초 - 진행중인 시도는 실시간 업데이트 필요
    }
  );
};

/**
 * Hook for fetching quiz statistics
 *
 * @param {string} quizId - Quiz ID
 * @returns {Object} React Query result
 */
export const useQuizStatistics = (quizId) => {
  return useQuery(
    ['quizStatistics', quizId],
    async () => {
      const { data } = await quizAPI.getStatistics(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for creating a quiz
 *
 * @returns {Object} useMutation result
 */
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizData) => quizAPI.createQuiz(quizData),
    {
      onSuccess: (data) => {
        // Invalidate quizzes list for this course
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for updating a quiz
 *
 * @returns {Object} useMutation result
 */
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ quizId, quizData }) => quizAPI.updateQuiz(quizId, quizData),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific quiz and quizzes list
        queryClient.invalidateQueries(['quiz', variables.quizId]);
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for deleting a quiz
 *
 * @returns {Object} useMutation result
 */
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizId) => quizAPI.deleteQuiz(quizId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for creating a question
 *
 * @returns {Object} useMutation result
 */
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ quizId, questionData }) => quizAPI.createQuestion(quizId, questionData),
    {
      onSuccess: (data, variables) => {
        // Invalidate questions list for this quiz
        queryClient.invalidateQueries(['quizQuestions', variables.quizId]);
        queryClient.invalidateQueries(['quiz', variables.quizId]);
      },
    }
  );
};

/**
 * Hook for updating a question
 *
 * @returns {Object} useMutation result
 */
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ questionId, questionData }) => quizAPI.updateQuestion(questionId, questionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizQuestions']);
      },
    }
  );
};

/**
 * Hook for deleting a question
 *
 * @returns {Object} useMutation result
 */
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (questionId) => quizAPI.deleteQuestion(questionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizQuestions']);
      },
    }
  );
};

/**
 * Hook for starting a quiz
 *
 * @returns {Object} useMutation result
 */
export const useStartQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizId) => quizAPI.startQuiz(quizId),
    {
      onSuccess: (data, variables) => {
        // Invalidate attempts list for this quiz
        queryClient.invalidateQueries(['quizAttempts', variables]);
      },
    }
  );
};

/**
 * Hook for submitting a quiz
 *
 * @returns {Object} useMutation result
 */
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ attemptId, answers }) => quizAPI.submitQuiz(attemptId, answers),
    {
      onSuccess: (data, variables) => {
        // Invalidate attempt and attempts list
        queryClient.invalidateQueries(['quizAttempt', variables.attemptId]);
        queryClient.invalidateQueries(['quizAttempts']);
        queryClient.invalidateQueries(['quizStatistics']);
      },
    }
  );
};

/**
 * Hook for tracking quiz behavior (anti-cheating)
 *
 * @returns {Object} useMutation result
 */
export const useTrackBehavior = () => {
  return useMutation(
    ({ attemptId, behaviorData }) => quizAPI.trackBehavior(attemptId, behaviorData),
    {
      // Don't invalidate queries - this is just tracking
    }
  );
};

/**
 * Hook for grading an answer
 *
 * @returns {Object} useMutation result
 */
export const useGradeAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ answerId, gradeData }) => quizAPI.gradeAnswer(answerId, gradeData),
    {
      onSuccess: () => {
        // Invalidate attempts and statistics
        queryClient.invalidateQueries(['quizAttempts']);
        queryClient.invalidateQueries(['quizAttempt']);
        queryClient.invalidateQueries(['quizStatistics']);
      },
    }
  );
};

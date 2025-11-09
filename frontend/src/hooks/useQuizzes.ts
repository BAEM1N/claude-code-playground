/**
 * Quiz hooks with React Query
 * Handles quiz data fetching, caching, and mutations
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { quizAPI } from '../services/api';
import { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from '../types';

interface CreateQuestionParams {
  quizId: string;
  questionData: Partial<QuizQuestion>;
}

interface UpdateQuizParams {
  quizId: string;
  quizData: Partial<Quiz>;
}

interface UpdateQuestionParams {
  questionId: string;
  questionData: Partial<QuizQuestion>;
}

interface SubmitQuizParams {
  attemptId: string;
  answers: any;
}

interface TrackBehaviorParams {
  attemptId: string;
  behaviorData: any;
}

interface GradeAnswerParams {
  answerId: string;
  gradeData: { score: number; feedback?: string };
}

/**
 * Hook for fetching quizzes list
 */
export const useQuizzes = (courseId: string, params: any = {}): UseQueryResult<Quiz[], AxiosError> => {
  return useQuery(
    ['quizzes', courseId, params],
    async () => {
      const { data } = await quizAPI.getQuizzes(courseId, params);
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
 * Hook for fetching a single quiz
 */
export const useQuiz = (quizId: string): UseQueryResult<Quiz, AxiosError> => {
  return useQuery(
    ['quiz', quizId],
    async () => {
      const { data } = await quizAPI.getOne(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching quiz questions
 */
export const useQuizQuestions = (quizId: string): UseQueryResult<QuizQuestion[], AxiosError> => {
  return useQuery(
    ['quizQuestions', quizId],
    async () => {
      const { data } = await quizAPI.getQuestions(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching quiz attempts
 */
export const useQuizAttempts = (quizId: string): UseQueryResult<QuizAttempt[], AxiosError> => {
  return useQuery(
    ['quizAttempts', quizId],
    async () => {
      const { data } = await quizAPI.getAttempts(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching a single quiz attempt
 */
export const useQuizAttempt = (attemptId: string): UseQueryResult<QuizAttempt, AxiosError> => {
  return useQuery(
    ['quizAttempt', attemptId],
    async () => {
      const { data } = await quizAPI.getAttempt(attemptId);
      return data;
    },
    {
      enabled: !!attemptId,
      staleTime: 30 * 1000,
    }
  );
};

/**
 * Hook for fetching quiz statistics
 */
export const useQuizStatistics = (quizId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['quizStatistics', quizId],
    async () => {
      const { data } = await quizAPI.getStatistics(quizId);
      return data;
    },
    {
      enabled: !!quizId,
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for creating a quiz
 */
export const useCreateQuiz = (): UseMutationResult<Quiz, AxiosError, Partial<Quiz>> => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizData: Partial<Quiz>) => quizAPI.create(quizData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for updating a quiz
 */
export const useUpdateQuiz = (): UseMutationResult<Quiz, AxiosError, UpdateQuizParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ quizId, quizData }: UpdateQuizParams) => quizAPI.update(quizId, quizData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['quiz', variables.quizId]);
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for deleting a quiz
 */
export const useDeleteQuiz = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizId: string) => quizAPI.delete(quizId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizzes']);
      },
    }
  );
};

/**
 * Hook for creating a question
 */
export const useCreateQuestion = (): UseMutationResult<QuizQuestion, AxiosError, CreateQuestionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ quizId, questionData }: CreateQuestionParams) => quizAPI.createQuestion(quizId, questionData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['quizQuestions', variables.quizId]);
        queryClient.invalidateQueries(['quiz', variables.quizId]);
      },
    }
  );
};

/**
 * Hook for updating a question
 */
export const useUpdateQuestion = (): UseMutationResult<QuizQuestion, AxiosError, UpdateQuestionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ questionId, questionData }: UpdateQuestionParams) => quizAPI.updateQuestion(questionId, questionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizQuestions']);
      },
    }
  );
};

/**
 * Hook for deleting a question
 */
export const useDeleteQuestion = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (questionId: string) => quizAPI.deleteQuestion(questionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizQuestions']);
      },
    }
  );
};

/**
 * Hook for starting a quiz
 */
export const useStartQuiz = (): UseMutationResult<QuizAttempt, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (quizId: string) => quizAPI.startQuiz(quizId),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['quizAttempts', variables]);
      },
    }
  );
};

/**
 * Hook for submitting a quiz
 */
export const useSubmitQuiz = (): UseMutationResult<QuizAttempt, AxiosError, SubmitQuizParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ attemptId, answers }: SubmitQuizParams) => quizAPI.submitQuiz(attemptId, { answers }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['quizAttempt', variables.attemptId]);
        queryClient.invalidateQueries(['quizAttempts']);
        queryClient.invalidateQueries(['quizStatistics']);
      },
    }
  );
};

/**
 * Hook for tracking quiz behavior (anti-cheating)
 */
export const useTrackBehavior = (): UseMutationResult<void, AxiosError, TrackBehaviorParams> => {
  return useMutation(
    ({ attemptId, behaviorData }: TrackBehaviorParams) => quizAPI.trackBehavior(attemptId, behaviorData),
    {
      // Don't invalidate queries - this is just tracking
    }
  );
};

/**
 * Hook for grading an answer
 */
export const useGradeAnswer = (): UseMutationResult<QuizAnswer, AxiosError, GradeAnswerParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ answerId, gradeData }: GradeAnswerParams) => quizAPI.gradeAnswer(answerId, gradeData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['quizAttempts']);
        queryClient.invalidateQueries(['quizAttempt']);
        queryClient.invalidateQueries(['quizStatistics']);
      },
    }
  );
};

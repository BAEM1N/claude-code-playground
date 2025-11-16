/**
 * AI Assistant related hooks with React Query
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { aiAPI } from '../services/api';
import {
  ChatRequest,
  ChatResponse,
  CodeReviewRequest,
  CodeReviewResponse,
  ExplainConceptRequest,
  ExplainConceptResponse,
  QuizGenerationRequest,
  QuizGenerationResponse,
  SummarizeRequest,
  SummarizeResponse,
  AIConversation,
  AIConversationDetail,
  AIProvidersListResponse,
  UserUsageStats,
  CourseUsageStats,
} from '../types';

/**
 * Hook for fetching available AI providers
 *
 * @returns { data: providers, isLoading, error }
 */
export const useAIProviders = (): UseQueryResult<AIProvidersListResponse, AxiosError> => {
  return useQuery(
    ['aiProviders'],
    async () => {
      const { data } = await aiAPI.getProviders();
      return data;
    },
    {
      staleTime: 30 * 60 * 1000, // 30 minutes - providers don't change often
      cacheTime: 60 * 60 * 1000, // 1 hour
      retry: 2,
    }
  );
};

/**
 * Hook for AI chat
 *
 * @returns mutation function for chat
 */
export const useAIChat = (): UseMutationResult<ChatResponse, AxiosError, ChatRequest> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (request: ChatRequest) => {
      const { data } = await aiAPI.chat(request);
      return data;
    },
    {
      onSuccess: (data) => {
        // Invalidate conversations list
        queryClient.invalidateQueries(['aiConversations']);
        // Update conversation detail cache
        queryClient.setQueryData(['aiConversation', data.conversation_id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...(old.messages || []), data.message],
            message_count: (old.message_count || 0) + 1,
          };
        });
      },
    }
  );
};

/**
 * Hook for code review
 *
 * @returns mutation function for code review
 */
export const useCodeReview = (): UseMutationResult<CodeReviewResponse, AxiosError, CodeReviewRequest> => {
  return useMutation(async (request: CodeReviewRequest) => {
    const { data } = await aiAPI.reviewCode(request);
    return data;
  });
};

/**
 * Hook for concept explanation
 *
 * @returns mutation function for concept explanation
 */
export const useExplainConcept = (): UseMutationResult<ExplainConceptResponse, AxiosError, ExplainConceptRequest> => {
  return useMutation(async (request: ExplainConceptRequest) => {
    const { data } = await aiAPI.explainConcept(request);
    return data;
  });
};

/**
 * Hook for quiz generation
 *
 * @returns mutation function for quiz generation
 */
export const useGenerateQuiz = (): UseMutationResult<QuizGenerationResponse, AxiosError, QuizGenerationRequest> => {
  return useMutation(async (request: QuizGenerationRequest) => {
    const { data } = await aiAPI.generateQuiz(request);
    return data;
  });
};

/**
 * Hook for content summarization
 *
 * @returns mutation function for summarization
 */
export const useSummarize = (): UseMutationResult<SummarizeResponse, AxiosError, SummarizeRequest> => {
  return useMutation(async (request: SummarizeRequest) => {
    const { data } = await aiAPI.summarize(request);
    return data;
  });
};

/**
 * Hook for fetching user's conversations
 *
 * @param params - Query parameters
 * @returns { data: conversations, isLoading, error }
 */
export const useAIConversations = (params?: any): UseQueryResult<AIConversation[], AxiosError> => {
  return useQuery(
    ['aiConversations', params],
    async () => {
      const { data } = await aiAPI.getConversations(params);
      return data;
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook for fetching a single conversation with messages
 *
 * @param conversationId - Conversation ID
 * @returns { data: conversation, isLoading, error }
 */
export const useAIConversation = (conversationId?: number): UseQueryResult<AIConversationDetail, AxiosError> => {
  return useQuery(
    ['aiConversation', conversationId],
    async () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      const { data } = await aiAPI.getConversation(conversationId);
      return data;
    },
    {
      enabled: !!conversationId,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook for deleting a conversation
 *
 * @returns mutation function for deleting conversation
 */
export const useDeleteAIConversation = (): UseMutationResult<void, AxiosError, number> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (conversationId: number) => {
      await aiAPI.deleteConversation(conversationId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aiConversations']);
      },
    }
  );
};

/**
 * Hook for fetching user's AI usage statistics
 *
 * @param days - Number of days to fetch stats for
 * @returns { data: stats, isLoading, error }
 */
export const useMyAIUsageStats = (days: number = 30): UseQueryResult<UserUsageStats, AxiosError> => {
  return useQuery(
    ['aiUsageStats', 'my', days],
    async () => {
      const { data } = await aiAPI.getMyUsageStats(days);
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

/**
 * Hook for fetching course AI usage statistics
 *
 * @param courseId - Course ID
 * @param days - Number of days to fetch stats for
 * @returns { data: stats, isLoading, error }
 */
export const useCourseAIUsageStats = (
  courseId?: number,
  days: number = 30
): UseQueryResult<CourseUsageStats, AxiosError> => {
  return useQuery(
    ['aiUsageStats', 'course', courseId, days],
    async () => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const { data} = await aiAPI.getCourseUsageStats(courseId, days);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

/**
 * Hook for submitting code review feedback
 *
 * @returns mutation function for submitting feedback
 */
export const useCodeReviewFeedback = (): UseMutationResult<
  any,
  AxiosError,
  { review_id: number; was_helpful: boolean }
> => {
  return useMutation(async (feedback) => {
    const { data } = await aiAPI.submitCodeReviewFeedback(feedback);
    return data;
  });
};

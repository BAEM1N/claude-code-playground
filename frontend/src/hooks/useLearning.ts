/**
 * React Query hooks for Learning Module System
 *
 * Provides hooks for:
 * - Tracks (학습 트랙)
 * - Modules (학습 모듈)
 * - Chapters (챕터)
 * - Topics (토픽/레슨)
 * - Progress (진도 관리)
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import api from '../services/api';

// ============================================================================
// Query Keys
// ============================================================================

export const learningKeys = {
  all: ['learning'] as const,
  tracks: () => [...learningKeys.all, 'tracks'] as const,
  track: (id: string) => [...learningKeys.tracks(), id] as const,
  trackFull: (id: string) => [...learningKeys.track(id), 'full'] as const,
  modules: () => [...learningKeys.all, 'modules'] as const,
  module: (id: string) => [...learningKeys.modules(), id] as const,
  moduleFull: (id: string) => [...learningKeys.module(id), 'full'] as const,
  trackModules: (trackId: string) => [...learningKeys.track(trackId), 'modules'] as const,
  chapters: () => [...learningKeys.all, 'chapters'] as const,
  chapter: (id: string) => [...learningKeys.chapters(), id] as const,
  moduleChapters: (moduleId: string) => [...learningKeys.module(moduleId), 'chapters'] as const,
  topics: () => [...learningKeys.all, 'topics'] as const,
  topic: (id: string) => [...learningKeys.topics(), id] as const,
  chapterTopics: (chapterId: string) => [...learningKeys.chapter(chapterId), 'topics'] as const,
  progress: (topicId: string) => [...learningKeys.topic(topicId), 'progress'] as const,
};

// ============================================================================
// Track Hooks
// ============================================================================

interface TrackOptions {
  publishedOnly?: boolean;
}

export const useTracks = (options: TrackOptions = {}): UseQueryResult<any[], AxiosError> => {
  const { publishedOnly = true } = options;
  return useQuery(
    learningKeys.tracks(),
    async () => {
      const response = await api.get('/learning/tracks', {
        params: { published_only: publishedOnly }
      });
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useTrack = (trackId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.track(trackId),
    async () => {
      const response = await api.get(`/learning/tracks/${trackId}`);
      return response.data;
    },
    {
      enabled: !!trackId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useTrackFull = (trackId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.trackFull(trackId),
    async () => {
      const response = await api.get(`/learning/tracks/${trackId}/full`);
      return response.data;
    },
    {
      enabled: !!trackId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateTrack = (): UseMutationResult<any, AxiosError, any> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (trackData: any) => {
      const response = await api.post('/learning/tracks', trackData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(learningKeys.tracks());
      },
    }
  );
};

interface UpdateTrackParams {
  trackId: string;
  data: any;
}

export const useUpdateTrack = (): UseMutationResult<any, AxiosError, UpdateTrackParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ trackId, data }: UpdateTrackParams) => {
      const response = await api.put(`/learning/tracks/${trackId}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.tracks());
        queryClient.invalidateQueries(learningKeys.track(data.id));
      },
    }
  );
};

export const useDeleteTrack = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (trackId: string) => {
      await api.delete(`/learning/tracks/${trackId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(learningKeys.tracks());
      },
    }
  );
};

// ============================================================================
// Module Hooks
// ============================================================================

export const useTrackModules = (trackId: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    learningKeys.trackModules(trackId),
    async () => {
      const response = await api.get(`/learning/tracks/${trackId}/modules`);
      return response.data;
    },
    {
      enabled: !!trackId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useModule = (moduleId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.module(moduleId),
    async () => {
      const response = await api.get(`/learning/modules/${moduleId}`);
      return response.data;
    },
    {
      enabled: !!moduleId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useModuleFull = (moduleId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.moduleFull(moduleId),
    async () => {
      const response = await api.get(`/learning/modules/${moduleId}/full`);
      return response.data;
    },
    {
      enabled: !!moduleId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateModule = (): UseMutationResult<any, AxiosError, any> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (moduleData: any) => {
      const response = await api.post('/learning/modules', moduleData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.modules());
        queryClient.invalidateQueries(learningKeys.trackModules(data.track_id));
      },
    }
  );
};

interface UpdateModuleParams {
  moduleId: string;
  data: any;
}

export const useUpdateModule = (): UseMutationResult<any, AxiosError, UpdateModuleParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ moduleId, data }: UpdateModuleParams) => {
      const response = await api.put(`/learning/modules/${moduleId}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.modules());
        queryClient.invalidateQueries(learningKeys.module(data.id));
        queryClient.invalidateQueries(learningKeys.trackModules(data.track_id));
      },
    }
  );
};

export const useDeleteModule = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (moduleId: string) => {
      await api.delete(`/learning/modules/${moduleId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(learningKeys.modules());
      },
    }
  );
};

// ============================================================================
// Chapter Hooks
// ============================================================================

export const useModuleChapters = (moduleId: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    learningKeys.moduleChapters(moduleId),
    async () => {
      const response = await api.get(`/learning/modules/${moduleId}/chapters`);
      return response.data;
    },
    {
      enabled: !!moduleId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useChapter = (chapterId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.chapter(chapterId),
    async () => {
      const response = await api.get(`/learning/chapters/${chapterId}`);
      return response.data;
    },
    {
      enabled: !!chapterId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateChapter = (): UseMutationResult<any, AxiosError, any> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (chapterData: any) => {
      const response = await api.post('/learning/chapters', chapterData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.chapters());
        queryClient.invalidateQueries(learningKeys.moduleChapters(data.module_id));
      },
    }
  );
};

interface UpdateChapterParams {
  chapterId: string;
  data: any;
}

export const useUpdateChapter = (): UseMutationResult<any, AxiosError, UpdateChapterParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ chapterId, data }: UpdateChapterParams) => {
      const response = await api.put(`/learning/chapters/${chapterId}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.chapters());
        queryClient.invalidateQueries(learningKeys.chapter(data.id));
        queryClient.invalidateQueries(learningKeys.moduleChapters(data.module_id));
      },
    }
  );
};

export const useDeleteChapter = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (chapterId: string) => {
      await api.delete(`/learning/chapters/${chapterId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(learningKeys.chapters());
      },
    }
  );
};

// ============================================================================
// Topic Hooks
// ============================================================================

export const useChapterTopics = (chapterId: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    learningKeys.chapterTopics(chapterId),
    async () => {
      const response = await api.get(`/learning/chapters/${chapterId}/topics`);
      return response.data;
    },
    {
      enabled: !!chapterId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useTopic = (topicId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.topic(topicId),
    async () => {
      const response = await api.get(`/learning/topics/${topicId}`);
      return response.data;
    },
    {
      enabled: !!topicId,
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useCreateTopic = (): UseMutationResult<any, AxiosError, any> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (topicData: any) => {
      const response = await api.post('/learning/topics', topicData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.topics());
        queryClient.invalidateQueries(learningKeys.chapterTopics(data.chapter_id));
      },
    }
  );
};

interface UpdateTopicParams {
  topicId: string;
  data: any;
}

export const useUpdateTopic = (): UseMutationResult<any, AxiosError, UpdateTopicParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ topicId, data }: UpdateTopicParams) => {
      const response = await api.put(`/learning/topics/${topicId}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(learningKeys.topics());
        queryClient.invalidateQueries(learningKeys.topic(data.id));
        queryClient.invalidateQueries(learningKeys.chapterTopics(data.chapter_id));
      },
    }
  );
};

export const useDeleteTopic = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    async (topicId: string) => {
      await api.delete(`/learning/topics/${topicId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(learningKeys.topics());
      },
    }
  );
};

// ============================================================================
// Progress Hooks
// ============================================================================

export const useTopicProgress = (topicId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    learningKeys.progress(topicId),
    async () => {
      const response = await api.get(`/learning/topics/${topicId}/progress`);
      return response.data;
    },
    {
      enabled: !!topicId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

interface UpdateProgressParams {
  topicId: string;
  progress: any;
}

export const useUpdateTopicProgress = (): UseMutationResult<any, AxiosError, UpdateProgressParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ topicId, progress }: UpdateProgressParams) => {
      const response = await api.put(`/learning/topics/${topicId}/progress`, progress);
      return response.data;
    },
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(learningKeys.progress(variables.topicId));
        queryClient.invalidateQueries(learningKeys.topic(variables.topicId));
      },
    }
  );
};

export const useStartTopic = (): UseMutationResult<any, AxiosError, string> => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async (topicId: string) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          status: 'in_progress',
        },
      });
    }
  );
};

export const useCompleteTopic = (): UseMutationResult<any, AxiosError, string> => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async (topicId: string) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          status: 'completed',
        },
      });
    }
  );
};

interface UpdateVideoPositionParams {
  topicId: string;
  positionSeconds: number;
}

export const useUpdateVideoPosition = (): UseMutationResult<any, AxiosError, UpdateVideoPositionParams> => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async ({ topicId, positionSeconds }: UpdateVideoPositionParams) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          video_position_seconds: positionSeconds,
          status: 'in_progress',
        },
      });
    }
  );
};

interface SaveNotebookParams {
  topicId: string;
  notebookState: any;
  lastCellIndex: number;
}

export const useSaveNotebookState = (): UseMutationResult<any, AxiosError, SaveNotebookParams> => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async ({ topicId, notebookState, lastCellIndex }: SaveNotebookParams) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          notebook_state: notebookState,
          notebook_last_cell_index: lastCellIndex,
          status: 'in_progress',
        },
      });
    }
  );
};

// ============================================================================
// Notebook Execution Hook (Placeholder for Phase 4)
// ============================================================================

interface ExecuteNotebookParams {
  topicId: string;
  cellIndex: number;
  code: string;
  kernelType?: string;
}

export const useExecuteNotebookCell = (): UseMutationResult<any, AxiosError, ExecuteNotebookParams> => {
  return useMutation(
    async ({ topicId, cellIndex, code, kernelType = 'python3' }: ExecuteNotebookParams) => {
      const response = await api.post(`/learning/topics/${topicId}/execute`, {
        topic_id: topicId,
        cell_index: cellIndex,
        code,
        kernel_type: kernelType,
      });
      return response.data;
    }
  );
};

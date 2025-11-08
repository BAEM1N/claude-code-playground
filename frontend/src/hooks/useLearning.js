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

import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';

// ============================================================================
// Query Keys
// ============================================================================

export const learningKeys = {
  all: ['learning'],
  tracks: () => [...learningKeys.all, 'tracks'],
  track: (id) => [...learningKeys.tracks(), id],
  trackFull: (id) => [...learningKeys.track(id), 'full'],

  modules: () => [...learningKeys.all, 'modules'],
  module: (id) => [...learningKeys.modules(), id],
  moduleFull: (id) => [...learningKeys.module(id), 'full'],
  trackModules: (trackId) => [...learningKeys.track(trackId), 'modules'],

  chapters: () => [...learningKeys.all, 'chapters'],
  chapter: (id) => [...learningKeys.chapters(), id],
  moduleChapters: (moduleId) => [...learningKeys.module(moduleId), 'chapters'],

  topics: () => [...learningKeys.all, 'topics'],
  topic: (id) => [...learningKeys.topics(), id],
  chapterTopics: (chapterId) => [...learningKeys.chapter(chapterId), 'topics'],

  progress: (topicId) => [...learningKeys.topic(topicId), 'progress'],
};

// ============================================================================
// Track Hooks
// ============================================================================

/**
 * Get all learning tracks
 * @param {Object} options - Query options
 * @param {boolean} options.publishedOnly - Only show published tracks
 */
export const useTracks = ({ publishedOnly = true } = {}) => {
  return useQuery(
    learningKeys.tracks(),
    async () => {
      const response = await api.get('/learning/tracks', {
        params: { published_only: publishedOnly }
      });
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Get single track with modules
 * @param {string} trackId - Track ID
 */
export const useTrack = (trackId) => {
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

/**
 * Get track with full nested content
 * @param {string} trackId - Track ID
 */
export const useTrackFull = (trackId) => {
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

/**
 * Create a new track
 */
export const useCreateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (trackData) => {
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

/**
 * Update a track
 */
export const useUpdateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ trackId, data }) => {
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

/**
 * Delete a track
 */
export const useDeleteTrack = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (trackId) => {
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

/**
 * Get modules in a track
 * @param {string} trackId - Track ID
 */
export const useTrackModules = (trackId) => {
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

/**
 * Get single module with chapters
 * @param {string} moduleId - Module ID
 */
export const useModule = (moduleId) => {
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

/**
 * Get module with full nested content (chapters, topics, progress)
 * @param {string} moduleId - Module ID
 */
export const useModuleFull = (moduleId) => {
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

/**
 * Create a new module
 */
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (moduleData) => {
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

/**
 * Update a module
 */
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ moduleId, data }) => {
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

/**
 * Delete a module
 */
export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (moduleId) => {
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

/**
 * Get chapters in a module
 * @param {string} moduleId - Module ID
 */
export const useModuleChapters = (moduleId) => {
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

/**
 * Get single chapter with topics
 * @param {string} chapterId - Chapter ID
 */
export const useChapter = (chapterId) => {
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

/**
 * Create a new chapter
 */
export const useCreateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (chapterData) => {
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

/**
 * Update a chapter
 */
export const useUpdateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ chapterId, data }) => {
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

/**
 * Delete a chapter
 */
export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (chapterId) => {
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

/**
 * Get topics in a chapter
 * @param {string} chapterId - Chapter ID
 */
export const useChapterTopics = (chapterId) => {
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

/**
 * Get single topic with user progress
 * @param {string} topicId - Topic ID
 */
export const useTopic = (topicId) => {
  return useQuery(
    learningKeys.topic(topicId),
    async () => {
      const response = await api.get(`/learning/topics/${topicId}`);
      return response.data;
    },
    {
      enabled: !!topicId,
      staleTime: 2 * 60 * 1000, // 2 minutes (fresher for active learning)
    }
  );
};

/**
 * Create a new topic
 */
export const useCreateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (topicData) => {
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

/**
 * Update a topic
 */
export const useUpdateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ topicId, data }) => {
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

/**
 * Delete a topic
 */
export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (topicId) => {
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

/**
 * Get user progress for a topic
 * @param {string} topicId - Topic ID
 */
export const useTopicProgress = (topicId) => {
  return useQuery(
    learningKeys.progress(topicId),
    async () => {
      const response = await api.get(`/learning/topics/${topicId}/progress`);
      return response.data;
    },
    {
      enabled: !!topicId,
      staleTime: 1 * 60 * 1000, // 1 minute (very fresh for active learning)
    }
  );
};

/**
 * Update user progress for a topic
 */
export const useUpdateTopicProgress = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ topicId, progress }) => {
      const response = await api.put(`/learning/topics/${topicId}/progress`, progress);
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(learningKeys.progress(variables.topicId));
        queryClient.invalidateQueries(learningKeys.topic(variables.topicId));
      },
    }
  );
};

/**
 * Mark topic as started
 */
export const useStartTopic = () => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async (topicId) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          status: 'in_progress',
        },
      });
    }
  );
};

/**
 * Mark topic as completed
 */
export const useCompleteTopic = () => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async (topicId) => {
      return mutation.mutateAsync({
        topicId,
        progress: {
          status: 'completed',
        },
      });
    }
  );
};

/**
 * Update video playback position
 */
export const useUpdateVideoPosition = () => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async ({ topicId, positionSeconds }) => {
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

/**
 * Save notebook execution state
 */
export const useSaveNotebookState = () => {
  const mutation = useUpdateTopicProgress();

  return useMutation(
    async ({ topicId, notebookState, lastCellIndex }) => {
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

/**
 * Execute a notebook cell
 * TODO: Will be implemented in Phase 4 with Jupyter Kernel Gateway
 */
export const useExecuteNotebookCell = () => {
  return useMutation(
    async ({ topicId, cellIndex, code, kernelType = 'python3' }) => {
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

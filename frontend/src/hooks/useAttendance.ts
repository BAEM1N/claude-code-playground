/**
 * Attendance hooks with React Query
 * Handles attendance session and record data fetching, caching, and mutations
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { attendanceAPI } from '../services/api';
import { AttendanceSession, AttendanceRecord } from '../types';

interface CreateSessionParams {
  courseId: string;
  sessionData: Partial<AttendanceSession>;
}

interface UpdateSessionParams {
  sessionId: string;
  sessionData: Partial<AttendanceSession>;
}

interface CheckInParams {
  sessionId: string;
  checkInData: any;
}

interface MarkAttendanceParams {
  sessionId: string;
  studentId: string;
  status: string;
  notes?: string;
}

interface ToggleSessionParams {
  sessionId: string;
  isActive: boolean;
}

interface ExportParams {
  courseId: string;
  format?: string;
}

/**
 * Hook for fetching attendance sessions list
 */
export const useAttendanceSessions = (courseId: string): UseQueryResult<AttendanceSession[], AxiosError> => {
  return useQuery(
    ['attendanceSessions', courseId],
    async () => {
      const { data } = await (attendanceAPI as any).getSessions(courseId);
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
 * Hook for fetching a single attendance session
 */
export const useAttendanceSession = (sessionId: string): UseQueryResult<AttendanceSession, AxiosError> => {
  return useQuery(
    ['attendanceSession', sessionId],
    async () => {
      const { data } = await (attendanceAPI as any).getOne(sessionId);
      return data;
    },
    {
      enabled: !!sessionId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching attendance records for a session
 */
export const useAttendanceRecords = (sessionId: string): UseQueryResult<AttendanceRecord[], AxiosError> => {
  return useQuery(
    ['attendanceRecords', sessionId],
    async () => {
      const { data } = await (attendanceAPI as any).getRecords(sessionId);
      return data;
    },
    {
      enabled: !!sessionId,
      staleTime: 30 * 1000,
    }
  );
};

/**
 * Hook for fetching attendance statistics
 */
export const useAttendanceStatistics = (courseId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['attendanceStatistics', courseId],
    async () => {
      const { data } = await (attendanceAPI as any).getStatistics?.(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching student's own attendance records
 */
export const useMyAttendance = (courseId: string): UseQueryResult<AttendanceRecord[], AxiosError> => {
  return useQuery(
    ['myAttendance', courseId],
    async () => {
      const { data } = await (attendanceAPI as any).getMyRecords(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

/**
 * Hook for checking if currently in attendance session
 */
export const useAttendanceStatus = (sessionId: string): UseQueryResult<any, AxiosError> => {
  return useQuery(
    ['attendanceStatus', sessionId],
    async () => {
      try {
        const { data } = await (attendanceAPI as any).checkStatus(sessionId);
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return { checked: false };
        }
        throw err;
      }
    },
    {
      enabled: !!sessionId,
      staleTime: 10 * 1000,
      retry: false,
    }
  );
};

/**
 * Hook for creating an attendance session
 */
export const useCreateAttendanceSession = (): UseMutationResult<AttendanceSession, AxiosError, CreateSessionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, sessionData }: CreateSessionParams) => (attendanceAPI as any).createSession(courseId, sessionData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['attendanceSessions', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating an attendance session
 */
export const useUpdateAttendanceSession = (): UseMutationResult<AttendanceSession, AxiosError, UpdateSessionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, sessionData }: UpdateSessionParams) => (attendanceAPI as any).updateSession(sessionId, sessionData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['attendanceSession', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for deleting an attendance session
 */
export const useDeleteAttendanceSession = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (sessionId: string) => (attendanceAPI as any).deleteSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for checking in to attendance (student)
 */
export const useCheckInAttendance = (): UseMutationResult<AttendanceRecord, AxiosError, CheckInParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, checkInData }: CheckInParams) => (attendanceAPI as any).checkIn({ session_id: sessionId, ...checkInData }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['attendanceStatus', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceRecords', variables.sessionId]);
        queryClient.invalidateQueries(['myAttendance']);
        queryClient.invalidateQueries(['attendanceStatistics']);
      },
    }
  );
};

/**
 * Hook for manually marking attendance (instructor/assistant)
 */
export const useMarkAttendance = (): UseMutationResult<any, AxiosError, MarkAttendanceParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, studentId, status, notes }: MarkAttendanceParams) =>
      (attendanceAPI as any).markAttendance(sessionId, studentId, { status, notes }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['attendanceRecords', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceStatistics']);
      },
    }
  );
};

/**
 * Hook for generating QR code for attendance session
 */
export const useGenerateAttendanceQR = (): UseMutationResult<any, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (sessionId: string) => (attendanceAPI as any).getSessionQRCode(sessionId),
    {
      onSuccess: (_data, sessionId) => {
        queryClient.invalidateQueries(['attendanceSession', sessionId]);
      },
    }
  );
};

/**
 * Hook for activating/deactivating attendance session
 */
export const useToggleAttendanceSession = (): UseMutationResult<any, AxiosError, ToggleSessionParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, isActive }: ToggleSessionParams) => (attendanceAPI as any).toggleSession(sessionId, { is_active: isActive }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['attendanceSession', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for exporting attendance data
 */
export const useExportAttendance = (): UseMutationResult<any, AxiosError, ExportParams> => {
  return useMutation(
    ({ courseId, format = 'csv' }: ExportParams) => (attendanceAPI as any).exportData(courseId, format),
    {
      // No query invalidation needed for export
    }
  );
};

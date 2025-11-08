/**
 * Attendance hooks with React Query
 * Handles attendance session and record data fetching, caching, and mutations
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { attendanceAPI } from '../services/api';

/**
 * Hook for fetching attendance sessions list
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useAttendanceSessions = (courseId) => {
  return useQuery(
    ['attendanceSessions', courseId],
    async () => {
      const { data } = await attendanceAPI.getSessions(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2분 - 출석 세션은 자주 변경될 수 있음
      cacheTime: 10 * 60 * 1000, // 10분
    }
  );
};

/**
 * Hook for fetching a single attendance session
 *
 * @param {string} sessionId - Session ID
 * @returns {Object} React Query result
 */
export const useAttendanceSession = (sessionId) => {
  return useQuery(
    ['attendanceSession', sessionId],
    async () => {
      const { data } = await attendanceAPI.getSession(sessionId);
      return data;
    },
    {
      enabled: !!sessionId,
      staleTime: 1 * 60 * 1000, // 1분 - 실시간 출석 체크 중에는 자주 업데이트
    }
  );
};

/**
 * Hook for fetching attendance records for a session
 *
 * @param {string} sessionId - Session ID
 * @returns {Object} React Query result
 */
export const useAttendanceRecords = (sessionId) => {
  return useQuery(
    ['attendanceRecords', sessionId],
    async () => {
      const { data } = await attendanceAPI.getRecords(sessionId);
      return data;
    },
    {
      enabled: !!sessionId,
      staleTime: 30 * 1000, // 30초 - 출석 체크는 실시간 업데이트 필요
    }
  );
};

/**
 * Hook for fetching attendance statistics
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useAttendanceStatistics = (courseId) => {
  return useQuery(
    ['attendanceStatistics', courseId],
    async () => {
      const { data } = await attendanceAPI.getStatistics(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for fetching student's own attendance records
 *
 * @param {string} courseId - Course ID
 * @returns {Object} React Query result
 */
export const useMyAttendance = (courseId) => {
  return useQuery(
    ['myAttendance', courseId],
    async () => {
      const { data } = await attendanceAPI.getMyRecords(courseId);
      return data;
    },
    {
      enabled: !!courseId,
      staleTime: 1 * 60 * 1000, // 1분
    }
  );
};

/**
 * Hook for checking if currently in attendance session
 *
 * @param {string} sessionId - Session ID
 * @returns {Object} React Query result
 */
export const useAttendanceStatus = (sessionId) => {
  return useQuery(
    ['attendanceStatus', sessionId],
    async () => {
      try {
        const { data } = await attendanceAPI.checkStatus(sessionId);
        return data;
      } catch (err) {
        if (err.response?.status === 404) {
          return { checked: false }; // Not checked yet
        }
        throw err;
      }
    },
    {
      enabled: !!sessionId,
      staleTime: 10 * 1000, // 10초 - 실시간 상태 체크
      retry: false, // Don't retry on 404
    }
  );
};

/**
 * Hook for creating an attendance session
 *
 * @returns {Object} useMutation result
 */
export const useCreateAttendanceSession = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, sessionData }) => attendanceAPI.createSession(courseId, sessionData),
    {
      onSuccess: (data, variables) => {
        // Invalidate sessions list for this course
        queryClient.invalidateQueries(['attendanceSessions', variables.courseId]);
      },
    }
  );
};

/**
 * Hook for updating an attendance session
 *
 * @returns {Object} useMutation result
 */
export const useUpdateAttendanceSession = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, sessionData }) => attendanceAPI.updateSession(sessionId, sessionData),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific session and sessions list
        queryClient.invalidateQueries(['attendanceSession', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for deleting an attendance session
 *
 * @returns {Object} useMutation result
 */
export const useDeleteAttendanceSession = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (sessionId) => attendanceAPI.deleteSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for checking in to attendance (student)
 *
 * @returns {Object} useMutation result
 */
export const useCheckInAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, checkInData }) => attendanceAPI.checkIn(sessionId, checkInData),
    {
      onSuccess: (data, variables) => {
        // Invalidate attendance status and records
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
 *
 * @returns {Object} useMutation result
 */
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, studentId, status, notes }) =>
      attendanceAPI.markAttendance(sessionId, studentId, { status, notes }),
    {
      onSuccess: (data, variables) => {
        // Invalidate records and statistics
        queryClient.invalidateQueries(['attendanceRecords', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceStatistics']);
      },
    }
  );
};

/**
 * Hook for generating QR code for attendance session
 *
 * @returns {Object} useMutation result
 */
export const useGenerateAttendanceQR = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (sessionId) => attendanceAPI.generateQR(sessionId),
    {
      onSuccess: (data, sessionId) => {
        // Invalidate session to get new QR code
        queryClient.invalidateQueries(['attendanceSession', sessionId]);
      },
    }
  );
};

/**
 * Hook for activating/deactivating attendance session
 *
 * @returns {Object} useMutation result
 */
export const useToggleAttendanceSession = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ sessionId, isActive }) => attendanceAPI.toggleSession(sessionId, { is_active: isActive }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['attendanceSession', variables.sessionId]);
        queryClient.invalidateQueries(['attendanceSessions']);
      },
    }
  );
};

/**
 * Hook for exporting attendance data
 *
 * @returns {Object} useMutation result
 */
export const useExportAttendance = () => {
  return useMutation(
    ({ courseId, format = 'csv' }) => attendanceAPI.exportData(courseId, format),
    {
      // No query invalidation needed for export
    }
  );
};

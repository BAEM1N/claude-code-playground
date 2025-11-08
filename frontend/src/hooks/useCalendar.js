/**
 * Calendar hooks with React Query
 * Handles calendar events, reminders, attendees, and personal events
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { calendarAPI } from '../services/api';

/**
 * Hook for fetching calendar events
 *
 * @param {string} courseId - Course ID (optional, null for all courses)
 * @param {Object} params - Query parameters (start_date, end_date, event_type, etc.)
 * @returns {Object} React Query result
 */
export const useCalendarEvents = (courseId = null, params = {}) => {
  return useQuery(
    ['calendarEvents', courseId, params],
    async () => {
      const endpoint = courseId
        ? () => calendarAPI.getCourseEvents(courseId, params)
        : () => calendarAPI.getAllEvents(params);
      const { data } = await endpoint();
      return data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2분 - 캘린더 이벤트는 자주 변경
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching a single calendar event
 *
 * @param {string} eventId - Event ID
 * @returns {Object} React Query result
 */
export const useCalendarEvent = (eventId) => {
  return useQuery(
    ['calendarEvent', eventId],
    async () => {
      const { data } = await calendarAPI.getEvent(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 3 * 60 * 1000, // 3분
    }
  );
};

/**
 * Hook for fetching personal events
 *
 * @param {Object} params - Query parameters (start_date, end_date, etc.)
 * @returns {Object} React Query result
 */
export const usePersonalEvents = (params = {}) => {
  return useQuery(
    ['personalEvents', params],
    async () => {
      const { data } = await calendarAPI.getPersonalEvents(params);
      return data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for fetching event attendees
 *
 * @param {string} eventId - Event ID
 * @returns {Object} React Query result
 */
export const useEventAttendees = (eventId) => {
  return useQuery(
    ['eventAttendees', eventId],
    async () => {
      const { data } = await calendarAPI.getAttendees(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 1 * 60 * 1000, // 1분 - RSVP 상태는 자주 변경
    }
  );
};

/**
 * Hook for fetching event reminders
 *
 * @param {string} eventId - Event ID
 * @returns {Object} React Query result
 */
export const useEventReminders = (eventId) => {
  return useQuery(
    ['eventReminders', eventId],
    async () => {
      const { data } = await calendarAPI.getReminders(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 5 * 60 * 1000, // 5분
    }
  );
};

/**
 * Hook for fetching upcoming events
 *
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Object} React Query result
 */
export const useUpcomingEvents = (days = 7) => {
  return useQuery(
    ['upcomingEvents', days],
    async () => {
      const { data } = await calendarAPI.getUpcomingEvents({ days });
      return data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for fetching events by date range
 *
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @param {string} courseId - Course ID (optional)
 * @returns {Object} React Query result
 */
export const useEventsByDateRange = (startDate, endDate, courseId = null) => {
  return useQuery(
    ['eventsByDateRange', startDate, endDate, courseId],
    async () => {
      const { data } = await calendarAPI.getEventsByDateRange(startDate, endDate, courseId);
      return data;
    },
    {
      enabled: !!startDate && !!endDate,
      staleTime: 2 * 60 * 1000, // 2분
    }
  );
};

/**
 * Hook for checking event conflicts
 *
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {Object} React Query result
 */
export const useEventConflicts = (startTime, endTime) => {
  return useQuery(
    ['eventConflicts', startTime, endTime],
    async () => {
      const { data } = await calendarAPI.checkConflicts(startTime, endTime);
      return data;
    },
    {
      enabled: !!startTime && !!endTime,
      staleTime: 30 * 1000, // 30초 - 충돌 체크는 실시간
    }
  );
};

/**
 * Hook for creating a calendar event
 *
 * @returns {Object} useMutation result
 */
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, eventData }) => calendarAPI.createEvent(courseId, eventData),
    {
      onSuccess: (data, variables) => {
        // Invalidate calendar events
        queryClient.invalidateQueries(['calendarEvents', variables.courseId]);
        queryClient.invalidateQueries(['calendarEvents', null]); // All events
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for updating a calendar event
 *
 * @returns {Object} useMutation result
 */
export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, eventData }) => calendarAPI.updateEvent(eventId, eventData),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific event and all event lists
        queryClient.invalidateQueries(['calendarEvent', variables.eventId]);
        queryClient.invalidateQueries(['calendarEvents']);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for deleting a calendar event
 *
 * @returns {Object} useMutation result
 */
export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventId) => calendarAPI.deleteEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendarEvents']);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for creating a personal event
 *
 * @returns {Object} useMutation result
 */
export const useCreatePersonalEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventData) => calendarAPI.createPersonalEvent(eventData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['personalEvents']);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for updating a personal event
 *
 * @returns {Object} useMutation result
 */
export const useUpdatePersonalEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, eventData }) => calendarAPI.updatePersonalEvent(eventId, eventData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['personalEvents']);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for deleting a personal event
 *
 * @returns {Object} useMutation result
 */
export const useDeletePersonalEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventId) => calendarAPI.deletePersonalEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['personalEvents']);
      },
    }
  );
};

/**
 * Hook for RSVP to an event
 *
 * @returns {Object} useMutation result
 */
export const useRSVPEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, status }) => calendarAPI.rsvpEvent(eventId, { rsvp_status: status }),
    {
      onSuccess: (data, variables) => {
        // Invalidate attendees list
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
        queryClient.invalidateQueries(['calendarEvent', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for adding event attendees
 *
 * @returns {Object} useMutation result
 */
export const useAddEventAttendees = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userIds }) => calendarAPI.addAttendees(eventId, { user_ids: userIds }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for removing event attendee
 *
 * @returns {Object} useMutation result
 */
export const useRemoveEventAttendee = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userId }) => calendarAPI.removeAttendee(eventId, userId),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for marking event attendance
 *
 * @returns {Object} useMutation result
 */
export const useMarkEventAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userId, attended }) =>
      calendarAPI.markAttendance(eventId, userId, { attended }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for exporting calendar
 *
 * @returns {Object} useMutation result
 */
export const useExportCalendar = () => {
  return useMutation(
    ({ courseId, format = 'ical' }) => calendarAPI.exportCalendar(courseId, format),
    {
      // No query invalidation needed for export
    }
  );
};

/**
 * Hook for syncing calendar with external source
 *
 * @returns {Object} useMutation result
 */
export const useSyncCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, syncData }) => calendarAPI.syncCalendar(courseId, syncData),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['calendarEvents', variables.courseId]);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

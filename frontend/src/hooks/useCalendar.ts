/**
 * Calendar hooks with React Query
 * Handles calendar events, reminders, attendees, and personal events
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { AxiosError } from 'axios';
import { calendarAPI } from '../services/api';
import { CalendarEvent } from '../types';

interface CreateEventParams {
  courseId: string;
  eventData: Partial<CalendarEvent>;
}

interface UpdateEventParams {
  eventId: string;
  eventData: Partial<CalendarEvent>;
}

interface RSVPParams {
  eventId: string;
  status: string;
}

interface AddAttendeesParams {
  eventId: string;
  userIds: string[];
}

interface RemoveAttendeeParams {
  eventId: string;
  userId: string;
}

interface MarkAttendanceParams {
  eventId: string;
  userId: string;
  attended: boolean;
}

interface ExportParams {
  courseId: string;
  format?: string;
}

interface SyncParams {
  courseId: string;
  syncData: any;
}

/**
 * Hook for fetching calendar events
 */
export const useCalendarEvents = (courseId: string | null = null, params: any = {}): UseQueryResult<CalendarEvent[], AxiosError> => {
  return useQuery(
    ['calendarEvents', courseId, params],
    async () => {
      const endpoint = courseId
        ? () => (calendarAPI as any).getCourseEvents(courseId, params)
        : () => (calendarAPI as any).getAllEvents(params);
      const { data } = await endpoint();
      return data;
    },
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching a single calendar event
 */
export const useCalendarEvent = (eventId: string): UseQueryResult<CalendarEvent, AxiosError> => {
  return useQuery(
    ['calendarEvent', eventId],
    async () => {
      const { data } = await (calendarAPI as any).getEvent(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 3 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching personal events
 */
export const usePersonalEvents = (params: any = {}): UseQueryResult<CalendarEvent[], AxiosError> => {
  return useQuery(
    ['personalEvents', params],
    async () => {
      const { data } = await (calendarAPI as any).getPersonalEvents(params);
      return data;
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching event attendees
 */
export const useEventAttendees = (eventId: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['eventAttendees', eventId],
    async () => {
      const { data } = await (calendarAPI as any).getAttendees(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 1 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching event reminders
 */
export const useEventReminders = (eventId: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['eventReminders', eventId],
    async () => {
      const { data } = await (calendarAPI as any).getReminders(eventId);
      return data;
    },
    {
      enabled: !!eventId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching upcoming events
 */
export const useUpcomingEvents = (days: number = 7): UseQueryResult<CalendarEvent[], AxiosError> => {
  return useQuery(
    ['upcomingEvents', days],
    async () => {
      const { data } = await (calendarAPI as any).getUpcomingEvents({ days });
      return data;
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for fetching events by date range
 */
export const useEventsByDateRange = (startDate: string, endDate: string, courseId: string | null = null): UseQueryResult<CalendarEvent[], AxiosError> => {
  return useQuery(
    ['eventsByDateRange', startDate, endDate, courseId],
    async () => {
      const { data } = await (calendarAPI as any).getEventsByDateRange(startDate, endDate, courseId);
      return data;
    },
    {
      enabled: !!startDate && !!endDate,
      staleTime: 2 * 60 * 1000,
    }
  );
};

/**
 * Hook for checking event conflicts
 */
export const useEventConflicts = (startTime: string, endTime: string): UseQueryResult<any[], AxiosError> => {
  return useQuery(
    ['eventConflicts', startTime, endTime],
    async () => {
      const { data } = await (calendarAPI as any).checkConflicts(startTime, endTime);
      return data;
    },
    {
      enabled: !!startTime && !!endTime,
      staleTime: 30 * 1000,
    }
  );
};

/**
 * Hook for creating a calendar event
 */
export const useCreateCalendarEvent = (): UseMutationResult<CalendarEvent, AxiosError, CreateEventParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, eventData }: CreateEventParams) => (calendarAPI as any).createEvent(courseId, eventData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['calendarEvents', variables.courseId]);
        queryClient.invalidateQueries(['calendarEvents', null]);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for updating a calendar event
 */
export const useUpdateCalendarEvent = (): UseMutationResult<CalendarEvent, AxiosError, UpdateEventParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, eventData }: UpdateEventParams) => (calendarAPI as any).updateEvent(eventId, eventData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['calendarEvent', variables.eventId]);
        queryClient.invalidateQueries(['calendarEvents']);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

/**
 * Hook for deleting a calendar event
 */
export const useDeleteCalendarEvent = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventId: string) => (calendarAPI as any).deleteEvent(eventId),
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
 */
export const useCreatePersonalEvent = (): UseMutationResult<CalendarEvent, AxiosError, Partial<CalendarEvent>> => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventData: Partial<CalendarEvent>) => (calendarAPI as any).createPersonalEvent(eventData),
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
 */
export const useUpdatePersonalEvent = (): UseMutationResult<CalendarEvent, AxiosError, UpdateEventParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, eventData }: UpdateEventParams) => (calendarAPI as any).updatePersonalEvent(eventId, eventData),
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
 */
export const useDeletePersonalEvent = (): UseMutationResult<void, AxiosError, string> => {
  const queryClient = useQueryClient();

  return useMutation(
    (eventId: string) => (calendarAPI as any).deletePersonalEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['personalEvents']);
      },
    }
  );
};

/**
 * Hook for RSVP to an event
 */
export const useRSVPEvent = (): UseMutationResult<any, AxiosError, RSVPParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, status }: RSVPParams) => (calendarAPI as any).rsvp(eventId, { status }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
        queryClient.invalidateQueries(['calendarEvent', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for adding event attendees
 */
export const useAddEventAttendees = (): UseMutationResult<any, AxiosError, AddAttendeesParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userIds }: AddAttendeesParams) => (calendarAPI as any).addAttendees(eventId, { user_ids: userIds }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for removing event attendee
 */
export const useRemoveEventAttendee = (): UseMutationResult<any, AxiosError, RemoveAttendeeParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userId }: RemoveAttendeeParams) => (calendarAPI as any).removeAttendee(eventId, userId),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for marking event attendance
 */
export const useMarkEventAttendance = (): UseMutationResult<any, AxiosError, MarkAttendanceParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ eventId, userId, attended }: MarkAttendanceParams) =>
      (calendarAPI as any).markAttendance(eventId, userId, { attended }),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['eventAttendees', variables.eventId]);
      },
    }
  );
};

/**
 * Hook for exporting calendar
 */
export const useExportCalendar = (): UseMutationResult<any, AxiosError, ExportParams> => {
  return useMutation(
    ({ courseId, format: _format = 'ical' }: ExportParams) => (calendarAPI as any).exportToICal({ course_id: courseId }),
    {
      // No query invalidation needed for export
    }
  );
};

/**
 * Hook for syncing calendar with external source
 */
export const useSyncCalendar = (): UseMutationResult<any, AxiosError, SyncParams> => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ courseId, syncData }: SyncParams) => (calendarAPI as any).syncCalendar(courseId, syncData),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['calendarEvents', variables.courseId]);
        queryClient.invalidateQueries(['upcomingEvents']);
      },
    }
  );
};

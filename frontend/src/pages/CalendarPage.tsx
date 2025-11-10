import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import CalendarGrid from '../components/calendar/CalendarGrid';

type ViewType = 'list' | 'calendar';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  event_type: string;
  location?: string;
  meeting_url?: string;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('list');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Get current month range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await (calendarAPI as any).getCalendarView({
        start_date: startOfMonth.toISOString(),
        end_date: endOfMonth.toISOString(),
      });

      // Combine course and personal events
      const allEvents = [
        ...(response.data.course_events || []),
        ...(response.data.personal_events || []),
      ];

      // Sort by start time
      allEvents.sort((a: CalendarEvent, b: CalendarEvent) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      setEvents(allEvents);
    } catch (err: any) {
      setError(err.response?.data?.detail || '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      class: 'bg-blue-100 text-blue-700 border-blue-300',
      assignment: 'bg-purple-100 text-purple-700 border-purple-300',
      quiz: 'bg-green-100 text-green-700 border-green-300',
      exam: 'bg-red-100 text-red-700 border-red-300',
      office_hours: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      holiday: 'bg-gray-100 text-gray-700 border-gray-300',
      personal: 'bg-pink-100 text-pink-700 border-pink-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getEventTypeText = (type: string): string => {
    const types: Record<string, string> = {
      class: '강의',
      assignment: '과제',
      quiz: '퀴즈',
      exam: '시험',
      office_hours: '면담',
      holiday: '휴일',
      personal: '개인',
    };
    return types[type] || type;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">캘린더</h1>
        <p className="mt-2 text-gray-600">
          강의 일정과 개인 일정을 관리하세요.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* View Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'list'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          목록 보기
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'calendar'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          캘린더 보기
        </button>
      </div>

      {/* Event List */}
      {view === 'list' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">등록된 일정이 없습니다.</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-2 ${getEventTypeColor(event.event_type)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-white rounded">
                        {getEventTypeText(event.event_type)}
                      </span>
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                    </div>

                    {event.description && (
                      <p className="text-sm mb-2">{event.description}</p>
                    )}

                    <div className="text-sm space-y-1">
                      <div>
                        📅 {new Date(event.start_time).toLocaleString('ko-KR')}
                        {!event.all_day && ` ~ ${new Date(event.end_time).toLocaleString('ko-KR')}`}
                      </div>
                      {event.location && <div>📍 {event.location}</div>}
                      {event.meeting_url && (
                        <div>
                          🔗 <a href={event.meeting_url} target="_blank" rel="noopener noreferrer" className="underline">
                            회의 링크
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Calendar View - Grid */}
      {view === 'calendar' && (
        <CalendarGrid
          events={events}
          onDateClick={(date: Date) => {
            console.log('Date clicked:', date);
          }}
          onEventClick={(event: CalendarEvent) => {
            console.log('Event clicked:', event);
          }}
        />
      )}
    </div>
  );
};

export default CalendarPage;

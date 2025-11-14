// @ts-nocheck
import { useState } from 'react';

const CalendarGrid = ({ events, onDateClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month's days
    const prevMonthDays = firstDay;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i),
        isCurrentMonth: false,
        isPrevMonth: true,
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true,
        isPrevMonth: false,
      });
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false,
        isPrevMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!events) return [];

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeColor = (type) => {
    const colors = {
      class: 'bg-blue-500',
      assignment: 'bg-purple-500',
      quiz: 'bg-green-500',
      exam: 'bg-red-500',
      office_hours: 'bg-yellow-500',
      holiday: 'bg-gray-500',
      personal: 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="text-white hover:bg-white/20 p-2 rounded transition"
          >
            ← 이전
          </button>

          <h2 className="text-xl font-bold text-white">{monthName}</h2>

          <button
            onClick={goToNextMonth}
            className="text-white hover:bg-white/20 p-2 rounded transition"
          >
            다음 →
          </button>
        </div>

        <button
          onClick={goToToday}
          className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded transition"
        >
          오늘
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-100 border-b">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center py-2 font-semibold text-sm ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y">
        {calendarDays.map((dayInfo, index) => {
          const dayEvents = getEventsForDate(dayInfo.date);
          const isTodayDate = isToday(dayInfo.date);

          return (
            <div
              key={index}
              className={`min-h-24 p-2 hover:bg-gray-50 transition cursor-pointer ${
                !dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              }`}
              onClick={() => onDateClick?.(dayInfo.date)}
            >
              {/* Day Number */}
              <div
                className={`text-right mb-1 ${
                  isTodayDate
                    ? 'inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full font-bold text-sm'
                    : 'font-semibold text-sm'
                } ${
                  index % 7 === 0 && dayInfo.isCurrentMonth
                    ? 'text-red-600'
                    : index % 7 === 6 && dayInfo.isCurrentMonth
                    ? 'text-blue-600'
                    : ''
                }`}
              >
                {dayInfo.day}
              </div>

              {/* Events for this day */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 transition ${getEventTypeColor(
                      event.event_type
                    )}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}

                {/* Show "+N more" if there are more events */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 font-semibold">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-4 border-t">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded"></span>
            <span>강의</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-purple-500 rounded"></span>
            <span>과제</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span>퀴즈</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded"></span>
            <span>시험</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-500 rounded"></span>
            <span>면담</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-pink-500 rounded"></span>
            <span>개인</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

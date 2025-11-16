/**
 * Gantt Chart Component
 * 프로젝트 타임라인을 간트 차트로 시각화
 */
import React, { useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  assignee_name?: string;
  status: string;
}

interface GanttChartProps {
  tasks: Task[];
  projectStartDate: string;
  projectEndDate: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, projectStartDate, projectEndDate }) => {
  const { timelineData, dayColumns } = useMemo(() => {
    const start = new Date(projectStartDate);
    const end = new Date(projectEndDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const columns: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      columns.push(date);
    }

    const taskData = tasks.map((task) => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date);
      const taskStartDay = Math.max(
        0,
        Math.ceil((taskStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const taskDuration =
        Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        ...task,
        startDay: taskStartDay,
        duration: taskDuration,
      };
    });

    return {
      timelineData: taskData,
      dayColumns: columns,
    };
  }, [tasks, projectStartDate, projectEndDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'todo':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Get week groupings
  const weekGroups = useMemo(() => {
    const groups: { weekStart: Date; days: number }[] = [];
    let currentWeekStart = new Date(dayColumns[0]);
    let dayCount = 1;

    for (let i = 1; i < dayColumns.length; i++) {
      const currentDay = dayColumns[i];
      const weekStart = new Date(currentDay);
      weekStart.setDate(currentDay.getDate() - currentDay.getDay());

      if (weekStart.getTime() !== currentWeekStart.getTime()) {
        groups.push({ weekStart: currentWeekStart, days: dayCount });
        currentWeekStart = weekStart;
        dayCount = 1;
      } else {
        dayCount++;
      }
    }
    groups.push({ weekStart: currentWeekStart, days: dayCount });

    return groups;
  }, [dayColumns]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">간트 차트</h3>
        <p className="text-sm text-gray-600 mt-1">프로젝트 타임라인 및 태스크 진행 상황</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Timeline Header - Weeks */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-64 flex-shrink-0 px-4 py-2 font-semibold text-gray-700 border-r border-gray-200">
              태스크
            </div>
            <div className="flex flex-1">
              {weekGroups.map((week, index) => (
                <div
                  key={index}
                  className="border-r border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-600"
                  style={{ width: `${week.days * 40}px` }}
                >
                  {week.weekStart.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Header - Days */}
          <div className="flex border-b border-gray-300 bg-gray-50">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex flex-1">
              {dayColumns.map((date, index) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div
                    key={index}
                    className={`w-10 border-r border-gray-200 px-1 py-1 text-center text-xs ${
                      isWeekend ? 'bg-gray-100 text-gray-500' : 'text-gray-600'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tasks */}
          {timelineData.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>표시할 태스크가 없습니다</p>
            </div>
          ) : (
            timelineData.map((task) => (
              <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {/* Task Name */}
                <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-200">
                  <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
                  {task.assignee_name && (
                    <p className="text-xs text-gray-500 mt-1">👤 {task.assignee_name}</p>
                  )}
                </div>

                {/* Timeline */}
                <div className="flex flex-1 relative">
                  {dayColumns.map((_, index) => {
                    const isWeekend = dayColumns[index].getDay() === 0 || dayColumns[index].getDay() === 6;
                    return (
                      <div
                        key={index}
                        className={`w-10 border-r border-gray-100 ${isWeekend ? 'bg-gray-50' : ''}`}
                      />
                    );
                  })}

                  {/* Task Bar */}
                  <div
                    className="absolute top-2 bottom-2 rounded-lg shadow-sm flex items-center px-2 overflow-hidden"
                    style={{
                      left: `${task.startDay * 40}px`,
                      width: `${task.duration * 40}px`,
                    }}
                  >
                    {/* Background */}
                    <div className={`absolute inset-0 ${getStatusColor(task.status)} opacity-70`} />
                    {/* Progress */}
                    <div
                      className={`absolute inset-0 ${getStatusColor(task.status)}`}
                      style={{ width: `${task.progress}%` }}
                    />
                    {/* Text */}
                    <span className="relative z-10 text-xs font-medium text-white truncate">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-gray-600">할 일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-600">진행중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600">완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;

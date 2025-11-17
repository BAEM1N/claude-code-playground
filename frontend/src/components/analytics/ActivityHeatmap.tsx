/**
 * Activity Heatmap Component
 * GitHub 스타일 활동 히트맵
 */
import React from 'react';

interface ActivityData {
  date: string;
  count: number;
  level: number; // 0-4
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  year?: number;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, year = new Date().getFullYear() }) => {
  const getWeeksInYear = (year: number) => {
    const weeks: Date[][] = [];
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    // Start from the first Sunday
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    let currentWeek: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }

      if (currentDate <= lastDay || currentDate.getDay() === 0) {
        currentWeek.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        break;
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const getActivityLevel = (date: Date): ActivityData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return data.find((d) => d.date === dateStr);
  };

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-gray-100';
      case 1:
        return 'bg-green-200';
      case 2:
        return 'bg-green-400';
      case 3:
        return 'bg-green-600';
      case 4:
        return 'bg-green-800';
      default:
        return 'bg-gray-100';
    }
  };

  const weeks = getWeeksInYear(year);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">활동 히트맵</h3>
        <span className="text-sm text-gray-600">{year}년</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1">
            <div className="w-8"></div>
            {months.map((month, idx) => (
              <div
                key={month}
                className="text-xs text-gray-600"
                style={{ marginLeft: idx === 0 ? '0' : `${(52 / 12) * 12}px` }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-around mr-2 text-xs text-gray-600">
              <div>Mon</div>
              <div>Wed</div>
              <div>Fri</div>
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((date, dayIdx) => {
                    const activity = getActivityLevel(date);
                    const level = activity?.level || 0;
                    const isCurrentYear = date.getFullYear() === year;

                    return (
                      <div
                        key={dayIdx}
                        className={`w-3 h-3 rounded-sm ${
                          isCurrentYear ? getLevelColor(level) : 'bg-gray-50'
                        } hover:ring-2 hover:ring-indigo-500 cursor-pointer transition-all`}
                        title={`${date.toLocaleDateString('ko-KR')}: ${activity?.count || 0} activities`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;

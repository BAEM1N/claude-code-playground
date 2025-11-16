/**
 * Task Board Component (Kanban)
 * 칸반 보드 방식의 태스크 관리
 */
import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  progress: number;
  assignee_name?: string;
  assignee_avatar?: string;
  due_date?: string;
  tags?: string[];
}

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskClick, onTaskMove }) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: { id: string; title: string; icon: string }[] = [
    { id: 'todo', title: '할 일', icon: '📋' },
    { id: 'in_progress', title: '진행중', icon: '⚙️' },
    { id: 'review', title: '리뷰중', icon: '👀' },
    { id: 'completed', title: '완료', icon: '✅' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div
              key={column.id}
              className="bg-gray-100 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{column.icon}</span>
                  <h3 className="font-bold text-gray-900">{column.title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-semibold text-gray-700">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                    태스크 없음
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => onTaskClick(task)}
                      className={`border-l-4 ${getPriorityColor(
                        task.priority
                      )} bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      {/* Title */}
                      <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs">
                        {/* Assignee */}
                        {task.assignee_name && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                              {task.assignee_avatar ? (
                                <img
                                  src={task.assignee_avatar}
                                  alt={task.assignee_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                task.assignee_name.charAt(0)
                              )}
                            </div>
                            <span className="text-gray-600">{task.assignee_name}</span>
                          </div>
                        )}

                        {/* Priority & Due Date */}
                        <div className="flex items-center gap-2 ml-auto">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                isOverdue(task.due_date)
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isOverdue(task.due_date) && '⚠️ '}
                              {new Date(task.due_date).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Button */}
              <button className="w-full mt-3 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                + 태스크 추가
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;

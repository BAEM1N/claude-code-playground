/**
 * Project Detail Component
 * 프로젝트 상세 정보, 간트 차트, 칸반 보드, 팀 멤버 관리
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamProjectsAPI } from '../../services/api';
import GanttChart from './GanttChart';
import TaskBoard from './TaskBoard';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  progress: number;
  created_at: string;
}

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

interface Member {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role: string;
}

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'gantt' | 'board'>('overview');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, tasksRes, membersRes] = await Promise.all([
        teamProjectsAPI.getProject(projectId!),
        teamProjectsAPI.getTasks(projectId!),
        teamProjectsAPI.getProjectMembers(projectId!),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load project data:', err);
      setError('프로젝트 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    try {
      await teamProjectsAPI.updateTask(taskId, { status: newStatus });
      await loadProjectData();
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('태스크 업데이트에 실패했습니다');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || '프로젝트를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/projects" className="text-gray-500 hover:text-gray-700">
              ← 프로젝트 목록
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <span className="text-sm text-gray-600">
              {new Date(project.start_date).toLocaleDateString('ko-KR')} -{' '}
              {new Date(project.end_date).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            설정
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
            + 태스크 추가
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">전체 진행률</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{project.progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">전체 태스크</p>
          <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
          <p className="text-sm text-gray-600 mt-1">
            완료: {tasks.filter((t) => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">팀 멤버</p>
          <p className="text-3xl font-bold text-gray-900">{members.length}</p>
          <div className="flex -space-x-2 mt-2">
            {members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                title={member.username}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  member.username.charAt(0)
                )}
              </div>
            ))}
            {members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">남은 기간</p>
          <p className="text-3xl font-bold text-gray-900">
            {Math.ceil(
              (new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )}
          </p>
          <p className="text-sm text-gray-600 mt-1">일</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeView === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 개요
          </button>
          <button
            onClick={() => setActiveView('gantt')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeView === 'gantt'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 간트 차트
          </button>
          <button
            onClick={() => setActiveView('board')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeView === 'board'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 칸반 보드
          </button>
        </div>

        <div className="p-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Team Members */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">팀 멤버</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          member.username.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{member.username}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tasks */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">최근 태스크</h3>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.assignee_name || '할당 안됨'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{task.progress}%</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'gantt' && (
            <GanttChart
              tasks={tasks}
              projectStartDate={project.start_date}
              projectEndDate={project.end_date}
            />
          )}

          {activeView === 'board' && (
            <TaskBoard
              tasks={tasks}
              onTaskClick={setSelectedTask}
              onTaskMove={handleTaskMove}
            />
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedTask.title}</h3>
            <p className="text-gray-600 mb-6">{selectedTask.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">담당자</p>
                <p className="font-semibold text-gray-900">
                  {selectedTask.assignee_name || '할당 안됨'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">상태</p>
                <p className="font-semibold text-gray-900">{selectedTask.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">우선순위</p>
                <p className="font-semibold text-gray-900">{selectedTask.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">진행률</p>
                <p className="font-semibold text-gray-900">{selectedTask.progress}%</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

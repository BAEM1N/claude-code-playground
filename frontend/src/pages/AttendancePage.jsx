import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AttendanceSessionList from '../components/attendance/AttendanceSessionList';
import AttendanceSessionForm from '../components/attendance/AttendanceSessionForm';
import StudentCheckIn from '../components/attendance/StudentCheckIn';
import AttendanceRecords from '../components/attendance/AttendanceRecords';
import { useAuth } from '../contexts/AuthContext';

const AttendancePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list', 'create', 'checkin', 'records'
  const [selectedSession, setSelectedSession] = useState(null);

  const userRole = user?.role || 'student';

  const handleCreateSuccess = () => {
    setView('list');
    // Refresh list
  };

  const handleCheckInSuccess = () => {
    setView('list');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">출석 관리</h1>
        <p className="mt-2 text-gray-600">
          출석 세션을 관리하고 출석 체크를 진행하세요.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setView('list')}
            className={`${
              view === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            출석 세션
          </button>

          {userRole === 'student' && (
            <button
              onClick={() => setView('records')}
              className={`${
                view === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              내 출석 기록
            </button>
          )}

          {(userRole === 'instructor' || userRole === 'assistant') && (
            <button
              onClick={() => setView('create')}
              className={`${
                view === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              새 세션 만들기
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div>
        {view === 'list' && (
          <AttendanceSessionList
            courseId={courseId}
            userRole={userRole}
          />
        )}

        {view === 'create' && (
          <AttendanceSessionForm
            courseId={courseId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'checkin' && (
          <StudentCheckIn
            session={selectedSession}
            onSuccess={handleCheckInSuccess}
          />
        )}

        {view === 'records' && (
          <AttendanceRecords
            courseId={courseId}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

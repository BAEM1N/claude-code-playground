import React from 'react';
import { useAttendanceSessions, useDeleteAttendanceSession } from '../../hooks/useAttendance';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const AttendanceSessionList = ({ courseId, userRole }) => {
  const { data: sessions = [], isLoading, error } = useAttendanceSessions(courseId);
  const deleteMutation = useDeleteAttendanceSession();

  const handleDelete = async (sessionId) => {
    if (!window.confirm('출석 세션을 삭제하시겠습니까?')) return;

    try {
      await deleteMutation.mutateAsync(sessionId);
    } catch (err) {
      alert(err.response?.data?.detail || '삭제에 실패했습니다.');
    }
  };

  const getStatusColor = (session) => {
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) return 'bg-gray-100 text-gray-700';
    if (now > endTime) return 'bg-red-100 text-red-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = (session) => {
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) return '예정';
    if (now > endTime) return '종료';
    return '진행중';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error?.message || '출석 세션을 불러오는데 실패했습니다.'} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">출석 세션</h2>
        {(userRole === 'instructor' || userRole === 'assistant') && (
          <button
            onClick={() => window.location.href = `#create-session`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            + 새 출석 세션
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">출석 세션이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{session.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session)}`}>
                      {getStatusText(session)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      시작: {new Date(session.start_time).toLocaleString('ko-KR')} ~
                      종료: {new Date(session.end_time).toLocaleString('ko-KR')}
                    </p>
                    {session.allow_late_minutes > 0 && (
                      <p>지각 허용: {session.allow_late_minutes}분</p>
                    )}
                  </div>

                  {/* Stats */}
                  {session.total_students && (
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        총 학생: <strong>{session.total_students}</strong>
                      </span>
                      <span className="text-green-600">
                        출석: <strong>{session.present_count || 0}</strong>
                      </span>
                      <span className="text-yellow-600">
                        지각: <strong>{session.late_count || 0}</strong>
                      </span>
                      <span className="text-red-600">
                        결석: <strong>{session.absent_count || 0}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {userRole === 'student' && getStatusText(session) === '진행중' && (
                    <button
                      onClick={() => window.location.href = `#checkin/${session.id}`}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      체크인
                    </button>
                  )}

                  {(userRole === 'instructor' || userRole === 'assistant') && (
                    <>
                      <button
                        onClick={() => window.location.href = `#session/${session.id}`}
                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                      >
                        상세
                      </button>
                      {userRole === 'instructor' && (
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                        >
                          삭제
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceSessionList;

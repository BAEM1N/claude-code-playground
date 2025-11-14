// @ts-nocheck
import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const AttendanceRecords = ({ sessionId, courseId, userRole }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [sessionId, courseId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let response;

      if (userRole === 'student') {
        response = await attendanceAPI.getMyRecords(courseId);
      } else {
        response = await attendanceAPI.getRecords(sessionId);
      }

      setRecords(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || '출석 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800',
    };

    const labels = {
      present: '출석',
      late: '지각',
      absent: '결석',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getMethodText = (method) => {
    const methods = {
      qr: 'QR 코드',
      password: '비밀번호',
      location: '위치',
      manual: '수동',
    };
    return methods[method] || method;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">출석 기록</h3>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          출석 기록이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {userRole !== 'student' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    학생
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  체크인 시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  방법
                </th>
                {userRole !== 'student' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP 주소
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {userRole !== 'student' && (
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.student_name || 'Unknown'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {record.student_username}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(record.checked_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getMethodText(record.check_method)}
                  </td>
                  {userRole !== 'student' && (
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {record.ip_address || '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary for instructors */}
      {userRole !== 'student' && records.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">총 체크인:</span>
              <span className="ml-2 font-semibold">{records.length}명</span>
            </div>
            <div>
              <span className="text-gray-600">출석:</span>
              <span className="ml-2 font-semibold text-green-600">
                {records.filter(r => r.status === 'present').length}명
              </span>
            </div>
            <div>
              <span className="text-gray-600">지각:</span>
              <span className="ml-2 font-semibold text-yellow-600">
                {records.filter(r => r.status === 'late').length}명
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;

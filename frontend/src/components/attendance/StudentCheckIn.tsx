// @ts-nocheck
import { useState } from 'react';
import { attendanceAPI } from '../../services/api';
import ErrorAlert from '../common/ErrorAlert';

const StudentCheckIn = ({ session, onSuccess }) => {
  const [checkInMethod, setCheckInMethod] = useState('qr'); // 'qr' or 'password'
  const [qrCode, setQrCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {};

      if (checkInMethod === 'qr') {
        if (!qrCode) {
          setError('QR 코드를 입력해주세요.');
          setLoading(false);
          return;
        }
        data.qr_code = qrCode;
      } else {
        if (!password) {
          setError('비밀번호를 입력해주세요.');
          setLoading(false);
          return;
        }
        data.password = password;
      }

      // Get location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          data.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (err) {
          console.warn('위치 정보를 가져올 수 없습니다:', err);
        }
      }

      const response = await attendanceAPI.checkIn(data);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.(response.data);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || '출석 체크에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">출석 완료!</h2>
        <p className="text-gray-600">출석 체크가 성공적으로 완료되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">출석 체크</h2>

      {session && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900">{session.title}</h3>
          <p className="text-sm text-blue-700 mt-1">
            {new Date(session.start_time).toLocaleString('ko-KR')} ~
            {new Date(session.end_time).toLocaleString('ko-KR')}
          </p>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {/* Method Selection */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCheckInMethod('qr')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              checkInMethod === 'qr'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            QR 코드
          </button>
          <button
            type="button"
            onClick={() => setCheckInMethod('password')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              checkInMethod === 'password'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            비밀번호
          </button>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          {checkInMethod === 'qr' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR 코드 입력
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="QR 코드를 입력하거나 스캔하세요"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                강의실 스크린에 표시된 QR 코드를 스캔하거나 코드를 입력하세요.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출석 비밀번호
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="출석 비밀번호 입력"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                강의 시간에 공지된 출석 비밀번호를 입력하세요.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {loading ? '체크인 중...' : '출석 체크하기'}
          </button>
        </form>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>출석 체크는 세션 시간 내에만 가능합니다.</p>
        {session?.allow_late_minutes > 0 && (
          <p className="mt-1">
            시작 후 {session.allow_late_minutes}분 이내 체크인 시 지각 처리됩니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentCheckIn;

import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const QRCodeDisplay = ({ sessionId }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchQRCode();

    // Refresh QR code every 30 seconds for security
    const interval = setInterval(() => {
      fetchQRCode();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getSessionQRCode(sessionId);
      setQrData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'QR 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !qrData) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!qrData) return null;

  // Simple QR code generation using data URL
  // In production, you would use a library like qrcode.react
  const generateQRCodeDataURL = (data) => {
    // This is a placeholder - in real implementation, use a QR code library
    // For now, we'll display the encoded data as text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 300);

    // Draw placeholder
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', 150, 140);
    ctx.font = '12px monospace';
    ctx.fillText('(Use QR library)', 150, 160);

    return canvas.toDataURL();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">출석 체크 QR 코드</h2>

      {/* QR Code Display */}
      <div className="flex justify-center mb-6">
        <div className="border-4 border-gray-800 p-4 rounded-lg bg-white">
          {/* In production, replace this with actual QR code component */}
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-2">📱</div>
              <div className="text-sm text-gray-600">QR 코드</div>
              <div className="text-xs text-gray-500 mt-1">
                {qrData.qr_token?.substring(0, 8)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">📌 출석 체크 방법</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>학생들은 모바일 앱으로 QR 코드를 스캔합니다</li>
          <li>또는 웹 페이지에서 수동으로 체크인 가능합니다</li>
          <li>QR 코드는 30초마다 자동으로 갱신됩니다</li>
        </ol>
      </div>

      {/* Session Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">세션 ID:</span>
          <span className="font-mono font-semibold">{sessionId}</span>
        </div>
        {qrData.session_name && (
          <div className="flex justify-between">
            <span className="text-gray-600">세션 이름:</span>
            <span className="font-semibold">{qrData.session_name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">토큰 만료:</span>
          <span className="font-semibold text-orange-600">30초</span>
        </div>
      </div>

      {/* Manual Code Option */}
      {qrData.password && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">수동 입력 코드</h3>
          <div className="bg-gray-100 p-4 rounded text-center">
            <div className="text-3xl font-bold font-mono tracking-wider text-blue-600">
              {qrData.password}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              학생들은 이 코드를 입력하여 출석 체크할 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Auto Refresh Indicator */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          자동 갱신 중 (30초마다)
        </div>
      </div>

      {/* Manual Refresh Button */}
      <button
        onClick={fetchQRCode}
        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 font-medium"
      >
        🔄 수동 갱신
      </button>
    </div>
  );
};

export default QRCodeDisplay;

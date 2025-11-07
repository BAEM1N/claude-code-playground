/**
 * Video Player Component
 * Supports: MinIO (self-hosted), YouTube, Vimeo
 *
 * NOTE: Requires react-player package
 * npm install --legacy-peer-deps react-player
 */
import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({
  videoUrl,
  videoSource,
  thumbnail,
  duration,
  initialPosition = 0,
  onProgressUpdate
}) => {
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef(null);

  // Mark as in progress when video starts
  useEffect(() => {
    if (hasStarted && onProgressUpdate) {
      onProgressUpdate({ status: 'in_progress' });
    }
  }, [hasStarted, onProgressUpdate]);

  // Save position every 10 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (videoRef.current && onProgressUpdate) {
        const time = Math.floor(videoRef.current.currentTime);
        setCurrentTime(time);
        onProgressUpdate({
          video_position_seconds: time,
          status: 'in_progress'
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, onProgressUpdate]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (!hasStarted) {
      setHasStarted(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (videoRef.current && onProgressUpdate) {
      const time = Math.floor(videoRef.current.currentTime);
      onProgressUpdate({
        video_position_seconds: time,
        status: 'in_progress'
      });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onProgressUpdate) {
      onProgressUpdate({ status: 'completed' });
    }
  };

  const renderPlayer = () => {
    if (videoSource === 'youtube') {
      // YouTube embed
      const videoId = extractYouTubeId(videoUrl);
      return (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?start=${initialPosition}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (videoSource === 'vimeo') {
      // Vimeo embed
      const videoId = extractVimeoId(videoUrl);
      return (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://player.vimeo.com/video/${videoId}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // MinIO / self-hosted video
    return (
      <video
        ref={videoRef}
        className="w-full"
        controls
        poster={thumbnail}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => {
          if (initialPosition > 0) {
            e.target.currentTime = initialPosition;
          }
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-black rounded-lg overflow-hidden shadow-lg">
        {renderPlayer()}
      </div>

      {/* Video info */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div>
          {duration && (
            <span>길이: {formatDuration(duration)}</span>
          )}
        </div>
        <div>
          {currentTime > 0 && (
            <span>마지막 재생 위치: {formatDuration(currentTime)}</span>
          )}
        </div>
      </div>

      {/* Complete button */}
      {hasStarted && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => onProgressUpdate && onProgressUpdate({ status: 'completed' })}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            ✓ 학습 완료
          </button>
          <p className="text-sm text-gray-500 mt-2">
            영상을 끝까지 시청하지 않았어도 완료할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper functions
function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : '';
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export default VideoPlayer;

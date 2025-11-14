/**
// @ts-nocheck
 * Full-Featured Video Player Component
// @ts-nocheck
 * Complete implementation with:
// @ts-nocheck
 * - react-player for all video sources (YouTube, Vimeo, MinIO/MP4)
// @ts-nocheck
 * - Playback controls (play, pause, seek, volume)
// @ts-nocheck
 * - Playback speed control
// @ts-nocheck
 * - Progress saving (every 10 seconds)
// @ts-nocheck
 * - Resume from last position
// @ts-nocheck
 * - Fullscreen support
// @ts-nocheck
 * - Picture-in-Picture
// @ts-nocheck
 * - Keyboard shortcuts
// @ts-nocheck
 */
// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({
  videoUrl,
  videoSource,
  thumbnail,
  duration,
  initialPosition = 0,
  onProgressUpdate
}) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [pip, setPip] = useState(false);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Initialize player at saved position
  useEffect(() => {
    if (playerRef.current && initialPosition > 0) {
      playerRef.current.seekTo(initialPosition, 'seconds');
      setPlayed(initialPosition / videoDuration);
    }
  }, [initialPosition, videoDuration]);

  // Save progress periodically
  useEffect(() => {
    if (playing && onProgressUpdate) {
      progressIntervalRef.current = setInterval(() => {
        const currentSeconds = Math.floor(playerRef.current?.getCurrentTime() || 0);
        if (currentSeconds > 0) {
          onProgressUpdate({
            video_position_seconds: currentSeconds,
            status: 'in_progress',
            time_spent_minutes: Math.floor(currentSeconds / 60)
          });
        }
      }, 10000); // Save every 10 seconds

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [playing, onProgressUpdate]);

  // Auto-hide controls
  useEffect(() => {
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setPlaying(p => !p);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerRef.current?.seekTo(Math.max(0, currentTime - 5), 'seconds');
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerRef.current?.seekTo(Math.min(videoDuration, currentTime + 5), 'seconds');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'm':
          e.preventDefault();
          setMuted(m => !m);
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, videoDuration]);

  const handlePlayPause = () => {
    setPlaying(!playing);
    if (!hasStarted) {
      setHasStarted(true);
      if (onProgressUpdate) {
        onProgressUpdate({ status: 'in_progress' });
      }
    }
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
      setCurrentTime(Math.floor(state.playedSeconds));
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const handleDuration = (duration) => {
    setVideoDuration(duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    if (onProgressUpdate) {
      onProgressUpdate({
        status: 'completed',
        video_position_seconds: videoDuration
      });
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
  };

  const handleFullscreen = () => {
    const player = playerRef.current?.wrapper;
    if (player) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        player.requestFullscreen();
      }
    }
  };

  const handlePip = () => {
    setPip(!pip);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div
        className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        {/* Video Player */}
        <div className="relative" style={{ paddingTop: '56.25%' }}>
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            pip={pip}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={handleEnded}
            config={{
              youtube: {
                playerVars: {
                  showinfo: 1,
                  modestbranding: 1
                }
              },
              file: {
                attributes: {
                  poster: thumbnail,
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        </div>

        {/* Custom Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
            showControls || !playing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
            />
            {/* Buffered Progress */}
            <div className="absolute h-1 bg-gray-500 rounded-lg pointer-events-none -mt-1"
              style={{ width: `${loaded * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                {playing ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  {muted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Time */}
              <div className="text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <div className="relative group">
                <button className="hover:bg-white/20 px-3 py-1 rounded text-sm font-medium transition-colors">
                  {playbackRate}x
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-black/95 rounded-lg shadow-lg overflow-hidden">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`block w-full px-4 py-2 text-sm hover:bg-white/20 transition-colors text-left ${
                        playbackRate === rate ? 'bg-white/10 font-semibold' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Picture-in-Picture */}
              {ReactPlayer.canEnablePIP(videoUrl) && (
                <button
                  onClick={handlePip}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                  title="Picture-in-Picture"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                title="전체화면 (F)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={handlePlayPause}
              className="w-20 h-20 bg-blue-600/90 hover:bg-blue-700/90 rounded-full flex items-center justify-center pointer-events-auto transition-all transform hover:scale-110 shadow-2xl"
            >
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Video Info & Shortcuts */}
      <div className="mt-6 space-y-4">
        {/* Keyboard Shortcuts */}
        <details className="bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            키보드 단축키
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">재생/일시정지</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Space</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">전체화면</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">5초 뒤로</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">←</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">5초 앞으로</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">→</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">볼륨 높이기</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">↑</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">볼륨 낮추기</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">↓</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">음소거</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">M</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded">
              <span className="text-gray-600">재생/일시정지</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">K</kbd>
            </div>
          </div>
        </details>

        {/* Complete Button */}
        {hasStarted && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>영상 학습을 완료하셨나요?</p>
                <p className="text-xs mt-1">
                  현재 진행률: {Math.round(played * 100)}% ·
                  마지막 저장 위치: {formatTime(currentTime)}
                </p>
              </div>
              <button
                onClick={() => onProgressUpdate && onProgressUpdate({ status: 'completed' })}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                ✓ 학습 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

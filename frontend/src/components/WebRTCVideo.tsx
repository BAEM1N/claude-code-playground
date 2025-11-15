import React, { useEffect, useRef, useState } from 'react';
import { ClassroomParticipant } from '../types/virtualClassroom';

interface WebRTCVideoProps {
  participant: ClassroomParticipant;
  stream?: MediaStream;
  isLocal?: boolean;
  isSpeaking?: boolean;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
}

const WebRTCVideo: React.FC<WebRTCVideoProps> = ({
  participant,
  stream,
  isLocal = false,
  isSpeaking = false,
  onToggleVideo,
  onToggleAudio,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Check if stream has video track
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
    }
  }, [participant.is_video_enabled, stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Video element */}
      {hasVideo && participant.is_video_enabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
              U{participant.user_id}
            </div>
            <p className="text-white text-sm">User {participant.user_id}</p>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none"></div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              User {participant.user_id} {isLocal && '(You)'}
            </span>
            {participant.role === 'host' && (
              <span className="px-2 py-0.5 bg-yellow-500 text-xs rounded-full text-white">
                Host
              </span>
            )}
            {participant.role === 'presenter' && (
              <span className="px-2 py-0.5 bg-blue-500 text-xs rounded-full text-white">
                Presenter
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Video status */}
            {participant.is_video_enabled ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v.586l-4-4V4a2 2 0 00-2-2H6.586l-2.88-2.88zM2 6a2 2 0 012-2h.586l8 8H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            )}

            {/* Audio status */}
            {participant.is_audio_enabled ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A7 7 0 0017 8a1 1 0 10-2 0 5 5 0 01-.534 2.23l-1.33-1.33A3.001 3.001 0 0013 8V4a3 3 0 00-5.707-1.293L3.707 2.293zM7.879 7.879A3 3 0 007 8v0a3 3 0 003 3v0c.364 0 .704-.083 1.011-.23l-3.132-3.132zM5 8a5.001 5.001 0 004.793 4.997v2.073H6a1 1 0 100 2h8a1 1 0 100-2h-3.793v-2.073A7.001 7.001 0 0017 8a1 1 0 10-2 0 5 5 0 01-5 5v0a5 5 0 01-5-5 1 1 0 00-2 0z" clipRule="evenodd" />
              </svg>
            )}

            {/* Screen sharing indicator */}
            {participant.is_screen_sharing && (
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Connection quality indicator */}
      {participant.connection_quality && (
        <div className="absolute top-2 right-2">
          <div
            className={`w-2 h-2 rounded-full ${
              participant.connection_quality === 'excellent'
                ? 'bg-green-500'
                : participant.connection_quality === 'good'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          ></div>
        </div>
      )}

      {/* Local controls */}
      {isLocal && (onToggleVideo || onToggleAudio) && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`p-2 rounded-full ${
                participant.is_video_enabled ? 'bg-gray-700' : 'bg-red-600'
              } text-white hover:bg-opacity-80 transition`}
            >
              {participant.is_video_enabled ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v.586l-4-4V4a2 2 0 00-2-2H6.586l-2.88-2.88zM2 6a2 2 0 012-2h.586l8 8H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={`p-2 rounded-full ${
                participant.is_audio_enabled ? 'bg-gray-700' : 'bg-red-600'
              } text-white hover:bg-opacity-80 transition`}
            >
              {participant.is_audio_enabled ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A7 7 0 0017 8a1 1 0 10-2 0 5 5 0 01-.534 2.23l-1.33-1.33A3.001 3.001 0 0013 8V4a3 3 0 00-5.707-1.293L3.707 2.293zM7.879 7.879A3 3 0 007 8v0a3 3 0 003 3v0c.364 0 .704-.083 1.011-.23l-3.132-3.132zM5 8a5.001 5.001 0 004.793 4.997v2.073H6a1 1 0 100 2h8a1 1 0 100-2h-3.793v-2.073A7.001 7.001 0 0017 8a1 1 0 10-2 0 5 5 0 01-5 5v0a5 5 0 01-5-5 1 1 0 00-2 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WebRTCVideo;

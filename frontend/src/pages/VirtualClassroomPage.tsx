// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebRTCVideo from '../components/WebRTCVideo';
import Whiteboard from '../components/Whiteboard';
import {
  VirtualClassroomDetail,
  ClassroomParticipant,
  WebRTCPeerConnection,
  ChatMessage,
} from '../types/virtualClassroom';

// ICE servers configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VirtualClassroomPage: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState<VirtualClassroomDetail | null>(null);
  const [participants, setParticipants] = useState<ClassroomParticipant[]>([]);
  const [peerConnections, setPeerConnections] = useState<Map<string, WebRTCPeerConnection>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [myParticipant, setMyParticipant] = useState<ClassroomParticipant | null>(null);

  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard'>('video');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const whiteboardRef = useRef<any>(null);

  useEffect(() => {
    initializeClassroom();
    return () => {
      cleanup();
    };
  }, [classroomId]);

  const initializeClassroom = async () => {
    // TODO: Fetch classroom details from API
    // const { data } = await api.get(`/virtual-classroom/classrooms/${classroomId}`);
    // setClassroom(data);

    // Generate peer ID
    const peerId = `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setMyPeerId(peerId);

    // Initialize WebSocket connection
    initializeWebSocket(peerId);

    // Get user media
    await initializeMedia();
  };

  const initializeWebSocket = (peerId: string) => {
    // TODO: Replace with actual WebSocket URL
    const ws = new WebSocket(`ws://localhost:8000/ws/classroom/${classroomId}?peer_id=${peerId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join classroom
      ws.send(
        JSON.stringify({
          type: 'classroom_join',
          classroom_id: parseInt(classroomId || '0'),
          peer_id: peerId,
        })
      );
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = async (message: any) => {
    switch (message.type) {
      case 'classroom_user_joined':
        handleUserJoined(message);
        break;
      case 'classroom_user_left':
        handleUserLeft(message);
        break;
      case 'webrtc_offer':
        await handleWebRTCOffer(message);
        break;
      case 'webrtc_answer':
        await handleWebRTCAnswer(message);
        break;
      case 'webrtc_ice_candidate':
        await handleICECandidate(message);
        break;
      case 'media_toggle':
        handleMediaToggle(message);
        break;
      case 'screen_share_toggle':
        handleScreenShareToggle(message);
        break;
      case 'whiteboard_stroke':
        handleWhiteboardStroke(message);
        break;
      case 'whiteboard_clear':
        handleWhiteboardClear();
        break;
      case 'chat_message':
        handleChatMessage(message);
        break;
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const handleUserJoined = (message: any) => {
    console.log('User joined:', message);
    setParticipants(message.online_participants || []);

    // Create peer connections for new user
    if (message.peer_id !== myPeerId && localStream) {
      createPeerConnection(message.peer_id, message.user_id, true);
    }
  };

  const handleUserLeft = (message: any) => {
    console.log('User left:', message);
    setParticipants((prev) => prev.filter((p) => p.peer_id !== message.peer_id));

    // Remove peer connection
    const pc = peerConnections.get(message.peer_id);
    if (pc) {
      pc.connection.close();
      peerConnections.delete(message.peer_id);
      setPeerConnections(new Map(peerConnections));
    }
  };

  const createPeerConnection = async (peerId: string, userId: number, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeerConnections((prev) => {
        const newMap = new Map(prev);
        newMap.set(peerId, {
          peerId,
          userId,
          connection: pc,
          stream: remoteStream,
        });
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_ice_candidate',
            classroom_id: parseInt(classroomId || '0'),
            target_peer_id: peerId,
            candidate: event.candidate.toJSON(),
          })
        );
      }
    };

    // Store peer connection
    setPeerConnections((prev) => {
      const newMap = new Map(prev);
      newMap.set(peerId, {
        peerId,
        userId,
        connection: pc,
      });
      return newMap;
    });

    // If initiator, create and send offer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_offer',
            classroom_id: parseInt(classroomId || '0'),
            target_peer_id: peerId,
            sdp: offer,
          })
        );
      }
    }
  };

  const handleWebRTCOffer = async (message: any) => {
    if (message.target_peer_id !== myPeerId) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeerConnections((prev) => {
        const newMap = new Map(prev);
        newMap.set(message.from_peer_id, {
          peerId: message.from_peer_id,
          userId: message.from_user_id,
          connection: pc,
          stream: remoteStream,
        });
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_ice_candidate',
            classroom_id: parseInt(classroomId || '0'),
            target_peer_id: message.from_peer_id,
            candidate: event.candidate.toJSON(),
          })
        );
      }
    };

    // Set remote description and create answer
    await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'webrtc_answer',
          classroom_id: parseInt(classroomId || '0'),
          target_peer_id: message.from_peer_id,
          sdp: answer,
        })
      );
    }

    // Store peer connection
    setPeerConnections((prev) => {
      const newMap = new Map(prev);
      newMap.set(message.from_peer_id, {
        peerId: message.from_peer_id,
        userId: message.from_user_id,
        connection: pc,
      });
      return newMap;
    });
  };

  const handleWebRTCAnswer = async (message: any) => {
    if (message.target_peer_id !== myPeerId) return;

    const peerConnection = peerConnections.get(message.from_peer_id);
    if (peerConnection) {
      await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(message.sdp));
    }
  };

  const handleICECandidate = async (message: any) => {
    if (message.target_peer_id && message.target_peer_id !== myPeerId) return;

    const peerConnection = peerConnections.get(message.from_peer_id);
    if (peerConnection && message.candidate) {
      await peerConnection.connection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  const handleMediaToggle = (message: any) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.peer_id === message.peer_id) {
          return {
            ...p,
            is_video_enabled: message.media_type === 'video' ? message.enabled : p.is_video_enabled,
            is_audio_enabled: message.media_type === 'audio' ? message.enabled : p.is_audio_enabled,
          };
        }
        return p;
      })
    );
  };

  const handleScreenShareToggle = (message: any) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.peer_id === message.peer_id) {
          return { ...p, is_screen_sharing: message.is_sharing };
        }
        return p;
      })
    );
  };

  const handleWhiteboardStroke = (message: any) => {
    if (whiteboardRef.current && whiteboardRef.current.addStroke) {
      whiteboardRef.current.addStroke(message.stroke_data);
    }
  };

  const handleWhiteboardClear = () => {
    if (whiteboardRef.current && whiteboardRef.current.clearCanvas) {
      whiteboardRef.current.clearCanvas();
    }
  };

  const handleChatMessage = (message: any) => {
    setChatMessages((prev) => [
      ...prev,
      {
        user_id: message.user_id,
        message: message.message,
        timestamp: message.timestamp,
      },
    ]);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'media_toggle',
              classroom_id: parseInt(classroomId || '0'),
              media_type: 'video',
              enabled: videoTrack.enabled,
            })
          );
        }
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'media_toggle',
              classroom_id: parseInt(classroomId || '0'),
              media_type: 'audio',
              enabled: audioTrack.enabled,
            })
          );
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (screenStream) {
      // Stop screen sharing
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);

      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'screen_share_toggle',
            classroom_id: parseInt(classroomId || '0'),
            is_sharing: false,
          })
        );
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        setScreenStream(stream);

        // Replace video track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        peerConnections.forEach((pc) => {
          const sender = pc.connection.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'screen_share_toggle',
              classroom_id: parseInt(classroomId || '0'),
              is_sharing: true,
            })
          );
        }

        // Handle screen share stop
        videoTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          classroom_id: parseInt(classroomId || '0'),
          message: chatInput,
        })
      );
      setChatInput('');
    }
  };

  const handleWhiteboardStrokeLocal = (stroke: any, order: number) => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'whiteboard_stroke',
          classroom_id: parseInt(classroomId || '0'),
          stroke_data: stroke,
          stroke_order: order,
        })
      );
    }
  };

  const handleWhiteboardClearLocal = () => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'whiteboard_clear',
          classroom_id: parseInt(classroomId || '0'),
        })
      );
    }
  };

  const leaveClassroom = () => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'classroom_leave',
          classroom_id: parseInt(classroomId || '0'),
        })
      );
    }
    cleanup();
    navigate('/dashboard');
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnections.forEach((pc) => {
      pc.connection.close();
    });

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Virtual Classroom</h1>
              <p className="text-sm text-gray-600">Classroom ID: {classroomId}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {participants.length} Participants
              </div>

              <button
                onClick={leaveClassroom}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Leave Classroom
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Participants */}
          {showParticipants && (
            <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Participants</h3>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                      U{participant.user_id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        User {participant.user_id}
                      </p>
                      <p className="text-xs text-gray-500">{participant.role}</p>
                    </div>
                    <div className="flex gap-1">
                      {participant.is_video_enabled ? (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v.586l-4-4V4a2 2 0 00-2-2H6.586l-2.88-2.88zM2 6a2 2 0 012-2h.586l8 8H4a2 2 0 01-2-2V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {participant.is_audio_enabled ? (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A7 7 0 0017 8a1 1 0 10-2 0 5 5 0 01-.534 2.23l-1.33-1.33A3.001 3.001 0 0013 8V4a3 3 0 00-5.707-1.293L3.707 2.293zM7.879 7.879A3 3 0 007 8v0a3 3 0 003 3v0c.364 0 .704-.083 1.011-.23l-3.132-3.132zM5 8a5.001 5.001 0 004.793 4.997v2.073H6a1 1 0 100 2h8a1 1 0 100-2h-3.793v-2.073A7.001 7.001 0 0017 8a1 1 0 10-2 0 5 5 0 01-5 5v0a5 5 0 01-5-5 1 1 0 00-2 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Center - Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab navigation */}
            <div className="bg-white border-b border-gray-200 px-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition ${
                    activeTab === 'video'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Video Conference
                </button>
                <button
                  onClick={() => setActiveTab('whiteboard')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition ${
                    activeTab === 'whiteboard'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Whiteboard
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden p-6">
              {activeTab === 'video' ? (
                <div className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-auto">
                    {/* Local video */}
                    {localStream && myParticipant && (
                      <div className="aspect-video">
                        <WebRTCVideo
                          participant={myParticipant}
                          stream={localStream}
                          isLocal={true}
                          onToggleVideo={toggleVideo}
                          onToggleAudio={toggleAudio}
                        />
                      </div>
                    )}

                    {/* Remote videos */}
                    {Array.from(peerConnections.values()).map((pc) => {
                      const participant = participants.find((p) => p.peer_id === pc.peerId);
                      if (!participant) return null;

                      return (
                        <div key={pc.peerId} className="aspect-video">
                          <WebRTCVideo participant={participant} stream={pc.stream} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <Whiteboard
                    ref={whiteboardRef}
                    classroomId={parseInt(classroomId || '0')}
                    onStroke={handleWhiteboardStrokeLocal}
                    onClear={handleWhiteboardClearLocal}
                  />
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${
                    localStream?.getVideoTracks()[0]?.enabled
                      ? 'bg-gray-700'
                      : 'bg-red-600'
                  } text-white hover:bg-opacity-80 transition`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${
                    localStream?.getAudioTracks()[0]?.enabled
                      ? 'bg-gray-700'
                      : 'bg-red-600'
                  } text-white hover:bg-opacity-80 transition`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full ${
                    screenStream ? 'bg-blue-600' : 'bg-gray-700'
                  } text-white hover:bg-opacity-80 transition`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-3 rounded-full bg-gray-700 text-white hover:bg-opacity-80 transition"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar - Chat */}
          {showChat && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                      U{msg.user_id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-900">User {msg.user_id}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroomPage;

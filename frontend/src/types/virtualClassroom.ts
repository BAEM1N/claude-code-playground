export enum ParticipantRole {
  HOST = 'host',
  PRESENTER = 'presenter',
  PARTICIPANT = 'participant',
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  POOR = 'poor',
}

export interface VirtualClassroom {
  id: number;
  title: string;
  description?: string;
  host_id: number;
  course_id?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  is_active: boolean;
  is_recording: boolean;
  max_participants: number;
  settings?: {
    enableChat?: boolean;
    enableWhiteboard?: boolean;
    enableScreenShare?: boolean;
    enableRecording?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ClassroomParticipant {
  id: number;
  classroom_id: number;
  user_id: number;
  role: ParticipantRole;
  peer_id?: string;
  is_online: boolean;
  is_video_enabled: boolean;
  is_audio_enabled: boolean;
  is_screen_sharing: boolean;
  connection_quality?: ConnectionQuality;
  joined_at: string;
  left_at?: string;
}

export interface WhiteboardStroke {
  id: number;
  classroom_id: number;
  user_id: number;
  stroke_data: {
    points: { x: number; y: number }[];
    color: string;
    width: number;
    tool: 'pen' | 'eraser' | 'highlighter';
  };
  stroke_order: number;
  is_deleted: boolean;
  created_at: string;
}

export interface SharedFile {
  id: number;
  classroom_id: number;
  uploaded_by_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  description?: string;
  is_available: boolean;
  download_count: number;
  uploaded_at: string;
}

export interface ClassroomRecording {
  id: number;
  classroom_id: number;
  filename: string;
  file_size?: number;
  duration?: number;
  format: string;
  started_at: string;
  ended_at?: string;
  is_processing: boolean;
  is_available: boolean;
  view_count: number;
  created_at: string;
}

export interface VirtualClassroomDetail extends VirtualClassroom {
  participants: ClassroomParticipant[];
  active_participants_count?: number;
  recordings: ClassroomRecording[];
}

export interface CreateClassroomData {
  title: string;
  description?: string;
  course_id?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  max_participants?: number;
  settings?: {
    enableChat?: boolean;
    enableWhiteboard?: boolean;
    enableScreenShare?: boolean;
    enableRecording?: boolean;
  };
}

export interface UpdateClassroomData {
  title?: string;
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  max_participants?: number;
  settings?: Record<string, any>;
}

// WebRTC related types
export interface WebRTCPeerConnection {
  peerId: string;
  userId: number;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface ChatMessage {
  user_id: number;
  message: string;
  timestamp: string;
}

/**
 * Type definitions for the Learning Management System
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  role?: 'student' | 'instructor' | 'assistant' | 'admin';
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  avatar_url?: string;
  bio?: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signOut: () => Promise<void>;
}

// ============================================================================
// Course Types
// ============================================================================

export interface Course {
  id: string;
  name: string;
  title?: string;
  code?: string;
  description?: string;
  instructor_id?: string;
  instructor_name?: string;
  semester?: string;
  schedule?: string;
  location?: string;
  syllabus?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseMember {
  id: string;
  course_id: string;
  user_id: string;
  role: 'instructor' | 'assistant' | 'student';
  enrolled_at?: string;
}

// ============================================================================
// Assignment Types
// ============================================================================

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date?: string;
  points?: number;
  allow_resubmission?: boolean;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  status?: 'submitted' | 'graded' | 'returned';
  submitted_at?: string;
  grade?: Grade;
}

// Alias for clarity in API usage
export type AssignmentSubmission = Submission;

export interface Grade {
  id: string;
  submission_id: string;
  score?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
}

// ============================================================================
// Message & Channel Types
// ============================================================================

export interface Channel {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  type?: 'general' | 'announcement' | 'discussion';
  created_at?: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  parent_message_id?: string;
  created_at?: string;
  updated_at?: string;
  files?: FileAttachment[];
}

// ============================================================================
// File Types
// ============================================================================

export interface FileItem {
  id: string;
  course_id: string;
  filename: string;
  name?: string;
  size?: number;
  mime_type?: string;
  folder_id?: string;
  uploader_id?: string;
  uploader_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  course_id: string;
  name: string;
  parent_id?: string;
  created_at?: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  url?: string;
  size?: number;
}

// ============================================================================
// Quiz Types
// ============================================================================

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  time_limit?: number;
  start_time?: string;
  end_time?: string;
  published?: boolean;
  created_at?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  options?: string[];
  correct_answer?: string;
  order?: number;
}

// Alias for clarity in API usage
export type QuizQuestion = Question;

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at?: string;
  submitted_at?: string;
  score?: number;
  status?: 'in_progress' | 'submitted' | 'graded';
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text?: string;
  selected_option?: string;
  is_correct?: boolean;
  points_earned?: number;
  feedback?: string;
}

// ============================================================================
// Attendance Types
// ============================================================================

export interface AttendanceSession {
  id: string;
  course_id: string;
  title: string;
  session_date: string;
  qr_code?: string;
  password?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checked_in_at?: string;
}

// ============================================================================
// Progress & Achievement Types
// ============================================================================

export interface Progress {
  id: string;
  course_id: string;
  user_id: string;
  total_points?: number;
  completed_activities?: number;
  last_activity_at?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points?: number;
  earned_at?: string;
}

export interface Milestone {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value?: number;
  completed?: boolean;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  course_id?: string;
  title: string;
  description?: string;
  event_type?: 'class' | 'assignment' | 'quiz' | 'exam' | 'office_hours' | 'custom';
  start_time: string;
  end_time?: string;
  location?: string;
  is_all_day?: boolean;
  created_at?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'assignment' | 'grade' | 'announcement' | 'message';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page?: number;
}

// ============================================================================
// Common Component Props
// ============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMutationResult<T> {
  mutate: (data: any) => void;
  mutateAsync: (data: any) => Promise<T>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

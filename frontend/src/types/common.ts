/**
 * Common TypeScript type definitions
 */

// Base entity with common fields
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  role?: 'student' | 'instructor' | 'assistant' | 'admin';
  user_metadata?: Record<string, any>;
}

export interface UserProfile extends BaseEntity {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

// Course types
export interface Course extends BaseEntity {
  name: string;
  title?: string;
  code?: string;
  description?: string;
  instructor_id: string;
  instructor_name?: string;
  semester?: string;
  year?: number;
  schedule?: string;
  location?: string;
  syllabus?: string;
  is_active: boolean;
}

export interface CourseMember extends BaseEntity {
  course_id: string;
  user_id: string;
  role: 'student' | 'instructor' | 'assistant';
  enrolled_at: string;
}

// Assignment types
export interface Assignment extends BaseEntity {
  course_id: string;
  title: string;
  description?: string;
  due_date?: string;
  max_score: number;
  is_published: boolean;
  allow_late_submission: boolean;
  late_penalty_per_day?: number;
}

export interface Submission extends BaseEntity {
  assignment_id: string;
  student_id: string;
  content?: string;
  submitted_at: string;
  is_late: boolean;
  score?: number;
  feedback?: string;
}

// File types
export interface FileInfo extends BaseEntity {
  course_id: string;
  folder_id?: string;
  filename: string;
  name?: string;
  size: number;
  mime_type: string;
  storage_path: string;
  uploader_id: string;
  uploader_name?: string;
  download_count: number;
}

export interface Folder extends BaseEntity {
  course_id: string;
  name: string;
  parent_id?: string;
  description?: string;
}

// Message types
export interface Channel extends BaseEntity {
  course_id: string;
  name: string;
  description?: string;
  type: 'general' | 'announcement' | 'discussion';
  is_private: boolean;
}

export interface Message extends BaseEntity {
  channel_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  parent_message_id?: string;
  edited_at?: string;
  files?: FileInfo[];
}

// Attendance types
export interface AttendanceSession extends BaseEntity {
  course_id: string;
  title: string;
  session_date: string;
  method: 'qr' | 'password' | 'location';
  qr_code?: string;
  password?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AttendanceRecord extends BaseEntity {
  session_id: string;
  student_id: string;
  checked_in_at: string;
  method: string;
  is_late: boolean;
  status: 'present' | 'late' | 'absent';
}

// Quiz types
export interface Quiz extends BaseEntity {
  course_id: string;
  title: string;
  description?: string;
  time_limit?: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_answers_after: 'immediately' | 'after_close' | 'never';
  is_published: boolean;
  open_at?: string;
  close_at?: string;
}

export interface QuizQuestion extends BaseEntity {
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'code';
  points: number;
  order: number;
  options?: QuizOption[];
  correct_answer?: string;
  code_template?: string;
  test_cases?: any[];
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizAttempt extends BaseEntity {
  quiz_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
  max_score: number;
  time_spent?: number;
  is_graded: boolean;
}

// Calendar types
export interface CalendarEvent extends BaseEntity {
  course_id?: string;
  title: string;
  description?: string;
  event_type: 'class' | 'assignment' | 'quiz' | 'exam' | 'other';
  start_time: string;
  end_time: string;
  location?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
}

// Progress types
export interface Progress extends BaseEntity {
  user_id: string;
  course_id: string;
  total_points: number;
  level: number;
  experience: number;
  assignments_completed: number;
  quizzes_completed: number;
  attendance_rate: number;
  last_active_at: string;
}

export interface Achievement extends BaseEntity {
  user_id: string;
  course_id: string;
  achievement_type: string;
  title: string;
  description?: string;
  icon?: string;
  earned_at: string;
}

export interface Milestone extends BaseEntity {
  course_id: string;
  title: string;
  description?: string;
  required_points: number;
  reward_type?: string;
  reward_value?: number;
  order: number;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
}

// Loading and error states
export interface AsyncState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Centralized constants for the frontend application.
 *
 * These constants must match the backend constants to ensure
 * consistency across the entire application.
 */

// ============================================
// User & Authentication
// ============================================

export const UserRole = {
  INSTRUCTOR: 'instructor',
  ASSISTANT: 'assistant',
  STUDENT: 'student',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// ============================================
// Attendance System
// ============================================

export const AttendanceStatus = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const CheckInMethod = {
  QR_CODE: 'qr_code',
  PASSWORD: 'password',
  MANUAL: 'manual',
} as const;

export type CheckInMethodType = typeof CheckInMethod[keyof typeof CheckInMethod];

// ============================================
// Quiz & Exam System
// ============================================

export const QuizType = {
  QUIZ: 'quiz',
  MIDTERM: 'midterm',
  FINAL: 'final',
  PRACTICE: 'practice',
} as const;

export type QuizTypeType = typeof QuizType[keyof typeof QuizType];

export const QuizStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  EXPIRED: 'expired',
} as const;

export type QuizStatusType = typeof QuizStatus[keyof typeof QuizStatus];

export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
} as const;

export type QuestionTypeType = typeof QuestionType[keyof typeof QuestionType];

export const GradingStatus = {
  PENDING: 'pending',
  AUTO_GRADED: 'auto_graded',
  MANUALLY_GRADED: 'manually_graded',
} as const;

export type GradingStatusType = typeof GradingStatus[keyof typeof GradingStatus];

// ============================================
// Assignment System
// ============================================

export const AssignmentStatus = {
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late',
  RESUBMITTED: 'resubmitted',
} as const;

export type AssignmentStatusType = typeof AssignmentStatus[keyof typeof AssignmentStatus];

export const SubmissionType = {
  FILE: 'file',
  TEXT: 'text',
  URL: 'url',
  BOTH: 'both',
} as const;

export type SubmissionTypeType = typeof SubmissionType[keyof typeof SubmissionType];

// ============================================
// Progress & Gamification
// ============================================

export const AchievementType = {
  FIRST_SUBMISSION: 'first_submission',
  PERFECT_QUIZ: 'perfect_quiz',
  ATTENDANCE_STREAK: 'attendance_streak',
  EARLY_BIRD: 'early_bird',
  PARTICIPATION: 'participation',
  COMPLETION: 'completion',
  PERFECT_ATTENDANCE: 'perfect_attendance',
  TOP_PERFORMER: 'top_performer',
} as const;

export type AchievementTypeType = typeof AchievementType[keyof typeof AchievementType];

export const AchievementRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export type AchievementRarityType = typeof AchievementRarity[keyof typeof AchievementRarity];

export const ActivityType = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ASSIGNMENT_SUBMIT: 'assignment_submit',
  QUIZ_START: 'quiz_start',
  QUIZ_COMPLETE: 'quiz_complete',
  MESSAGE_POST: 'message_post',
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  ATTENDANCE_CHECKIN: 'attendance_checkin',
  COMMENT: 'comment',
  REPLY: 'reply',
} as const;

export type ActivityTypeType = typeof ActivityType[keyof typeof ActivityType];

export const MilestoneStatus = {
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type MilestoneStatusType = typeof MilestoneStatus[keyof typeof MilestoneStatus];

// ============================================
// Calendar System
// ============================================

export const EventType = {
  CLASS: 'class',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  EXAM: 'exam',
  OFFICE_HOURS: 'office_hours',
  HOLIDAY: 'holiday',
  PERSONAL: 'personal',
  CUSTOM: 'custom',
} as const;

export type EventTypeType = typeof EventType[keyof typeof EventType];

export const RSVPStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  MAYBE: 'maybe',
  TENTATIVE: 'tentative',
} as const;

export type RSVPStatusType = typeof RSVPStatus[keyof typeof RSVPStatus];

export const ReminderType = {
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in_app',
  SMS: 'sms',
} as const;

export type ReminderTypeType = typeof ReminderType[keyof typeof ReminderType];

// ============================================
// Communication System
// ============================================

export const ChannelType = {
  ANNOUNCEMENT: 'announcement',
  GENERAL: 'general',
  DISCUSSION: 'discussion',
  QA: 'qa',
  PROJECT: 'project',
  PRIVATE: 'private',
} as const;

export type ChannelTypeType = typeof ChannelType[keyof typeof ChannelType];

export const MessageType = {
  TEXT: 'text',
  FILE: 'file',
  POLL: 'poll',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
} as const;

export type MessageTypeType = typeof MessageType[keyof typeof MessageType];

export const NotificationType = {
  ASSIGNMENT_POSTED: 'assignment_posted',
  ASSIGNMENT_GRADED: 'assignment_graded',
  QUIZ_AVAILABLE: 'quiz_available',
  QUIZ_GRADED: 'quiz_graded',
  MESSAGE: 'message',
  MENTION: 'mention',
  REPLY: 'reply',
  ANNOUNCEMENT: 'announcement',
  CALENDAR_EVENT: 'calendar_event',
  DEADLINE_REMINDER: 'deadline_reminder',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const;

export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

// ============================================
// File System
// ============================================

export const FileCategory = {
  DOCUMENT: 'document',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  CODE: 'code',
  OTHER: 'other',
} as const;

export type FileCategoryType = typeof FileCategory[keyof typeof FileCategory];

export const FileAccessLevel = {
  PUBLIC: 'public',
  COURSE: 'course',
  PRIVATE: 'private',
  INSTRUCTOR_ONLY: 'instructor_only',
} as const;

export type FileAccessLevelType = typeof FileAccessLevel[keyof typeof FileAccessLevel];

// ============================================
// Course Management
// ============================================

export const CourseStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ENDED: 'ended',
} as const;

export type CourseStatusType = typeof CourseStatus[keyof typeof CourseStatus];

export const EnrollmentStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DROPPED: 'dropped',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
} as const;

export type EnrollmentStatusType = typeof EnrollmentStatus[keyof typeof EnrollmentStatus];

export const CourseMemberRole = {
  INSTRUCTOR: 'instructor',
  ASSISTANT: 'assistant',
  STUDENT: 'student',
} as const;

export type CourseMemberRoleType = typeof CourseMemberRole[keyof typeof CourseMemberRole];

// ============================================
// UI Constants
// ============================================

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderType = typeof SortOrder[keyof typeof SortOrder];

export const DateFormat = {
  ISO: 'iso',
  US: 'us',
  EU: 'eu',
  TIMESTAMP: 'timestamp',
} as const;

export type DateFormatType = typeof DateFormat[keyof typeof DateFormat];

// ============================================
// Business Logic Constants
// ============================================

// Points and XP
export const DEFAULT_LOGIN_XP: number = 10;
export const DEFAULT_ASSIGNMENT_SUBMIT_XP: number = 50;
export const DEFAULT_QUIZ_COMPLETE_XP: number = 100;
export const DEFAULT_PERFECT_SCORE_BONUS_XP: number = 50;

// Level progression
export const XP_PER_LEVEL: number = 100;
export const MAX_LEVEL: number = 100;

// Streak bonuses
export const STREAK_BONUS_DAYS: number[] = [7, 30, 60, 100];
export const STREAK_BONUS_XP: number[] = [50, 200, 500, 1000];

// File size limits (bytes)
export const MAX_FILE_SIZE_BYTES: number = 104857600; // 100MB
export const MAX_IMAGE_SIZE_BYTES: number = 10485760; // 10MB
export const MAX_VIDEO_SIZE_BYTES: number = 524288000; // 500MB

// Pagination
export const DEFAULT_PAGE_SIZE: number = 20;
export const MAX_PAGE_SIZE: number = 100;

// Time constants (milliseconds for frontend)
export const MINUTE: number = 60000;
export const HOUR: number = 3600000;
export const DAY: number = 86400000;
export const WEEK: number = 604800000;

// ============================================
// UI/UX Constants
// ============================================

// Toast notification duration (ms)
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

// Debounce delays (ms)
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  SAVE: 500,
  RESIZE: 150,
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ============================================
// Color Schemes
// ============================================

export const STATUS_COLORS: Record<AttendanceStatusType, string> = {
  [AttendanceStatus.PRESENT]: 'green',
  [AttendanceStatus.LATE]: 'yellow',
  [AttendanceStatus.ABSENT]: 'red',
};

export const QUIZ_TYPE_COLORS: Record<QuizTypeType, string> = {
  [QuizType.QUIZ]: 'blue',
  [QuizType.MIDTERM]: 'purple',
  [QuizType.FINAL]: 'red',
  [QuizType.PRACTICE]: 'green',
};

export const EVENT_TYPE_COLORS: Record<EventTypeType, string> = {
  [EventType.CLASS]: 'blue',
  [EventType.ASSIGNMENT]: 'purple',
  [EventType.QUIZ]: 'green',
  [EventType.EXAM]: 'red',
  [EventType.OFFICE_HOURS]: 'yellow',
  [EventType.HOLIDAY]: 'gray',
  [EventType.PERSONAL]: 'pink',
  [EventType.CUSTOM]: 'indigo',
};

export const RARITY_COLORS: Record<AchievementRarityType, string> = {
  [AchievementRarity.COMMON]: 'gray',
  [AchievementRarity.UNCOMMON]: 'green',
  [AchievementRarity.RARE]: 'blue',
  [AchievementRarity.EPIC]: 'purple',
  [AchievementRarity.LEGENDARY]: 'yellow',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Determine file category based on file extension
 */
export const getFileCategoryByExtension = (extension: string): FileCategoryType => {
  const ext = extension.toLowerCase().replace('.', '');

  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
  const codeTypes = ['py', 'js', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'];

  if (documentTypes.includes(ext)) return FileCategory.DOCUMENT;
  if (imageTypes.includes(ext)) return FileCategory.IMAGE;
  if (videoTypes.includes(ext)) return FileCategory.VIDEO;
  if (audioTypes.includes(ext)) return FileCategory.AUDIO;
  if (archiveTypes.includes(ext)) return FileCategory.ARCHIVE;
  if (codeTypes.includes(ext)) return FileCategory.CODE;
  return FileCategory.OTHER;
};

/**
 * Calculate user level based on XP
 */
export const calculateLevelFromXP = (xp: number): number => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return Math.min(level, MAX_LEVEL);
};

/**
 * Calculate XP required to reach next level
 */
export const calculateXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevelFromXP(currentXP);
  if (currentLevel >= MAX_LEVEL) return 0;

  const nextLevelXP = currentLevel * XP_PER_LEVEL;
  return nextLevelXP - currentXP;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Get display label for status/type constants
 */
export const getStatusLabel = (statusValue: string): string => {
  const labels: Record<string, string> = {
    // Attendance
    [AttendanceStatus.PRESENT]: '출석',
    [AttendanceStatus.LATE]: '지각',
    [AttendanceStatus.ABSENT]: '결석',

    // Quiz Status
    [QuizStatus.NOT_STARTED]: '시작 전',
    [QuizStatus.IN_PROGRESS]: '진행 중',
    [QuizStatus.SUBMITTED]: '제출 완료',
    [QuizStatus.GRADED]: '채점 완료',

    // Quiz Type
    [QuizType.QUIZ]: '퀴즈',
    [QuizType.MIDTERM]: '중간고사',
    [QuizType.FINAL]: '기말고사',
    [QuizType.PRACTICE]: '연습문제',

    // Event Type
    [EventType.CLASS]: '강의',
    [EventType.ASSIGNMENT]: '과제',
    [EventType.QUIZ]: '퀴즈',
    [EventType.EXAM]: '시험',
    [EventType.OFFICE_HOURS]: '면담',
    [EventType.HOLIDAY]: '휴일',
    [EventType.PERSONAL]: '개인',
  };

  return labels[statusValue] || statusValue;
};

export default {
  UserRole,
  AttendanceStatus,
  CheckInMethod,
  QuizType,
  QuizStatus,
  QuestionType,
  GradingStatus,
  AssignmentStatus,
  SubmissionType,
  AchievementType,
  AchievementRarity,
  ActivityType,
  MilestoneStatus,
  EventType,
  RSVPStatus,
  ReminderType,
  ChannelType,
  MessageType,
  NotificationType,
  NotificationPriority,
  FileCategory,
  FileAccessLevel,
  CourseStatus,
  EnrollmentStatus,
  CourseMemberRole,
  SortOrder,
  DateFormat,
  // Helper functions
  getFileCategoryByExtension,
  calculateLevelFromXP,
  calculateXPForNextLevel,
  formatFileSize,
  getStatusLabel,
};

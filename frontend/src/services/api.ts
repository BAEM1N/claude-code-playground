/**
 * API service for backend communication
 * Refactored to use API factory pattern for reduced code duplication
 */
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/config';
import { createAPIService } from './apiFactory';
import {
  User,
  UserProfile,
  Course,
  Channel,
  Message,
  FileItem,
  Folder,
  Notification,
  Assignment,
  AssignmentSubmission,
  Grade,
  AttendanceSession,
  AttendanceRecord,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  Progress,
  Achievement,
  Milestone,
  CalendarEvent,
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add CSRF token for state-changing requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const csrfToken = sessionStorage.getItem('csrf_token');
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Fallback to Authorization header for backward compatibility
    // (Cookie-based auth is preferred, but this maintains compatibility)
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('csrf_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // CSRF token might be invalid, try to get a new one
      console.warn('CSRF token validation failed. Please refresh the page.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getMe: (): Promise<AxiosResponse<UserProfile>> => api.get('/auth/me'),
  createProfile: (data: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> =>
    api.post('/auth/profile', data),
  updateProfile: (data: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> =>
    api.put('/auth/profile', data),
};

// Courses API - Using factory pattern
export const coursesAPI = createAPIService<Course>(api, '/courses', {
  getMyCourses: (params?: any): Promise<AxiosResponse<Course[]>> =>
    api.get('/courses', { params }),
  getMembers: (courseId: string): Promise<AxiosResponse<User[]>> =>
    api.get(`/courses/${courseId}/members`),
  addMember: (courseId: string, data: { user_id: string; role?: string }): Promise<AxiosResponse<any>> =>
    api.post(`/courses/${courseId}/members`, data),
  removeMember: (courseId: string, userId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/courses/${courseId}/members/${userId}`),
});

// Channels API - Using factory pattern
export const channelsAPI = createAPIService<Channel>(api, '/channels', {
  getChannels: (courseId: string): Promise<AxiosResponse<Channel[]>> =>
    api.get('/channels', { params: { course_id: courseId } }),
  createChannel: (courseId: string, data: Partial<Channel>): Promise<AxiosResponse<Channel>> =>
    api.post('/channels', data, { params: { course_id: courseId } }),
});

// Messages API - Using factory pattern
export const messagesAPI = createAPIService<Message>(api, '/messages', {
  getMessages: (channelId: string, params?: any): Promise<AxiosResponse<Message[]>> =>
    api.get('/messages', { params: { channel_id: channelId, ...params } }),
  createMessage: (channelId: string, data: Partial<Message>): Promise<AxiosResponse<Message>> =>
    api.post('/messages', data, { params: { channel_id: channelId } }),
  getThread: (messageId: string): Promise<AxiosResponse<Message[]>> =>
    api.get(`/messages/${messageId}/thread`),
  addReaction: (messageId: string, emoji: string): Promise<AxiosResponse<any>> =>
    api.post(`/messages/${messageId}/reactions`, null, { params: { emoji } }),
  removeReaction: (messageId: string, emoji: string): Promise<AxiosResponse<void>> =>
    api.delete(`/messages/${messageId}/reactions/${emoji}`),
});

// Files API
export const filesAPI = {
  getFiles: (courseId: string, params?: any): Promise<AxiosResponse<FileItem[]>> =>
    api.get('/files', { params: { course_id: courseId, ...params } }),
  getFile: (fileId: string): Promise<AxiosResponse<FileItem>> =>
    api.get(`/files/${fileId}`),
  uploadFile: (courseId: string, file: File, folderId?: string): Promise<AxiosResponse<FileItem>> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/files', formData, {
      params: { course_id: courseId, folder_id: folderId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadFile: (fileId: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  getPreviewUrl: (fileId: string): Promise<AxiosResponse<{ url: string }>> =>
    api.get(`/files/${fileId}/preview`),
  deleteFile: (fileId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/files/${fileId}`),
  getVersions: (fileId: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/files/${fileId}/versions`),
  addTag: (fileId: string, tag: string): Promise<AxiosResponse<any>> =>
    api.post(`/files/${fileId}/tags`, null, { params: { tag } }),
  getFolders: (courseId: string): Promise<AxiosResponse<Folder[]>> =>
    api.get('/files/folders', { params: { course_id: courseId } }),
  createFolder: (courseId: string, data: Partial<Folder>): Promise<AxiosResponse<Folder>> =>
    api.post('/files/folders', data, { params: { course_id: courseId } }),
};

// Notifications API - Using factory pattern
export const notificationsAPI = createAPIService<Notification>(api, '/notifications', {
  getNotifications: (params?: any): Promise<AxiosResponse<Notification[]>> =>
    api.get('/notifications', { params }),
  getUnreadCount: (): Promise<AxiosResponse<{ count: number }>> =>
    api.get('/notifications/unread-count'),
  markAsRead: (notificationId: string): Promise<AxiosResponse<void>> =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (): Promise<AxiosResponse<void>> =>
    api.put('/notifications/read-all'),
});

// Assignments API
export const assignmentsAPI = {
  // Assignment management
  getAssignments: (courseId: string, params?: any): Promise<AxiosResponse<Assignment[]>> =>
    api.get('/assignments', { params: { course_id: courseId, ...params } }),
  getAssignment: (assignmentId: string): Promise<AxiosResponse<Assignment>> =>
    api.get(`/assignments/${assignmentId}`),
  createAssignment: (courseId: string, data: Partial<Assignment>): Promise<AxiosResponse<Assignment>> =>
    api.post('/assignments', data, { params: { course_id: courseId } }),
  updateAssignment: (assignmentId: string, data: Partial<Assignment>): Promise<AxiosResponse<Assignment>> =>
    api.put(`/assignments/${assignmentId}`, data),
  deleteAssignment: (assignmentId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/assignments/${assignmentId}`),
  getAssignmentStats: (assignmentId: string): Promise<AxiosResponse<any>> =>
    api.get(`/assignments/${assignmentId}/stats`),

  // Submissions
  submitAssignment: (assignmentId: string, data: Partial<AssignmentSubmission>): Promise<AxiosResponse<AssignmentSubmission>> =>
    api.post(`/assignments/${assignmentId}/submissions`, data),
  getSubmissions: (assignmentId: string): Promise<AxiosResponse<AssignmentSubmission[]>> =>
    api.get(`/assignments/${assignmentId}/submissions`),
  getMySubmission: (assignmentId: string): Promise<AxiosResponse<AssignmentSubmission>> =>
    api.get(`/assignments/${assignmentId}/my-submission`),

  // Grading
  gradeSubmission: (submissionId: string, data: Partial<Grade>): Promise<AxiosResponse<Grade>> =>
    api.post(`/assignments/submissions/${submissionId}/grade`, data),
  updateGrade: (submissionId: string, data: Partial<Grade>): Promise<AxiosResponse<Grade>> =>
    api.put(`/assignments/submissions/${submissionId}/grade`, data),
  getGrade: (submissionId: string): Promise<AxiosResponse<Grade>> =>
    api.get(`/assignments/submissions/${submissionId}/grade`),

  // File attachments
  getAssignmentFiles: (assignmentId: string): Promise<AxiosResponse<FileItem[]>> =>
    api.get(`/assignments/${assignmentId}/files`),
  attachFileToAssignment: (assignmentId: string, file: File, fileType: string): Promise<AxiosResponse<FileItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assignments/${assignmentId}/files`, formData, {
      params: { file_type: fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSubmissionFiles: (submissionId: string): Promise<AxiosResponse<FileItem[]>> =>
    api.get(`/assignments/submissions/${submissionId}/files`),
  attachFileToSubmission: (submissionId: string, file: File): Promise<AxiosResponse<FileItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assignments/submissions/${submissionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Attendance API - Using factory pattern
export const attendanceAPI = createAPIService<AttendanceSession>(api, '/attendance/sessions', {
  getSessions: (courseId: string, params?: any): Promise<AxiosResponse<AttendanceSession[]>> =>
    api.get('/attendance/sessions', { params: { course_id: courseId, ...params } }),

  // Student check-in
  checkIn: (data: { session_id: string; code?: string }): Promise<AxiosResponse<AttendanceRecord>> =>
    api.post('/attendance/checkin', data),

  // Records
  getRecords: (sessionId: string): Promise<AxiosResponse<AttendanceRecord[]>> =>
    api.get('/attendance/records', { params: { session_id: sessionId } }),
  getMyRecords: (courseId: string): Promise<AxiosResponse<AttendanceRecord[]>> =>
    api.get('/attendance/my-records', { params: { course_id: courseId } }),
  getSessionQRCode: (sessionId: string): Promise<AxiosResponse<{ qr_code: string }>> =>
    api.get(`/attendance/sessions/${sessionId}/qr`),
});

// Quiz API - Using factory pattern
export const quizAPI = createAPIService<Quiz>(api, '/quiz/quizzes', {
  getQuizzes: (courseId: string, params?: any): Promise<AxiosResponse<Quiz[]>> =>
    api.get('/quiz/quizzes', { params: { course_id: courseId, ...params } }),

  // Question management
  getQuestions: (quizId: string): Promise<AxiosResponse<QuizQuestion[]>> =>
    api.get(`/quiz/quizzes/${quizId}/questions`),
  createQuestion: (quizId: string, data: Partial<QuizQuestion>): Promise<AxiosResponse<QuizQuestion>> =>
    api.post(`/quiz/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId: string, data: Partial<QuizQuestion>): Promise<AxiosResponse<QuizQuestion>> =>
    api.put(`/quiz/questions/${questionId}`, data),
  deleteQuestion: (questionId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/quiz/questions/${questionId}`),

  // Quiz taking
  startQuiz: (quizId: string): Promise<AxiosResponse<QuizAttempt>> =>
    api.post(`/quiz/quizzes/${quizId}/start`),
  submitQuiz: (attemptId: string, data: { answers: any[] }): Promise<AxiosResponse<QuizAttempt>> =>
    api.post(`/quiz/attempts/${attemptId}/submit`, data),
  trackBehavior: (attemptId: string, data: any): Promise<AxiosResponse<void>> =>
    api.patch(`/quiz/attempts/${attemptId}/track`, data),
  getAttempt: (attemptId: string): Promise<AxiosResponse<QuizAttempt>> =>
    api.get(`/quiz/attempts/${attemptId}`),
  getAttemptAnswers: (attemptId: string): Promise<AxiosResponse<QuizAnswer[]>> =>
    api.get(`/quiz/attempts/${attemptId}/answers`),
  getAttempts: (quizId: string): Promise<AxiosResponse<QuizAttempt[]>> =>
    api.get(`/quiz/quizzes/${quizId}/attempts`),

  // Grading
  gradeAnswer: (answerId: string, data: { score: number; feedback?: string }): Promise<AxiosResponse<QuizAnswer>> =>
    api.post(`/quiz/answers/${answerId}/grade`, data),
  getStatistics: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/quiz/quizzes/${quizId}/statistics`),
});

// Progress API - Using factory pattern
export const progressAPI = createAPIService<Milestone>(api, '/progress/milestones', {
  // Progress tracking
  getMyProgress: (courseId: string): Promise<AxiosResponse<Progress>> =>
    api.get('/progress/progress', { params: { course_id: courseId } }),
  getProgressSummary: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/progress/progress/${courseId}/summary`),
  getProgressComparison: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/progress/progress/${courseId}/comparison`),

  // Activity logging
  logActivity: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/progress/activities', data),

  // Achievements
  getAchievements: (courseId: string): Promise<AxiosResponse<Achievement[]>> =>
    api.get('/progress/achievements', { params: { course_id: courseId } }),

  // Milestones
  getMilestones: (courseId: string): Promise<AxiosResponse<Milestone[]>> =>
    api.get('/progress/milestones', { params: { course_id: courseId } }),

  // Leaderboard
  getLeaderboard: (courseId: string, limit: number = 10): Promise<AxiosResponse<any[]>> =>
    api.get(`/progress/leaderboard/${courseId}`, { params: { limit } }),

  // Statistics
  getStatistics: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/progress/statistics/${courseId}`),
});

// Calendar API - Using factory pattern
export const calendarAPI = createAPIService<CalendarEvent>(api, '/calendar/events', {
  // Personal events
  getPersonalEvents: (params?: any): Promise<AxiosResponse<CalendarEvent[]>> =>
    api.get('/calendar/personal-events', { params }),
  createPersonalEvent: (data: Partial<CalendarEvent>): Promise<AxiosResponse<CalendarEvent>> =>
    api.post('/calendar/personal-events', data),
  updatePersonalEvent: (eventId: string, data: Partial<CalendarEvent>): Promise<AxiosResponse<CalendarEvent>> =>
    api.put(`/calendar/personal-events/${eventId}`, data),
  deletePersonalEvent: (eventId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/calendar/personal-events/${eventId}`),

  // Calendar view
  getCalendarView: (params?: any): Promise<AxiosResponse<CalendarEvent[]>> =>
    api.get('/calendar/view', { params }),

  // RSVP
  rsvp: (eventId: string, data: { status: 'yes' | 'no' | 'maybe' }): Promise<AxiosResponse<any>> =>
    api.post(`/calendar/events/${eventId}/rsvp`, data),
  getAttendees: (eventId: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/calendar/events/${eventId}/attendees`),

  // Export
  exportToICal: (params?: any): Promise<AxiosResponse<Blob>> =>
    api.get('/calendar/export/ical', { params, responseType: 'blob' }),
});

// AI Assistant API
export const aiAPI = {
  // Get available providers
  getProviders: (): Promise<AxiosResponse<any>> =>
    api.get('/ai/providers'),

  // Chat
  chat: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/ai/chat', data),

  // Code review
  reviewCode: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/ai/code-review', data),
  submitCodeReviewFeedback: (data: { review_id: number; was_helpful: boolean }): Promise<AxiosResponse<any>> =>
    api.post('/ai/code-review/feedback', data),

  // Concept explanation
  explainConcept: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/ai/explain', data),

  // Quiz generation
  generateQuiz: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/ai/generate-quiz', data),

  // Summarization
  summarize: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/ai/summarize', data),

  // Conversations
  getConversations: (params?: any): Promise<AxiosResponse<any[]>> =>
    api.get('/ai/conversations', { params }),
  getConversation: (conversationId: number): Promise<AxiosResponse<any>> =>
    api.get(`/ai/conversations/${conversationId}`),
  deleteConversation: (conversationId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/ai/conversations/${conversationId}`),

  // Usage statistics
  getMyUsageStats: (days: number = 30): Promise<AxiosResponse<any>> =>
    api.get('/ai/usage/my-stats', { params: { days } }),
  getCourseUsageStats: (courseId: number, days: number = 30): Promise<AxiosResponse<any>> =>
    api.get(`/ai/usage/course/${courseId}`, { params: { days } }),
};

// Learning Paths API
export const learningPathsAPI = {
  // Get all learning paths
  getLearningPaths: (params?: { difficulty?: string; tag?: string; skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/learning-paths/', { params }),

  // Get single learning path with progress
  getLearningPath: (pathId: number): Promise<AxiosResponse<any>> =>
    api.get(`/learning-paths/${pathId}`),

  // Create learning path (instructor only)
  createLearningPath: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/learning-paths/', data),

  // Enroll in learning path
  enrollInPath: (pathId: number): Promise<AxiosResponse<any>> =>
    api.post(`/learning-paths/${pathId}/enroll`),

  // Update item progress
  updateItemProgress: (itemId: number, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/learning-paths/items/${itemId}/progress`, data),

  // Get recommendations
  getRecommendations: (limit?: number): Promise<AxiosResponse<any>> =>
    api.get('/learning-paths/recommendations/for-me', { params: { limit } }),

  // Get user stats
  getMyStats: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-paths/stats/my-stats'),
};

// Coding Environment API
export const codingAPI = {
  // Execute code (playground)
  executeCode: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/coding/execute', data),

  // Problems
  getProblems: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/coding/problems', { params }),
  getProblem: (problemId: number): Promise<AxiosResponse<any>> =>
    api.get(`/coding/problems/${problemId}`),
  createProblem: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/coding/problems', data),

  // Submissions
  submitCode: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/coding/submit', data),
  getMySubmissions: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/coding/submissions/my', { params }),

  // Saved code
  getSavedCodes: (): Promise<AxiosResponse<any>> =>
    api.get('/coding/saved'),
  saveCode: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/coding/saved', data),
  deleteSavedCode: (codeId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/coding/saved/${codeId}`),

  // Statistics
  getMyStats: (): Promise<AxiosResponse<any>> =>
    api.get('/coding/stats/my'),

  // Collaborative sessions
  createSession: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/coding/sessions', null, { params: data }),
  getSessions: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/coding/sessions', { params }),
  getSession: (sessionId: number): Promise<AxiosResponse<any>> =>
    api.get(`/coding/sessions/${sessionId}`),
  joinSession: (sessionId: number): Promise<AxiosResponse<any>> =>
    api.post(`/coding/sessions/${sessionId}/join`),
  endSession: (sessionId: number): Promise<AxiosResponse<any>> =>
    api.post(`/coding/sessions/${sessionId}/end`),
};

export default api;

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

// Virtual Classroom API
export const virtualClassroomAPI = {
  // Classroom management
  createClassroom: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/virtual-classroom/classrooms', data),
  getClassrooms: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/virtual-classroom/classrooms', { params }),
  getClassroom: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.get(`/virtual-classroom/classrooms/${classroomId}`),
  updateClassroom: (classroomId: number, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/virtual-classroom/classrooms/${classroomId}`, data),
  deleteClassroom: (classroomId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/virtual-classroom/classrooms/${classroomId}`),

  // Classroom control
  startClassroom: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.post(`/virtual-classroom/classrooms/${classroomId}/start`),
  endClassroom: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.post(`/virtual-classroom/classrooms/${classroomId}/end`),

  // Whiteboard
  getWhiteboardStrokes: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.get(`/virtual-classroom/classrooms/${classroomId}/whiteboard`),

  // Files
  uploadFile: (classroomId: number, file: File, description?: string): Promise<AxiosResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return api.post(`/virtual-classroom/classrooms/${classroomId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.get(`/virtual-classroom/classrooms/${classroomId}/files`),

  // Recordings
  getRecordings: (classroomId: number): Promise<AxiosResponse<any>> =>
    api.get(`/virtual-classroom/classrooms/${classroomId}/recordings`),

  // Statistics
  getStatistics: (): Promise<AxiosResponse<any>> =>
    api.get('/virtual-classroom/classrooms/stats/overview'),
  getMyStats: (): Promise<AxiosResponse<any>> =>
    api.get('/virtual-classroom/classrooms/stats/my-stats'),
};

// Forum API
export const forumAPI = {
  // Forums
  getForums: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/forum/forums', { params }),
  createForum: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/forum/forums', data),

  // Posts
  getPosts: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/forum/posts', { params }),
  getPost: (postId: number): Promise<AxiosResponse<any>> =>
    api.get(`/forum/posts/${postId}`),
  createPost: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/forum/posts', data),
  updatePost: (postId: number, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/forum/posts/${postId}`, data),
  deletePost: (postId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/forum/posts/${postId}`),

  // Replies
  getReplies: (postId: number): Promise<AxiosResponse<any>> =>
    api.get(`/forum/posts/${postId}/replies`),
  createReply: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/forum/replies', data),
  markBestAnswer: (replyId: number): Promise<AxiosResponse<any>> =>
    api.put(`/forum/replies/${replyId}/best-answer`),

  // Voting
  votePost: (postId: number, voteType: string): Promise<AxiosResponse<any>> =>
    api.post(`/forum/posts/${postId}/vote`, { vote_type: voteType }),
  voteReply: (replyId: number, voteType: string): Promise<AxiosResponse<any>> =>
    api.post(`/forum/replies/${replyId}/vote`, { vote_type: voteType }),

  // Bookmarks
  createBookmark: (postId: number): Promise<AxiosResponse<any>> =>
    api.post('/forum/bookmarks', { post_id: postId }),
  deleteBookmark: (postId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/forum/bookmarks/${postId}`),

  // Statistics
  getStatistics: (): Promise<AxiosResponse<any>> =>
    api.get('/forum/stats/overview'),
  getMyStats: (): Promise<AxiosResponse<any>> =>
    api.get('/forum/stats/my-stats'),
};

// Competition API
export const competitionAPI = {
  // Competition management
  getCompetitions: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/competition/competitions', { params }),
  getCompetition: (competitionId: number): Promise<AxiosResponse<any>> =>
    api.get(`/competition/competitions/${competitionId}`),
  createCompetition: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/competition/competitions', data),
  updateCompetition: (competitionId: number, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/competition/competitions/${competitionId}`, data),
  deleteCompetition: (competitionId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/competition/competitions/${competitionId}`),

  // Participation
  joinCompetition: (competitionId: number, teamId?: number): Promise<AxiosResponse<any>> =>
    api.post(`/competition/competitions/${competitionId}/join`, teamId ? { team_id: teamId } : {}),
  leaveCompetition: (competitionId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/competition/competitions/${competitionId}/leave`),

  // Team management
  createTeam: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/competition/teams', data),
  getTeam: (teamId: number): Promise<AxiosResponse<any>> =>
    api.get(`/competition/teams/${teamId}`),
  updateTeam: (teamId: number, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/competition/teams/${teamId}`, data),
  deleteTeam: (teamId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/competition/teams/${teamId}`),
  getTeamMembers: (teamId: number): Promise<AxiosResponse<any>> =>
    api.get(`/competition/teams/${teamId}/members`),
  inviteMember: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/competition/teams/invite', data),
  respondToInvite: (inviteId: number, accept: boolean): Promise<AxiosResponse<any>> =>
    api.post(`/competition/teams/invites/${inviteId}/respond`, { accept }),

  // Submissions
  submitSolution: (competitionId: number, file: File): Promise<AxiosResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/competition/competitions/${competitionId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMySubmissions: (competitionId: number, params?: any): Promise<AxiosResponse<any>> =>
    api.get(`/competition/competitions/${competitionId}/my-submissions`, { params }),
  getSubmission: (submissionId: number): Promise<AxiosResponse<any>> =>
    api.get(`/competition/submissions/${submissionId}`),

  // Leaderboard
  getLeaderboard: (competitionId: number, leaderboardType: 'public' | 'private' = 'public'): Promise<AxiosResponse<any>> =>
    api.get(`/competition/competitions/${competitionId}/leaderboard`, { params: { leaderboard_type: leaderboardType } }),

  // Data files
  downloadTrainData: (competitionId: number): Promise<AxiosResponse<Blob>> =>
    api.get(`/competition/competitions/${competitionId}/data/train`, { responseType: 'blob' }),
  downloadTestData: (competitionId: number): Promise<AxiosResponse<Blob>> =>
    api.get(`/competition/competitions/${competitionId}/data/test`, { responseType: 'blob' }),
  downloadSampleSubmission: (competitionId: number): Promise<AxiosResponse<Blob>> =>
    api.get(`/competition/competitions/${competitionId}/data/sample-submission`, { responseType: 'blob' }),

  // Statistics
  getStatistics: (): Promise<AxiosResponse<any>> =>
    api.get('/competition/stats/overview'),
  getCompetitionStats: (competitionId: number): Promise<AxiosResponse<any>> =>
    api.get(`/competition/competitions/${competitionId}/stats`),
};

// Dashboard API
export const dashboardAPI = {
  // Overview statistics
  getOverviewStats: (): Promise<AxiosResponse<any>> =>
    api.get('/dashboard/stats/overview'),

  // Assignment statistics
  getAssignmentStats: (): Promise<AxiosResponse<any>> =>
    api.get('/dashboard/stats/assignments'),

  // Quiz statistics
  getQuizStats: (): Promise<AxiosResponse<any>> =>
    api.get('/dashboard/stats/quizzes'),
};

// Team Projects API
export const teamProjectsAPI = {
  // Projects
  getProjects: (params?: { course_id?: string; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/team-projects/projects', { params }),
  getProject: (projectId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/projects/${projectId}`),
  createProject: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/team-projects/projects', data),
  updateProject: (projectId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/team-projects/projects/${projectId}`, data),
  deleteProject: (projectId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/team-projects/projects/${projectId}`),

  // Team Members
  getProjectMembers: (projectId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/projects/${projectId}/members`),
  addProjectMember: (projectId: string, data: { user_id: string; role?: string }): Promise<AxiosResponse<any>> =>
    api.post(`/team-projects/projects/${projectId}/members`, data),
  removeProjectMember: (projectId: string, userId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/team-projects/projects/${projectId}/members/${userId}`),
  updateMemberRole: (projectId: string, userId: string, role: string): Promise<AxiosResponse<any>> =>
    api.patch(`/team-projects/projects/${projectId}/members/${userId}`, { role }),

  // Tasks
  getTasks: (projectId: string, params?: any): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/projects/${projectId}/tasks`, { params }),
  getTask: (taskId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/tasks/${taskId}`),
  createTask: (projectId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/team-projects/projects/${projectId}/tasks`, data),
  updateTask: (taskId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/team-projects/tasks/${taskId}`, data),
  deleteTask: (taskId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/team-projects/tasks/${taskId}`),
  assignTask: (taskId: string, userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/team-projects/tasks/${taskId}/assign`, { user_id: userId }),

  // Milestones
  getMilestones: (projectId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/projects/${projectId}/milestones`),
  createMilestone: (projectId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/team-projects/projects/${projectId}/milestones`, data),
  updateMilestone: (milestoneId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/team-projects/milestones/${milestoneId}`, data),
  deleteMilestone: (milestoneId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/team-projects/milestones/${milestoneId}`),

  // Comments
  getTaskComments: (taskId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/tasks/${taskId}/comments`),
  addTaskComment: (taskId: string, content: string): Promise<AxiosResponse<any>> =>
    api.post(`/team-projects/tasks/${taskId}/comments`, { content }),

  // Statistics
  getProjectStats: (projectId: string): Promise<AxiosResponse<any>> =>
    api.get(`/team-projects/projects/${projectId}/stats`),
};

// Learning Notes API
export const learningNotesAPI = {
  // Notes CRUD
  getNotes: (params?: { course_id?: string; tag?: string; search?: string }): Promise<AxiosResponse<any>> =>
    api.get('/learning-notes/notes', { params }),
  getNote: (noteId: string): Promise<AxiosResponse<any>> =>
    api.get(`/learning-notes/notes/${noteId}`),
  createNote: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/learning-notes/notes', data),
  updateNote: (noteId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/learning-notes/notes/${noteId}`, data),
  deleteNote: (noteId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/learning-notes/notes/${noteId}`),

  // Tags
  getTags: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-notes/tags'),
  addTag: (noteId: string, tag: string): Promise<AxiosResponse<any>> =>
    api.post(`/learning-notes/notes/${noteId}/tags`, { tag }),
  removeTag: (noteId: string, tag: string): Promise<AxiosResponse<void>> =>
    api.delete(`/learning-notes/notes/${noteId}/tags/${tag}`),

  // Code Snippets
  getSnippets: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/learning-notes/snippets', { params }),
  createSnippet: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/learning-notes/snippets', data),
  updateSnippet: (snippetId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/learning-notes/snippets/${snippetId}`, data),
  deleteSnippet: (snippetId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/learning-notes/snippets/${snippetId}`),

  // Sharing
  shareNote: (noteId: string, userIds: string[]): Promise<AxiosResponse<any>> =>
    api.post(`/learning-notes/notes/${noteId}/share`, { user_ids: userIds }),
  getSharedNotes: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-notes/shared'),

  // Favorites
  toggleFavorite: (noteId: string): Promise<AxiosResponse<any>> =>
    api.post(`/learning-notes/notes/${noteId}/favorite`),
  getFavorites: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-notes/favorites'),
};

// Learning Analytics API
export const learningAnalyticsAPI = {
  // Overview stats
  getOverview: (params?: { days?: number }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/overview', { params }),

  // Activity data
  getActivityHeatmap: (params?: { year?: number }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/activity-heatmap', { params }),
  getDailyActivity: (params?: { start_date?: string; end_date?: string }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/daily-activity', { params }),

  // Time analysis
  getStudyTimeByHour: (params?: { days?: number }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/study-time-by-hour', { params }),
  getStudyTimeByDay: (params?: { weeks?: number }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/study-time-by-day', { params }),

  // Performance analysis
  getStrengthsWeaknesses: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/strengths-weaknesses'),
  getTopicProgress: (params?: { course_id?: string }): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/topic-progress', { params }),

  // Goals
  getGoals: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/goals'),
  createGoal: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/learning-analytics/goals', data),
  updateGoal: (goalId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/learning-analytics/goals/${goalId}`, data),
  deleteGoal: (goalId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/learning-analytics/goals/${goalId}`),

  // Insights
  getInsights: (): Promise<AxiosResponse<any>> =>
    api.get('/learning-analytics/insights'),
};

// Gamification API
export const gamificationAPI = {
  // Profile
  getProfile: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/profile'),
  updateProfile: (data: any): Promise<AxiosResponse<any>> =>
    api.patch('/gamification/profile', data),

  // Stats
  getStats: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/stats'),

  // XP
  awardXP: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/gamification/award-xp', data),

  // Badges
  getAllBadges: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/gamification/badges', { params }),
  getMyBadges: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/my-badges'),
  updateBadge: (badgeId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/gamification/badges/${badgeId}`, data),
  equipBadge: (badgeId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/badges/${badgeId}/equip`),
  unequipBadge: (badgeId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/badges/${badgeId}/unequip`),
  getEquippedBadges: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/equipped-badges'),

  // Leaderboard
  getLeaderboard: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/gamification/leaderboard', { params }),

  // Daily Quests
  getDailyQuests: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/daily-quests'),

  // Challenges
  getChallenges: (params?: { type?: 'weekly' | 'monthly'; status?: 'active' | 'completed' | 'expired' }): Promise<AxiosResponse<any>> =>
    api.get('/gamification/challenges', { params }),
  getChallenge: (challengeId: string): Promise<AxiosResponse<any>> =>
    api.get(`/gamification/challenges/${challengeId}`),
  joinChallenge: (challengeId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/challenges/${challengeId}/join`),
  getMyChallengeProgress: (challengeId: string): Promise<AxiosResponse<any>> =>
    api.get(`/gamification/challenges/${challengeId}/progress`),
  claimChallengeReward: (challengeId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/challenges/${challengeId}/claim-reward`),

  // Friends
  getFriends: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/friends'),
  sendFriendRequest: (userId: string): Promise<AxiosResponse<any>> =>
    api.post('/gamification/friends/request', { user_id: userId }),
  acceptFriendRequest: (requestId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/friends/requests/${requestId}/accept`),
  rejectFriendRequest: (requestId: string): Promise<AxiosResponse<any>> =>
    api.post(`/gamification/friends/requests/${requestId}/reject`),
  removeFriend: (friendId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/gamification/friends/${friendId}`),
  getFriendRequests: (): Promise<AxiosResponse<any>> =>
    api.get('/gamification/friends/requests'),
  getFriendLeaderboard: (params?: { period?: 'weekly' | 'monthly' | 'all_time' }): Promise<AxiosResponse<any>> =>
    api.get('/gamification/friends/leaderboard', { params }),
  searchUsers: (query: string): Promise<AxiosResponse<any>> =>
    api.get('/gamification/users/search', { params: { q: query } }),

  // Admin - Badge definitions
  createBadge: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/gamification/admin/badges', data),
  getBadgeDefinition: (badgeId: string): Promise<AxiosResponse<any>> =>
    api.get(`/gamification/admin/badges/${badgeId}`),
  updateBadgeDefinition: (badgeId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/gamification/admin/badges/${badgeId}`, data),
};

// Peer Review API
export const peerReviewAPI = {
  // Get assignments available for peer review
  getReviewableAssignments: (params?: { course_id?: string; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/peer-review/assignments', { params }),

  // Get submissions to review
  getSubmissionsToReview: (assignmentId: string, params?: { limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/peer-review/assignments/${assignmentId}/submissions`, { params }),

  // Submit a peer review
  submitReview: (submissionId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/peer-review/submissions/${submissionId}/reviews`, data),

  // Get reviews for a submission
  getReviewsForSubmission: (submissionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/peer-review/submissions/${submissionId}/reviews`),

  // Get reviews I've written
  getMyReviews: (params?: { assignment_id?: string; skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/peer-review/my-reviews', { params }),

  // Get reviews I've received
  getReceivedReviews: (params?: { assignment_id?: string; skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/peer-review/received-reviews', { params }),

  // Update a review
  updateReview: (reviewId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/peer-review/reviews/${reviewId}`, data),

  // Rate a review (helpful/not helpful)
  rateReview: (reviewId: string, rating: 'helpful' | 'not_helpful'): Promise<AxiosResponse<any>> =>
    api.post(`/peer-review/reviews/${reviewId}/rate`, { rating }),

  // Get review statistics
  getReviewStats: (userId?: string): Promise<AxiosResponse<any>> =>
    api.get('/peer-review/stats', { params: { user_id: userId } }),
};

// Study Groups API
export const studyGroupsAPI = {
  // Get all study groups
  getStudyGroups: (params?: { course_id?: string; search?: string; is_public?: boolean; skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/study-groups/', { params }),

  // Get my study groups
  getMyGroups: (): Promise<AxiosResponse<any>> =>
    api.get('/study-groups/my-groups'),

  // Get single study group
  getStudyGroup: (groupId: string): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${groupId}`),

  // Create study group
  createStudyGroup: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/study-groups/', data),

  // Update study group
  updateStudyGroup: (groupId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/study-groups/${groupId}`, data),

  // Delete study group
  deleteStudyGroup: (groupId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/study-groups/${groupId}`),

  // Join group
  joinGroup: (groupId: string): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/join`),

  // Leave group
  leaveGroup: (groupId: string): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/leave`),

  // Get group members
  getGroupMembers: (groupId: string): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${groupId}/members`),

  // Update member role
  updateMemberRole: (groupId: string, userId: string, role: string): Promise<AxiosResponse<any>> =>
    api.patch(`/study-groups/${groupId}/members/${userId}`, { role }),

  // Remove member
  removeMember: (groupId: string, userId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/study-groups/${groupId}/members/${userId}`),

  // Get group discussions
  getDiscussions: (groupId: string, params?: { skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${groupId}/discussions`, { params }),

  // Create discussion post
  createPost: (groupId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/discussions`, data),

  // Update post
  updatePost: (groupId: string, postId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/study-groups/${groupId}/discussions/${postId}`, data),

  // Delete post
  deletePost: (groupId: string, postId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/study-groups/${groupId}/discussions/${postId}`),

  // Add comment to post
  addComment: (groupId: string, postId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/discussions/${postId}/comments`, data),

  // Get study sessions
  getSessions: (groupId: string, params?: { upcoming?: boolean }): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${groupId}/sessions`, { params }),

  // Create study session
  createSession: (groupId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/sessions`, data),

  // Update session
  updateSession: (groupId: string, sessionId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/study-groups/${groupId}/sessions/${sessionId}`, data),

  // RSVP to session
  rsvpSession: (groupId: string, sessionId: string, status: 'attending' | 'not_attending' | 'maybe'): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${groupId}/sessions/${sessionId}/rsvp`, { status }),

  // Get group resources
  getResources: (groupId: string): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${groupId}/resources`),

  // Upload resource
  uploadResource: (groupId: string, file: File, data: any): Promise<AxiosResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    return api.post(`/study-groups/${groupId}/resources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Live Quiz/Poll API
export const liveQuizAPI = {
  // Get active quizzes/polls
  getActiveQuizzes: (params?: { course_id?: string; type?: 'quiz' | 'poll' }): Promise<AxiosResponse<any>> =>
    api.get('/live-quiz/active', { params }),

  // Get my created quizzes
  getMyQuizzes: (params?: { status?: string; skip?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/live-quiz/my-quizzes', { params }),

  // Get quiz details
  getQuiz: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/live-quiz/${quizId}`),

  // Create quiz/poll
  createQuiz: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/live-quiz/', data),

  // Update quiz
  updateQuiz: (quizId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/live-quiz/${quizId}`, data),

  // Delete quiz
  deleteQuiz: (quizId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/live-quiz/${quizId}`),

  // Start quiz session
  startQuiz: (quizId: string): Promise<AxiosResponse<any>> =>
    api.post(`/live-quiz/${quizId}/start`),

  // End quiz session
  endQuiz: (quizId: string): Promise<AxiosResponse<any>> =>
    api.post(`/live-quiz/${quizId}/end`),

  // Join quiz session
  joinQuiz: (quizId: string): Promise<AxiosResponse<any>> =>
    api.post(`/live-quiz/${quizId}/join`),

  // Submit answer
  submitAnswer: (quizId: string, questionId: string, answer: any): Promise<AxiosResponse<any>> =>
    api.post(`/live-quiz/${quizId}/questions/${questionId}/answer`, { answer }),

  // Get current question
  getCurrentQuestion: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/live-quiz/${quizId}/current-question`),

  // Move to next question (host only)
  nextQuestion: (quizId: string): Promise<AxiosResponse<any>> =>
    api.post(`/live-quiz/${quizId}/next-question`),

  // Get live results
  getLiveResults: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/live-quiz/${quizId}/results`),

  // Get participants
  getParticipants: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/live-quiz/${quizId}/participants`),

  // Get leaderboard
  getLeaderboard: (quizId: string): Promise<AxiosResponse<any>> =>
    api.get(`/live-quiz/${quizId}/leaderboard`),
};

// Collaborative Code Editor API
export const collaborativeEditorAPI = {
  // Get active sessions
  getActiveSessions: (params?: { language?: string; is_public?: boolean }): Promise<AxiosResponse<any>> =>
    api.get('/collab-editor/sessions', { params }),

  // Get my sessions
  getMySessions: (): Promise<AxiosResponse<any>> =>
    api.get('/collab-editor/my-sessions'),

  // Get session details
  getSession: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/collab-editor/sessions/${sessionId}`),

  // Create session
  createSession: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/collab-editor/sessions', data),

  // Update session
  updateSession: (sessionId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/collab-editor/sessions/${sessionId}`, data),

  // Delete session
  deleteSession: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/collab-editor/sessions/${sessionId}`),

  // Join session
  joinSession: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/join`),

  // Leave session
  leaveSession: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/leave`),

  // Get session code
  getCode: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/collab-editor/sessions/${sessionId}/code`),

  // Update code
  updateCode: (sessionId: string, code: string, version: number): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/code`, { code, version }),

  // Get participants
  getParticipants: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/collab-editor/sessions/${sessionId}/participants`),

  // Update cursor position
  updateCursor: (sessionId: string, position: { line: number; column: number }): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/cursor`, position),

  // Run code
  runCode: (sessionId: string, input?: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/run`, { input }),

  // Get chat messages
  getMessages: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/collab-editor/sessions/${sessionId}/messages`),

  // Send chat message
  sendMessage: (sessionId: string, message: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/messages`, { message }),

  // Save snapshot
  saveSnapshot: (sessionId: string, name: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/snapshots`, { name }),

  // Get snapshots
  getSnapshots: (sessionId: string): Promise<AxiosResponse<any>> =>
    api.get(`/collab-editor/sessions/${sessionId}/snapshots`),

  // Restore snapshot
  restoreSnapshot: (sessionId: string, snapshotId: string): Promise<AxiosResponse<any>> =>
    api.post(`/collab-editor/sessions/${sessionId}/snapshots/${snapshotId}/restore`),
};

export default api;

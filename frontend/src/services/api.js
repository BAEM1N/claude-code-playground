/**
 * API service for backend communication
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
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
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  createProfile: (data) => api.post('/auth/profile', data),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Courses API
export const coursesAPI = {
  getMyCourses: (params) => api.get('/courses', { params }),
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (courseId, data) => api.put(`/courses/${courseId}`, data),
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`),
  getMembers: (courseId) => api.get(`/courses/${courseId}/members`),
  addMember: (courseId, data) => api.post(`/courses/${courseId}/members`, data),
  removeMember: (courseId, userId) => api.delete(`/courses/${courseId}/members/${userId}`),
};

// Channels API
export const channelsAPI = {
  getChannels: (courseId) => api.get('/channels', { params: { course_id: courseId } }),
  getChannel: (channelId) => api.get(`/channels/${channelId}`),
  createChannel: (courseId, data) => api.post('/channels', data, { params: { course_id: courseId } }),
  updateChannel: (channelId, data) => api.put(`/channels/${channelId}`, data),
};

// Messages API
export const messagesAPI = {
  getMessages: (channelId, params) => api.get('/messages', { params: { channel_id: channelId, ...params } }),
  createMessage: (channelId, data) => api.post('/messages', data, { params: { channel_id: channelId } }),
  updateMessage: (messageId, data) => api.put(`/messages/${messageId}`, data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getThread: (messageId) => api.get(`/messages/${messageId}/thread`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reactions`, null, { params: { emoji } }),
  removeReaction: (messageId, emoji) => api.delete(`/messages/${messageId}/reactions/${emoji}`),
};

// Files API
export const filesAPI = {
  getFiles: (courseId, params) => api.get('/files', { params: { course_id: courseId, ...params } }),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  uploadFile: (courseId, file, folderId) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/files', formData, {
      params: { course_id: courseId, folder_id: folderId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadFile: (fileId) => api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  getPreviewUrl: (fileId) => api.get(`/files/${fileId}/preview`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  getVersions: (fileId) => api.get(`/files/${fileId}/versions`),
  addTag: (fileId, tag) => api.post(`/files/${fileId}/tags`, null, { params: { tag } }),
  getFolders: (courseId) => api.get('/files/folders', { params: { course_id: courseId } }),
  createFolder: (courseId, data) => api.post('/files/folders', data, { params: { course_id: courseId } }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Assignments API
export const assignmentsAPI = {
  // Assignment management
  getAssignments: (courseId, params) => api.get('/assignments', { params: { course_id: courseId, ...params } }),
  getAssignment: (assignmentId) => api.get(`/assignments/${assignmentId}`),
  createAssignment: (courseId, data) => api.post('/assignments', data, { params: { course_id: courseId } }),
  updateAssignment: (assignmentId, data) => api.put(`/assignments/${assignmentId}`, data),
  deleteAssignment: (assignmentId) => api.delete(`/assignments/${assignmentId}`),
  getAssignmentStats: (assignmentId) => api.get(`/assignments/${assignmentId}/stats`),

  // Submissions
  submitAssignment: (assignmentId, data) => api.post(`/assignments/${assignmentId}/submissions`, data),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  getMySubmission: (assignmentId) => api.get(`/assignments/${assignmentId}/my-submission`),

  // Grading
  gradeSubmission: (submissionId, data) => api.post(`/assignments/submissions/${submissionId}/grade`, data),
  updateGrade: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
  getGrade: (submissionId) => api.get(`/assignments/submissions/${submissionId}/grade`),

  // File attachments
  getAssignmentFiles: (assignmentId) => api.get(`/assignments/${assignmentId}/files`),
  attachFileToAssignment: (assignmentId, file, fileType) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assignments/${assignmentId}/files`, formData, {
      params: { file_type: fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSubmissionFiles: (submissionId) => api.get(`/assignments/submissions/${submissionId}/files`),
  attachFileToSubmission: (submissionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assignments/submissions/${submissionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Attendance API
export const attendanceAPI = {
  // Session management (Instructor/Assistant)
  createSession: (data) => api.post('/attendance/sessions', data),
  getSessions: (courseId, params) => api.get('/attendance/sessions', {
    params: { course_id: courseId, ...params }
  }),
  getSession: (sessionId) => api.get(`/attendance/sessions/${sessionId}`),
  updateSession: (sessionId, data) => api.put(`/attendance/sessions/${sessionId}`, data),
  deleteSession: (sessionId) => api.delete(`/attendance/sessions/${sessionId}`),

  // Student check-in
  checkIn: (data) => api.post('/attendance/checkin', data),

  // Records
  getRecords: (sessionId) => api.get('/attendance/records', {
    params: { session_id: sessionId }
  }),
  getMyRecords: (courseId) => api.get('/attendance/my-records', {
    params: { course_id: courseId }
  }),
};

// Quiz API
export const quizAPI = {
  // Quiz management
  getQuizzes: (courseId, params) => api.get('/quiz/quizzes', {
    params: { course_id: courseId, ...params }
  }),
  getQuiz: (quizId) => api.get(`/quiz/quizzes/${quizId}`),
  createQuiz: (data) => api.post('/quiz/quizzes', data),
  updateQuiz: (quizId, data) => api.put(`/quiz/quizzes/${quizId}`, data),
  deleteQuiz: (quizId) => api.delete(`/quiz/quizzes/${quizId}`),

  // Question management
  getQuestions: (quizId) => api.get(`/quiz/quizzes/${quizId}/questions`),
  createQuestion: (quizId, data) => api.post(`/quiz/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId, data) => api.put(`/quiz/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/quiz/questions/${questionId}`),

  // Quiz taking
  startQuiz: (quizId) => api.post(`/quiz/quizzes/${quizId}/start`),
  submitQuiz: (attemptId, data) => api.post(`/quiz/attempts/${attemptId}/submit`, data),
  trackBehavior: (attemptId, data) => api.patch(`/quiz/attempts/${attemptId}/track`, data),
  getAttempt: (attemptId) => api.get(`/quiz/attempts/${attemptId}`),
  getAttempts: (quizId) => api.get(`/quiz/quizzes/${quizId}/attempts`),

  // Grading
  gradeAnswer: (answerId, data) => api.post(`/quiz/answers/${answerId}/grade`, data),
  getStatistics: (quizId) => api.get(`/quiz/quizzes/${quizId}/statistics`),
};

// Progress API
export const progressAPI = {
  // Progress tracking
  getMyProgress: (courseId) => api.get('/progress/progress', {
    params: { course_id: courseId }
  }),
  getProgressSummary: (courseId) => api.get(`/progress/progress/${courseId}/summary`),
  getProgressComparison: (courseId) => api.get(`/progress/progress/${courseId}/comparison`),

  // Activity logging
  logActivity: (data) => api.post('/progress/activities', data),

  // Achievements
  getAchievements: (courseId) => api.get('/progress/achievements', {
    params: { course_id: courseId }
  }),

  // Milestones
  getMilestones: (courseId) => api.get('/progress/milestones', {
    params: { course_id: courseId }
  }),
  createMilestone: (data) => api.post('/progress/milestones', data),
  updateMilestone: (milestoneId, data) => api.put(`/progress/milestones/${milestoneId}`, data),
  deleteMilestone: (milestoneId) => api.delete(`/progress/milestones/${milestoneId}`),

  // Leaderboard
  getLeaderboard: (courseId, limit = 10) => api.get(`/progress/leaderboard/${courseId}`, {
    params: { limit }
  }),

  // Statistics
  getStatistics: (courseId) => api.get(`/progress/statistics/${courseId}`),
};

// Calendar API
export const calendarAPI = {
  // Course events
  getEvents: (params) => api.get('/calendar/events', { params }),
  getEvent: (eventId) => api.get(`/calendar/events/${eventId}`),
  createEvent: (data) => api.post('/calendar/events', data),
  updateEvent: (eventId, data) => api.put(`/calendar/events/${eventId}`, data),
  deleteEvent: (eventId) => api.delete(`/calendar/events/${eventId}`),

  // Personal events
  getPersonalEvents: (params) => api.get('/calendar/personal-events', { params }),
  createPersonalEvent: (data) => api.post('/calendar/personal-events', data),
  updatePersonalEvent: (eventId, data) => api.put(`/calendar/personal-events/${eventId}`, data),
  deletePersonalEvent: (eventId) => api.delete(`/calendar/personal-events/${eventId}`),

  // Calendar view
  getCalendarView: (params) => api.get('/calendar/view', { params }),

  // RSVP
  rsvp: (eventId, data) => api.post(`/calendar/events/${eventId}/rsvp`, data),
  getAttendees: (eventId) => api.get(`/calendar/events/${eventId}/attendees`),

  // Export
  exportToICal: (params) => api.get('/calendar/export/ical', {
    params,
    responseType: 'blob'
  }),
};

export default api;

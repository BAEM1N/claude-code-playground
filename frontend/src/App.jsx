/**
 * Main App Component
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Placeholder components (to be implemented)
const LoginPage = () => <div>Login Page</div>;
const DashboardPage = () => <div>Dashboard Page</div>;
const CoursePage = () => <div>Course Page</div>;
const ChatPage = () => <div>Chat Page</div>;
const FilesPage = () => <div>Files Page</div>;

// Assignment Pages
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import AssignmentFormPage from './pages/AssignmentFormPage';
import SubmissionListPage from './pages/SubmissionListPage';

// Priority 1 Feature Pages
import AttendancePage from './pages/AttendancePage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import CalendarPage from './pages/CalendarPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/files"
        element={
          <ProtectedRoute>
            <FilesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assignments"
        element={
          <ProtectedRoute>
            <AssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assignments/new"
        element={
          <ProtectedRoute>
            <AssignmentFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assignments/:assignmentId"
        element={
          <ProtectedRoute>
            <AssignmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assignments/:assignmentId/edit"
        element={
          <ProtectedRoute>
            <AssignmentFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assignments/:assignmentId/submissions"
        element={
          <ProtectedRoute>
            <SubmissionListPage />
          </ProtectedRoute>
        }
      />
      {/* Priority 1 Features */}
      <Route
        path="/courses/:courseId/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

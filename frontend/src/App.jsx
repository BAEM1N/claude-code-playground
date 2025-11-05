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

/**
 * Main App Component
 */
import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Core Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';

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

// AI Assistant Pages
import AIAssistantPage from './pages/AIAssistantPage';
import AIUsageDashboard from './pages/AIUsageDashboard';
import AIConversationsPage from './pages/AIConversationsPage';

// Learning Paths Pages
import LearningPathsPage from './pages/LearningPathsPage';
import LearningPathDetailPage from './pages/LearningPathDetailPage';

// Learning Module Pages
import LearningModuleView from './components/learning/LearningModuleView';

// Coding Environment Pages
import CodingPlaygroundPage from './pages/CodingPlaygroundPage';

// Virtual Classroom Pages
import VirtualClassroomPage from './pages/VirtualClassroomPage';

// Forum Pages
import ForumPage from './pages/ForumPage';

// Competition Pages
import CompetitionsPage from './pages/CompetitionsPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';

// Gamification Pages
import BadgesPage from './pages/BadgesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import TeamsPage from './pages/TeamsPage';
import ProfileCustomization from './components/gamification/ProfileCustomization';
import ChallengesList from './components/gamification/ChallengesList';
import FriendsSystem from './components/gamification/FriendsSystem';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분 - 데이터가 fresh한 시간
      cacheTime: 10 * 60 * 1000, // 10분 - 캐시 유지 시간
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnMount: true, // 컴포넌트 마운트 시 refetch
      refetchOnReconnect: true, // 재연결 시 refetch
      retry: 1, // 실패 시 재시도 횟수
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // 재시도 딜레이 (exponential backoff)
    },
    mutations: {
      retry: 1,
    },
  },
});

// Protected Route wrapper
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
      {/* AI Assistant */}
      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <AIAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/ai-assistant"
        element={
          <ProtectedRoute>
            <AIAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-usage"
        element={
          <ProtectedRoute>
            <AIUsageDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-conversations"
        element={
          <ProtectedRoute>
            <AIConversationsPage />
          </ProtectedRoute>
        }
      />

      {/* Learning Paths */}
      <Route
        path="/learning-paths"
        element={
          <ProtectedRoute>
            <LearningPathsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-paths/:pathId"
        element={
          <ProtectedRoute>
            <LearningPathDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Learning Modules - Video/Markdown/Notebook Learning */}
      <Route
        path="/learning/modules/:moduleId/topics/:topicId?"
        element={
          <ProtectedRoute>
            <LearningModuleView />
          </ProtectedRoute>
        }
      />

      {/* Coding Environment */}
      <Route
        path="/coding-playground"
        element={
          <ProtectedRoute>
            <CodingPlaygroundPage />
          </ProtectedRoute>
        }
      />

      {/* Virtual Classroom */}
      <Route
        path="/virtual-classroom/:classroomId"
        element={
          <ProtectedRoute>
            <VirtualClassroomPage />
          </ProtectedRoute>
        }
      />

      {/* Forum */}
      <Route
        path="/forum"
        element={
          <ProtectedRoute>
            <ForumPage />
          </ProtectedRoute>
        }
      />

      {/* Competitions */}
      <Route
        path="/competitions"
        element={
          <ProtectedRoute>
            <CompetitionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/competitions/:competitionId"
        element={
          <ProtectedRoute>
            <CompetitionDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Gamification */}
      <Route
        path="/gamification/badges"
        element={
          <ProtectedRoute>
            <BadgesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gamification/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gamification/profile"
        element={
          <ProtectedRoute>
            <ProfileCustomization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gamification/challenges"
        element={
          <ProtectedRoute>
            <ChallengesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gamification/friends"
        element={
          <ProtectedRoute>
            <FriendsSystem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </AuthProvider>
      </Router>
      {/* React Query Devtools - 개발 환경에서만 표시 */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;

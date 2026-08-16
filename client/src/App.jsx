import React, { useContext } from 'react';
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthContext } from './context/AuthContext';

// =========================================================
// PUBLIC PAGES
// =========================================================

import LandingPage from './pages/LandingPage';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import MagicLogin from './pages/auth/MagicLogin';

import VerifyCertificate from './pages/VerifyCertificate';

// =========================================================
// LAYOUT
// =========================================================

import MainLayout from './layouts/MainLayout';

// =========================================================
// STUDENT
// =========================================================

import StudentDashboard from './pages/student/StudentDashboard';
import ExamList from './pages/student/ExamList';
import LiveExam from './pages/student/LiveExam';
import ResultDetail from './pages/student/ResultDetail';
import StudentResultsList from './pages/student/StudentResultsList';
import Leaderboard from './pages/student/Leaderboard';
import Certificates from './pages/student/Certificates';
import PracticePlayground from './pages/student/PracticePlayground';
import ProblemSolvingArena from './pages/student/ProblemSolvingArena';
import AIInterviewPrep from './pages/student/AIInterviewPrep';
import VersantAssessment from './pages/student/VersantAssessment';
import StudentAssignedExams from './pages/student/StudentAssignedExams';


// =========================================================
// FACULTY
// =========================================================

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyExamList from './pages/faculty/FacultyExamList';
import ExamBuilder from './pages/faculty/ExamBuilder';
import QuestionBank from './pages/faculty/QuestionBank';
import FacultyAnalytics from './pages/faculty/FacultyAnalytics';
import LiveProctorDashboard from './pages/faculty/LiveProctorDashboard';
import ExamAssignment from './pages/faculty/ExamAssignment';
import FacultyAssessmentResults from './pages/faculty/FacultyAssessmentResults';
import AiQuestionGenerator from './pages/faculty/AiQuestionGenerator';
import PlagiarismDetector from './pages/faculty/PlagiarismDetector';
import LiveExamMonitorRoom from './pages/faculty/LiveExamMonitorRoom';

// =========================================================
// ADMIN
// =========================================================

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import UserManagement from './pages/admin/UserManagement';
import GroupManagement from './pages/admin/GroupManagement';
import GroupDetails from './pages/admin/GroupDetails';
import CategoryCourseManager from './pages/admin/CategoryCourseManager';
import AuditLogViewer from './pages/admin/AuditLogViewer';


// =========================================================
// PROTECTED ROUTE
// =========================================================

const ProtectedRoute = ({
  children,
  allowedRoles,
}) => {

  const {
    user,
    loading,
  } = useContext(AuthContext);


  // -------------------------------------------------------
  // CHECKING SESSION (ENHANCED BOOTSTRAP 5 SPINNER UI)
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm p-4 text-center" style={{ maxWidth: '380px', width: '100%', borderRadius: '12px' }}>
          <div className="card-body">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>

            <h6 className="fw-bold text-dark mb-1">
              Verifying Session Security
            </h6>

            <p className="small text-muted mb-0">
              Please wait while we validate your credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }


  // -------------------------------------------------------
  // NOT LOGGED IN
  // -------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // -------------------------------------------------------
  // ROLE CHECK (Case-Insensitive & Resilient)
  // -------------------------------------------------------

  if (allowedRoles && user && user.role) {
    const normAllowed = allowedRoles.map((r) => r.toLowerCase());
    const userRoleNorm = user.role.toLowerCase();

    if (!normAllowed.includes(userRoleNorm)) {
      return (
        <Navigate
          to={getDashboardPath(user.role)}
          replace
        />
      );
    }
  }


  return children;
};


// =========================================================
// DEFAULT DASHBOARD BY ROLE
// =========================================================

const getDashboardPath = (role) => {
  const normRole = (role || '').toLowerCase();
  switch (normRole) {
    case 'student':
      return '/student/dashboard';
    case 'faculty':
      return '/faculty/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/login';
  }
};


// =========================================================
// APP
// =========================================================

const App = () => {

  return (
    <Routes>

      {/* =================================================
          PUBLIC ROUTES
          ================================================= */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      <Route
        path="/magic-login"
        element={<MagicLogin />}
      />

      <Route
        path="/verify-certificate/:id"
        element={<VerifyCertificate />}
      />


      {/* =================================================
          LIVE STUDENT EXAM
          FULL SCREEN / DISTRACTION FREE
          ================================================= */}

      <Route
        path="/student/exam/:id"
        element={
          <ProtectedRoute
            allowedRoles={['student']}
          >
            <LiveExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exam/:id/attempt"
        element={
          <ProtectedRoute
            allowedRoles={['student']}
          >
            <LiveExam />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          PROTECTED MAIN LAYOUT
          ================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              'student',
              'faculty',
              'admin',
            ]}
          >
            <MainLayout />
          </ProtectedRoute>
        }
      >

        {/* =================================================
            STUDENT ROUTES
            ================================================= */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentResultsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/results/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ResultDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Certificates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/practice"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PracticePlayground />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/practice/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PracticePlayground />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/problem/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PracticePlayground />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/problem-solving"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProblemSolvingArena />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/ai-interview"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AIInterviewPrep />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/versant"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <VersantAssessment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/assigned-exams"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAssignedExams />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            FACULTY ROUTES
            ================================================= */}

        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/exams"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyExamList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/exams/create"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <ExamBuilder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/questions"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <QuestionBank defaultTab="mcq" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/coding"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <QuestionBank defaultTab="coding" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/proctor"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <LiveProctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/proctor/:examId"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <LiveProctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/exam-assignments"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <ExamAssignment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/analytics"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/results"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyAssessmentResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/ai-generator"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <AiQuestionGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/plagiarism"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <PlagiarismDetector />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/live-monitor"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <LiveExamMonitorRoom />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            ADMIN ROUTES
            ================================================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/groups"
          element={
            <ProtectedRoute allowedRoles={['admin', 'faculty']}>
              <GroupManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/groups/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'faculty']}>
              <GroupDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CategoryCourseManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogViewer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

      </Route>


      {/* =================================================
          FALLBACK
          ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
};

export default App;
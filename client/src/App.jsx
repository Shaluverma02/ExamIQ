import React, { Suspense, lazy, useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyPhone = lazy(() => import('./pages/auth/VerifyPhone'));
const MagicLogin = lazy(() => import('./pages/auth/MagicLogin'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));

const MainLayout = lazy(() => import('./layouts/MainLayout'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const ExamList = lazy(() => import('./pages/student/ExamList'));
const LiveExam = lazy(() => import('./pages/student/LiveExam'));
const ResultDetail = lazy(() => import('./pages/student/ResultDetail'));
const StudentResultsList = lazy(() => import('./pages/student/StudentResultsList'));
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'));
const Certificates = lazy(() => import('./pages/student/Certificates'));
const PracticePlayground = lazy(() => import('./pages/student/PracticePlayground'));
const ProblemSolvingArena = lazy(() => import('./pages/student/ProblemSolvingArena'));
const AIInterviewPrep = lazy(() => import('./pages/student/AIInterviewPrep'));
const VersantAssessment = lazy(() => import('./pages/student/VersantAssessment'));
const StudentAssignedExams = lazy(() => import('./pages/student/StudentAssignedExams'));

const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const FacultyExamList = lazy(() => import('./pages/faculty/FacultyExamList'));
const ExamBuilder = lazy(() => import('./pages/faculty/ExamBuilder'));
const QuestionBank = lazy(() => import('./pages/faculty/QuestionBank'));
const FacultyAnalytics = lazy(() => import('./pages/faculty/FacultyAnalytics'));
const LiveProctorDashboard = lazy(() => import('./pages/faculty/LiveProctorDashboard'));
const ExamAssignment = lazy(() => import('./pages/faculty/ExamAssignment'));
const FacultyAssessmentResults = lazy(() => import('./pages/faculty/FacultyAssessmentResults'));
const AiQuestionGenerator = lazy(() => import('./pages/faculty/AiQuestionGenerator'));
const PlagiarismDetector = lazy(() => import('./pages/faculty/PlagiarismDetector'));
const LiveExamMonitorRoom = lazy(() => import('./pages/faculty/LiveExamMonitorRoom'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const CollegeManagement = lazy(() => import('./pages/admin/CollegeManagement'));
const GroupManagement = lazy(() => import('./pages/admin/GroupManagement'));
const GroupDetails = lazy(() => import('./pages/admin/GroupDetails'));
const CategoryCourseManager = lazy(() => import('./pages/admin/CategoryCourseManager'));
const AuditLogViewer = lazy(() => import('./pages/admin/AuditLogViewer'));
const CollegeAdminDashboard = lazy(() => import('./pages/admin/CollegeAdminDashboard'));
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'));
const RecruiterWorkspace = lazy(() => import('./pages/recruiter/RecruiterWorkspace'));

const getDashboardPath = (role) => {
  const normRole = (role || '').toLowerCase();
  switch (normRole) {
    case 'student':
      return '/student/dashboard';
    case 'faculty':
      return '/faculty/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'college_admin':
      return '/college-admin/dashboard';
    case 'recruiter':
      return '/recruiter/dashboard';
    default:
      return '/login';
  }
};
const CollegeAdminManagement = lazy(() => import('./pages/admin/CollegeAdminManagement'));

const LoadingScreen = () => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body px-3">
    <div className="card p-4" style={{ width: 'min(100%, 360px)' }}>
      <div className="d-flex align-items-center gap-3">
        <div className="icon-box" aria-hidden="true">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
        </div>
        <div>
          <h1 className="h6 fw-bold mb-1">Loading ExamiQ</h1>
          <p className="small text-secondary mb-0">Preparing your workspace...</p>
        </div>
      </div>
      <div className="visually-hidden" role="status">Loading your workspace</div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && user.role) {
    const allowed = allowedRoles.map((role) => role.toLowerCase());
    if (!allowed.includes(user.role.toLowerCase())) {
      return <Navigate to={getDashboardPath(user.role)} replace />;
    }
  }

  return children;
};

const protectedRoute = (element, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

const studentRoutes = [
  ['/student/dashboard', <StudentDashboard />],
  ['/student/exams', <ExamList />],
  ['/student/results', <StudentResultsList />],
  ['/student/results/:id', <ResultDetail />],
  ['/student/leaderboard', <Leaderboard />],
  ['/student/certificates', <Certificates />],
  ['/student/practice', <PracticePlayground />],
  ['/student/practice/:id', <PracticePlayground />],
  ['/student/problem/:id', <PracticePlayground />],
  ['/student/problem-solving', <ProblemSolvingArena />],
  ['/student/ai-interview', <AIInterviewPrep />],
  ['/student/versant', <VersantAssessment />],
  ['/student/assigned-exams', <Navigate to="/student/exams" replace />],
];

const facultyRoutes = [
  ['/faculty/dashboard', <FacultyDashboard />],
  ['/faculty/exams', <FacultyExamList />],
  ['/faculty/exams/create', <ExamBuilder />],
  ['/faculty/questions', <QuestionBank defaultTab="mcq" />],
  ['/faculty/coding', <QuestionBank defaultTab="coding" />],
  ['/faculty/proctor', <LiveProctorDashboard />],
  ['/faculty/proctor/:examId', <LiveProctorDashboard />],
  ['/faculty/exam-assignments', <ExamAssignment />],
  ['/faculty/analytics', <FacultyAnalytics />],
  ['/faculty/results', <FacultyAssessmentResults />],
];

const sharedFacultyAdminRoutes = [
  ['/faculty/ai-generator', <AiQuestionGenerator />],
  ['/faculty/plagiarism', <PlagiarismDetector />],
  ['/faculty/live-monitor', <LiveExamMonitorRoom />],
  ['/admin/groups', <GroupManagement />],
  ['/admin/groups/:id', <GroupDetails />],
  ['/faculty/groups', <GroupManagement />],
  ['/faculty/groups/:id', <GroupDetails />],
];

const adminRoutes = [
  ['/admin/dashboard', <AdminDashboard />],
  ['/admin/colleges', <CollegeManagement />],
  ['/admin/users', <UserManagement />],
  ['/admin/groups', <GroupManagement />],
  ['/admin/groups/:id', <GroupDetails />],
  ['/admin/audit-logs', <AuditLogViewer />],
  ['/admin/analytics', <AdminAnalytics />],
  ['/admin/college-admins', <CollegeAdminManagement />],
];

const collegeAdminRoutes = [
  ['/college-admin/dashboard', <CollegeAdminDashboard />],
  ['/college-admin/users', <UserManagement />],
  ['/college-admin/groups', <GroupManagement />],
  ['/college-admin/groups/:id', <GroupDetails />],
  ['/college-admin/categories', <CategoryCourseManager />],
  ['/college-admin/analytics', <AdminAnalytics />],
];

const recruiterRoutes = [
  ['/recruiter/dashboard', <RecruiterDashboard />],
  ['/recruiter/drives', <RecruiterWorkspace />],
  ['/recruiter/talent', <RecruiterWorkspace />],
  ['/recruiter/rules', <RecruiterWorkspace />],
  ['/recruiter/reports', <RecruiterWorkspace />],
];

const App = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-phone" element={<VerifyPhone />} />
      <Route path="/magic-login" element={<MagicLogin />} />
      <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />

      <Route path="/student/exam/:id" element={protectedRoute(<LiveExam />, ['student'])} />
      <Route path="/student/exam/:id/attempt" element={protectedRoute(<LiveExam />, ['student'])} />

      <Route element={protectedRoute(<MainLayout />, ['student', 'faculty', 'admin', 'college_admin', 'recruiter'])}>
        {studentRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['student'])} />
        ))}

        {facultyRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['faculty'])} />
        ))}

        {sharedFacultyAdminRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['faculty', 'admin', 'college_admin'])} />
        ))}

        {adminRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['admin'])} />
        ))}

        {collegeAdminRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['college_admin'])} />
        ))}

        {recruiterRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={protectedRoute(element, ['recruiter'])} />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;

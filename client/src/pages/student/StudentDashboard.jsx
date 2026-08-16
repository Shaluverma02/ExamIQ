import React, { useEffect, useState, useContext } from 'react';
import API, { examAssignmentAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

import {
  BookOpen,
  Trophy,
  Code2,
  ArrowRight,
  Flame,
  Target,
  Sparkles,
  ChevronRight,
  Clock,
  FileCode,
  FileCheck,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';

import StudentProfileModal from '../../components/StudentProfileModal';
import ResumePdfGenerator from '../../components/ResumePdfGenerator';

const StudentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);

  const [exams, setExams] = useState([]);
  const [assignedExams, setAssignedExams] = useState([]);
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [examRes, resultRes, assignedRes, meRes] = await Promise.all([
        API.get('/exams?status=published'),
        API.get('/results'),
        examAssignmentAPI.getStudentAssignments().catch(() => ({ data: { assignments: [] } })),
        API.get('/auth/me').catch(() => ({ data: { profile: null } })),
      ]);

      setExams(examRes.data?.exams || []);
      setResults(resultRes.data?.results || []);
      setAssignedExams(assignedRes.data?.assignments || []);
      setProfile(meRes.data?.profile || null);
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const completedCount = results.length;

  const secAcademic = Boolean(profile?.rollNumber && profile?.college && profile?.course);
  const secSkills = Boolean(profile?.skills && profile.skills.length > 0);
  const secProjects = Boolean(profile?.projects && profile.projects.length > 0);
  const secExp = Boolean(profile?.experience && profile.experience.length > 0);
  const secLinks = Boolean(profile?.resumeUrl || profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl);

  const completedSectionsCount = [secAcademic, secSkills, secProjects, secExp, secLinks].filter(Boolean).length;
  const profilePercentage = completedSectionsCount * 20;

  const xpPoints =
    completedCount > 0
      ? completedCount * 25
      : 100;

  const nextTierXP = 30000;

  const xpProgress = Math.min(
    100,
    Math.max(0, (xpPoints / nextTierXP) * 100)
  );

  const remainingXP = Math.max(
    0,
    nextTierXP - xpPoints
  );

  // =====================================================
  // DATE
  // =====================================================

  const todayStr = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  // =====================================================
  // GREETING
  // =====================================================

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening';

  // =====================================================
  // LOADING UI
  // =====================================================

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex flex-column align-items-center justify-content-center text-center">

          <div
            className="spinner-border text-primary mb-3"
            style={{ width: 40, height: 40 }}
            role="status"
          />

          <h5 className="fw-bold mb-1">
            Loading your dashboard
          </h5>

          <p className="text-muted small">
            Preparing your personal assessment portal...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <StudentProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        initialProfile={profile}
        onProfileSaved={(updatedUser, updatedProfile) => {
          if (updatedUser && setUser) setUser(updatedUser);
          if (updatedProfile) setProfile(updatedProfile);
        }}
      />

      {/* =================================================
          PROFILE COMPLETION
          ================================================= */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">

          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">

            <div className="d-flex align-items-center gap-3">

              {/* Circular Progress */}

              <div
                className="position-relative d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                }}
              >

                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 36 36"
                >

                  <path
                    stroke="var(--border-color)"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                  <path
                    stroke="var(--success-color)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${profilePercentage}, 100`}
                    fill="none"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                </svg>

                <span
                  className="position-absolute fw-bold"
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--success-color)',
                  }}
                >
                  {profilePercentage}%
                </span>

              </div>

              <div>

                <div className="fw-bold">
                  {profilePercentage === 100 ? 'Profile 100% Completed!' : 'Complete your profile'}
                </div>

                <div className="text-muted small">
                  {completedSectionsCount} of 5 sections done · complete profiles
                  get noticed by interviewers
                </div>

              </div>

            </div>

            <div className="d-flex gap-2 flex-wrap align-items-center">
              <ResumePdfGenerator user={user} profile={profile} />

              <button
                type="button"
                className="btn btn-outline-success btn-sm rounded-pill px-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowProfileModal(true)}
              >
                {profilePercentage === 100 ? 'Edit profile' : 'Complete profile'}
                <ArrowRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* REAL-TIME EXAM ALERT BANNER */}
      {assignedExams.length > 0 && (
        <div className="card border-0 shadow-sm mb-4 rounded-4 bg-warning bg-opacity-15 border border-warning">
          <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <span className="badge bg-warning text-dark font-monospace text-uppercase mb-1">
                  ⚡ Assigned Assessment Alert
                </span>
                <h5 className="fw-bold text-light m-0">
                  {assignedExams[0].title || assignedExams[0].examId?.title || 'Faculty Assessment'}
                </h5>
                <p className="text-muted small m-0 mt-1">
                  Assigned to your group • Available until {new Date(assignedExams[0].endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Link
              to="/student/assigned-exams"
              className="btn btn-warning fw-bold rounded-pill px-4 text-dark flex-shrink-0 d-flex align-items-center gap-2 shadow"
            >
              <Zap size={16} /> Attempt Exam Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* =================================================
          HERO
          ================================================= */}

      <div
        className="card border-0 shadow-sm mb-4 overflow-hidden"
      >

        <div className="card-body p-4">

          <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-4">

            <div>

              <div
                className="small fw-semibold text-muted mb-2 d-flex align-items-center gap-2"
              >
                <Clock
                  size={14}
                  className="text-info"
                />

                {todayStr}
              </div>

              <h2 className="fw-bold mb-1">

                {greeting},{' '}

                <span className="text-primary">
                  {user?.name || 'Student'}
                </span>

              </h2>

              <p className="text-muted mb-0">
                Everything you need to{' '}
                <strong className="text-body">
                  ace your placements
                </strong>{' '}
                — AI powered.
              </p>

            </div>


            {/* HERO STATS */}

            <div className="d-flex flex-wrap gap-2">

              {/* Streak */}

              <div className="border rounded-3 px-3 py-2">
                <div className="d-flex align-items-center gap-2">

                  <Flame
                    size={20}
                    className="text-warning"
                  />

                  <div>

                    <div className="fw-bold">
                      0
                    </div>

                    <div className="text-muted small">
                      day streak
                    </div>

                  </div>

                </div>
              </div>


              {/* Readiness */}

              <div className="border rounded-3 px-3 py-2">

                <div className="d-flex align-items-center gap-2">

                  <Target
                    size={20}
                    className="text-info"
                  />

                  <div>

                    <div className="fw-bold">
                      —
                    </div>

                    <div className="text-muted small">
                      readiness
                    </div>

                  </div>

                </div>

              </div>


              {/* XP */}

              <div className="border rounded-3 px-3 py-2">

                <div className="d-flex align-items-center gap-2">

                  <Trophy
                    size={20}
                    className="text-warning"
                  />

                  <div>

                    <div className="fw-bold">
                      {xpPoints}
                    </div>

                    <div className="text-muted small">
                      Bronze XP
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          PRACTICE HUB HEADER
          ================================================= */}

      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">

        <div>

          <h4 className="fw-bold mb-1">
            Practice Hub
          </h4>

          <p className="text-muted small mb-0">
            Everything to get placement-ready
          </p>

        </div>

        <span className="badge bg-primary rounded-pill align-self-start align-self-sm-center">
          {assignedExams.length} Assigned · {exams.length} Available
        </span>

      </div>


      {/* =================================================
          ASSIGNED EXAMS
          ================================================= */}

      {assignedExams.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <div>
                <h5 className="fw-bold mb-1">Assigned Exams</h5>
                <p className="text-muted small mb-0">
                  Exams assigned to you by faculty
                </p>
              </div>
              <Link
                to="/student/assigned-exams"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="row g-3">
              {assignedExams.slice(0, 3).map((assignment) => (
                <div key={assignment._id} className="col-12 col-md-4">
                  <div className="border rounded-3 p-3 h-100">
                    <div className="fw-semibold small text-truncate mb-1">
                      {assignment.title || assignment.examId?.title}
                    </div>
                    <div className="text-muted small mb-2">
                      Due {new Date(assignment.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <Link
                      to={`/student/exam/${assignment.examId?._id}/attempt`}
                      className="btn btn-primary btn-sm w-100"
                    >
                      {assignment.attempt?.status === 'started' ? 'Resume' : 'Start Exam'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* =================================================
          PRACTICE CARDS
          ================================================= */}

      <div className="row g-4 mb-4">


        {/* =================================================
            ASSESSMENTS
            ================================================= */}

        <div className="col-12 col-lg-4">

          <div className="card h-100 shadow-sm">

            <div className="card-body p-4 d-flex flex-column">

              <div className="d-flex justify-content-between align-items-start mb-3">

                <div className="d-flex align-items-center gap-2">

                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor:
                        'rgba(37, 99, 235, 0.12)',
                      color: 'var(--primary-color)',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>

                  <h5 className="fw-bold mb-0">
                    Assessments
                  </h5>

                </div>

                <span className="badge bg-success rounded-pill">
                  {completedCount} Done
                </span>

              </div>


              <p className="text-muted small">

                Last:{' '}

                <strong className="text-body">
                  {results[0]?.examId?.title ||
                    'No assessment completed'}
                </strong>

              </p>


              {/* RESULTS */}

              <div className="d-flex flex-column gap-2 mb-4">

                {results.slice(0, 3).map((result, index) => (

                  <div
                    key={result._id || index}
                    className="border rounded-3 p-2"
                  >

                    <div className="d-flex align-items-center justify-content-between gap-2">

                      <div className="d-flex align-items-center gap-2 overflow-hidden">

                        <FileCheck
                          size={17}
                          className="text-success flex-shrink-0"
                        />

                        <div className="overflow-hidden">

                          <div className="fw-semibold small text-truncate">
                            {result.examId?.title ||
                              `Assessment ${index + 1}`}
                          </div>

                          <div className="text-muted small">
                            {new Date(
                              result.evaluatedAt ||
                              Date.now()
                            ).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </div>

                        </div>

                      </div>


                      <span className="badge bg-primary rounded-pill">
                        {result.percentage ?? 0}%
                      </span>

                    </div>

                  </div>

                ))}


                {results.length === 0 && (

                  <div className="text-center border rounded-3 p-4">

                    <CheckCircle2
                      size={28}
                      className="text-muted mb-2"
                    />

                    <div className="text-muted small">
                      No assessments completed yet.
                    </div>

                  </div>

                )}

              </div>


              <div className="mt-auto">

                <Link
                  to="/student/exams"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  View Assessments
                  <ChevronRight size={16} />
                </Link>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            CODING ASSIGNMENTS
            ================================================= */}

        <div className="col-12 col-lg-4">

          <div className="card h-100 shadow-sm">

            <div className="card-body p-4 d-flex flex-column">

              <div className="d-flex align-items-center gap-2 mb-3">

                <div
                  className="rounded-3 p-2"
                  style={{
                    backgroundColor:
                      'rgba(2, 132, 199, 0.12)',
                    color: 'var(--info-color)',
                  }}
                >
                  <FileCode size={20} />
                </div>

                <h5 className="fw-bold mb-0">
                  Coding Practice
                </h5>

              </div>


              <p className="text-muted small mb-4">
                Solve programming problems, improve your
                logic and prepare for coding interviews.
              </p>


              <div className="border rounded-3 p-4 text-center mb-4">

                <Code2
                  size={34}
                  className="text-primary mb-2"
                />

                <h6 className="fw-bold">
                  Coding Arena
                </h6>

                <p className="text-muted small mb-0">
                  Practice algorithms, data structures
                  and coding challenges.
                </p>

              </div>


              <div className="mt-auto">

                <Link
                  to="/student/problem-solving"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  Start Coding
                  <ChevronRight size={16} />
                </Link>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            REWARDS
            ================================================= */}

        <div className="col-12 col-lg-4">

          <div className="card h-100 shadow-sm">

            <div className="card-body p-4">

              <div className="d-flex align-items-center gap-2 text-warning fw-bold small text-uppercase mb-3">

                <Sparkles size={15} />

                Rewards Club

              </div>


              {/* XP */}

              <div className="d-flex align-items-center gap-3 mb-4">

                <div
                  className="rounded-circle p-3 d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor:
                      'rgba(217, 119, 6, 0.12)',
                  }}
                >

                  <Trophy
                    size={28}
                    className="text-warning"
                  />

                </div>

                <div>

                  <h3 className="fw-bold mb-1">

                    {xpPoints}{' '}

                    <span className="fs-6 text-muted">
                      XP
                    </span>

                  </h3>

                  <span className="badge bg-warning text-dark">
                    BRONZE TIER
                  </span>

                </div>

              </div>


              {/* PROGRESS */}

              <div className="mb-4">

                <div className="d-flex justify-content-between mb-2">

                  <span className="text-muted small">
                    Next: Silver
                  </span>

                  <span className="text-muted small">
                    {remainingXP.toLocaleString()} XP away
                  </span>

                </div>

                <div
                  className="progress"
                  style={{ height: 8 }}
                >

                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width: `${xpProgress}%`,
                    }}
                  />

                </div>

              </div>


              {/* XP BREAKDOWN */}

              <div className="border-top pt-3">

                <div className="text-muted fw-bold small text-uppercase mb-3">
                  XP Breakdown
                </div>


                <div className="d-flex flex-column gap-2 small">

                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      <Code2 size={14} className="me-1" />
                      Problem Solving
                    </span>

                    <span className="fw-semibold">
                      0
                    </span>

                  </div>


                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      <BookOpen size={14} className="me-1" />
                      Assessments
                    </span>

                    <span className="text-warning fw-semibold">
                      {completedCount} × 25
                    </span>

                  </div>


                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      <Award size={14} className="me-1" />
                      Versant
                    </span>

                    <span className="fw-semibold">
                      0
                    </span>

                  </div>


                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      <FileCode size={14} className="me-1" />
                      Assignments
                    </span>

                    <span className="fw-semibold">
                      0
                    </span>

                  </div>


                  <div className="d-flex justify-content-between">

                    <span className="text-muted">
                      <Zap size={14} className="me-1" />
                      Mock Interviews
                    </span>

                    <span className="fw-semibold">
                      0
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          QUICK ACTIONS
          ================================================= */}

      <div className="card shadow-sm">

        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div>

              <h5 className="fw-bold mb-1">
                Continue Learning
              </h5>

              <p className="text-muted small mb-0">
                Pick your next activity
              </p>

            </div>

          </div>


          <div className="row g-3">

            <div className="col-12 col-md-4">

              <Link
                to="/student/problem-solving"
                className="text-decoration-none"
              >

                <div className="border rounded-3 p-3 h-100">

                  <Code2
                    className="text-primary mb-2"
                    size={22}
                  />

                  <div className="fw-bold">
                    Problem Solving
                  </div>

                  <div className="text-muted small">
                    Practice coding questions
                  </div>

                </div>

              </Link>

            </div>


            <div className="col-12 col-md-4">

              <Link
                to="/student/practice"
                className="text-decoration-none"
              >

                <div className="border rounded-3 p-3 h-100">

                  <BookOpen
                    className="text-success mb-2"
                    size={22}
                  />

                  <div className="fw-bold">
                    Practice Tests
                  </div>

                  <div className="text-muted small">
                    Improve your assessment score
                  </div>

                </div>

              </Link>

            </div>


            <div className="col-12 col-md-4">

              <Link
                to="/student/ai-interview"
                className="text-decoration-none"
              >

                <div className="border rounded-3 p-3 h-100">

                  <Sparkles
                    className="text-warning mb-2"
                    size={22}
                  />

                  <div className="fw-bold">
                    AI Interview Prep
                  </div>

                  <div className="text-muted small">
                    Practice interview questions
                  </div>

                </div>

              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
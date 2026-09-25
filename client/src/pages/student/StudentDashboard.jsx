import '../../styles/student.css';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Circle,
  ClipboardList, Clock, Code2, FileCheck, Mic, RefreshCw, Sparkles, Target, UserRound,
} from 'lucide-react';
import API, { examAssignmentAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import StudentProfileModal from '../../components/StudentProfileModal';
import ResumePdfGenerator from '../../components/ResumePdfGenerator';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const formatDate = (value, fallback = 'Date not set') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysLeftFrom = (value) => {
  if (!value) return null;
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
};

const daysLeftLabel = (daysLeft) => {
  if (daysLeft == null) return 'No due date';
  if (daysLeft < 0) return 'Past due';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

const StudentDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [assignedExams, setAssignedExams] = useState([]);
  const [results, setResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [practiceStats, setPracticeStats] = useState({ codingProblems: 0, interviews: 0, versant: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const responses = await Promise.allSettled([
      API.get('/exams?status=published'),
      API.get('/results'),
      examAssignmentAPI.getStudentAssignments(),
      API.get('/auth/me'),
      API.get('/coding'),
      API.get('/ai/interview/topics'),
      API.get('/ai/versant/assessment'),
    ]);
    const sections = ['exams', 'results', 'assignments', 'profile', 'coding', 'interviews', 'versant'];
    setUnavailable(sections.filter((_, index) => responses[index].status === 'rejected'));
    const data = responses.map((response) => response.status === 'fulfilled' ? response.value.data : null);
    setExams(data[0]?.exams || []);
    setResults(data[1]?.results || []);
    setAssignedExams(data[2]?.assignments || []);
    setProfile(data[3]?.profile || null);
    setPracticeStats({
      codingProblems: data[4]?.problems?.length || 0,
      interviews: data[5]?.recentAttempts?.length || 0,
      versant: data[6]?.recentSubmissions?.length || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const profileSections = [
    { label: 'Academic details', complete: Boolean(profile?.rollNumber && profile?.college && profile?.course) },
    { label: 'Skills', complete: Boolean(profile?.skills?.length) },
    { label: 'Projects', complete: Boolean(profile?.projects?.length) },
    { label: 'Experience', complete: Boolean(profile?.experience?.length) },
    { label: 'Resume & profile links', complete: Boolean(profile?.resumeUrl || profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl) },
  ];
  const completedSectionsCount = profileSections.filter((section) => section.complete).length;
  const profilePercentage = completedSectionsCount * 20;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const getCount = (section, count) => unavailable.includes(section) ? 'Unavailable' : count;

  const practiceCards = [
    { title: 'Practice tests', description: 'Strengthen your fundamentals with focused assessment practice.', href: '/student/practice', icon: BookOpen, detail: 'Practice at your own pace', action: 'Start practicing', accent: 'var(--app-blue)' },
    { title: 'Coding practice', description: 'Solve problems and build confidence for your next coding round.', href: '/student/problem-solving', icon: Code2, detail: unavailable.includes('coding') ? 'Problem count unavailable' : `${practiceStats.codingProblems} problems available`, action: 'Explore problems', accent: 'var(--app-blue)' },
    { title: 'AI interview', description: 'Rehearse your answers and get feedback before the real conversation.', href: '/student/ai-interview', icon: Sparkles, detail: unavailable.includes('interviews') ? 'Recent activity unavailable' : `${practiceStats.interviews} recent attempts`, action: 'Prepare for interviews', accent: 'var(--app-warning)' },
    { title: 'Versant practice', description: 'Work on your speaking, listening, and communication skills.', href: '/student/versant', icon: Mic, detail: unavailable.includes('versant') ? 'Recent activity unavailable' : `${practiceStats.versant} recent submissions`, action: 'Practice communication', accent: 'var(--app-success)' },
  ];

  // Derive the single most urgent assignment — in-progress first, then soonest due date.
  const nextUp = !unavailable.includes('assignments')
    ? assignedExams
        .map((assignment) => {
          const inProgress = assignment.attempt?.status === 'started';
          const completed = ['submitted', 'auto-submitted', 'evaluated'].includes(assignment.attempt?.status);
          const exhausted = assignment.attemptsRemaining != null && assignment.attemptsRemaining <= 0;
          return { ...assignment, inProgress, completed, exhausted, daysLeft: daysLeftFrom(assignment.endDate) };
        })
        .filter((assignment) => !assignment.completed && !assignment.exhausted)
        .sort((a, b) => {
          if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
          if (a.daysLeft == null) return 1;
          if (b.daysLeft == null) return -1;
          return a.daysLeft - b.daysLeft;
        })[0]
    : null;

  if (loading) {
    return (
      <div className="workspace-page student-dashboard">
        <div className="loading-panel" role="status">
          <div className="spinner-border text-primary mb-3" aria-hidden="true" />
          <h1 className="h5 fw-bold mb-2">Getting your workspace ready</h1>
          <p className="text-muted mb-0">Loading your assessments, practice, and progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page student-dashboard">
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
      <PageHeader
        className="dashboard-welcome"
        eyebrow="Your learning workspace"
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'Student'}.`}
        description="A little progress today. More confidence for what comes next."
        actions={(
          <Link to="/student/exams" className="btn btn-primary">
            <ClipboardList size={17} /> My assessments <ArrowRight size={16} />
          </Link>
        )}
      >
        <div className="small text-secondary d-flex align-items-center gap-2 mt-3">
          <CalendarDays size={15} aria-hidden="true" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </PageHeader>

      {unavailable.length > 0 && (
        <div className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center gap-3 mb-0" role="alert">
          <AlertCircle size={20} className="flex-shrink-0" aria-hidden="true" />
          <span className="small flex-grow-1">Some dashboard details could not be loaded. You can still open your assessments and practice tools.</span>
          <button type="button" className="btn btn-outline-secondary btn-sm flex-shrink-0" onClick={fetchDashboardData}><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {nextUp && (
        <section
          aria-labelledby="next-up-heading"
          className="student-next-up position-relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -60 }}
          />
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative">
            <div className="d-flex align-items-start gap-3">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)' }}
              >
                <Target size={22} />
              </span>
              <div>
                <div className="small text-uppercase-none" style={{ color: 'rgba(255,255,255,0.7)' }} id="next-up-heading">
                  {nextUp.inProgress ? 'Pick up where you left off' : 'Up next'}
                </div>
                <h2 className="h5 fw-bold mb-1 mt-1">{nextUp.title || nextUp.examId?.title || 'Faculty assessment'}</h2>
                <div className="d-flex flex-wrap align-items-center gap-3 small" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {(nextUp.duration || nextUp.examId?.duration) && (
                    <span className="d-inline-flex align-items-center gap-1">
                      <Clock size={14} /> {nextUp.duration || nextUp.examId?.duration} min
                    </span>
                  )}
                  <span className="d-inline-flex align-items-center gap-1">
                    <CalendarDays size={14} /> {daysLeftLabel(nextUp.daysLeft)}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to={
                (nextUp.examId?._id || (typeof nextUp.examId === 'string' ? nextUp.examId : null))
                  ? `/student/exam/${nextUp.examId?._id || nextUp.examId}/attempt`
                  : '/student/exams'
              }
              className="btn btn-light fw-semibold flex-shrink-0 align-self-start align-self-md-center"
            >
              {nextUp.inProgress ? 'Resume assessment' : 'Start assessment'} <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xxl-3"><StatCard icon={ClipboardList} label="Assigned assessments" value={getCount('assignments', assignedExams.length)} trend="From your faculty" /></div>
        <div className="col-12 col-sm-6 col-xxl-3"><StatCard icon={FileCheck} label="Completed assessments" value={getCount('results', results.length)} trend="Your evaluated attempts" /></div>
        <div className="col-12 col-sm-6 col-xxl-3"><StatCard icon={Code2} label="Coding problems" value={getCount('coding', practiceStats.codingProblems)} trend="Available to practice" /></div>
        <div className="col-12 col-sm-6 col-xxl-3"><StatCard icon={Sparkles} label="Recent interviews" value={getCount('interviews', practiceStats.interviews)} trend="Your recent practice attempts" /></div>
      </div>

      <section className="card" aria-labelledby="assigned-heading">
        <div className="card-body p-3 p-md-4">
          <div className="dashboard-section-heading d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <div className="section-label mb-2">On your schedule</div>
              <h2 id="assigned-heading" className="h5 fw-bold mb-1">Your assigned assessments</h2>
              <p className="text-muted small mb-0">Keep track of what your faculty has planned for you.</p>
            </div>
            <Link to="/student/exams" className="btn btn-outline-secondary btn-sm align-self-start align-self-sm-center">View all <ArrowRight size={15} /></Link>
          </div>
          {unavailable.includes('assignments') ? (
            <EmptyState icon={AlertCircle} title="Assessments are unavailable" description="We could not load your assigned assessments. Try refreshing your dashboard." actionLabel="Try again" onAction={fetchDashboardData} />
          ) : assignedExams.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Your schedule is clear" description="Assigned assessments will appear here when your faculty adds them. In the meantime, explore the practice tools below." />
          ) : (
            <div className="row g-3">
              {assignedExams.slice(0, 3).map((assignment) => {
                const examId = assignment.examId?._id || (typeof assignment.examId === 'string' ? assignment.examId : null);
                const inProgress = assignment.attempt?.status === 'started';
                const completed = ['submitted', 'auto-submitted', 'evaluated'].includes(assignment.attempt?.status);
                const exhausted = assignment.attemptsRemaining != null && assignment.attemptsRemaining <= 0;
                const duration = assignment.duration || assignment.examId?.duration;
                const daysLeft = daysLeftFrom(assignment.endDate);
                const urgentBorder = !completed && !exhausted && daysLeft != null && daysLeft <= 1 ? '#C0453B' : !completed && !exhausted && daysLeft != null && daysLeft <= 3 ? '#C8862E' : 'transparent';
                return (
                  <div key={assignment._id} className="col-12 col-lg-4">
                    <article className="mini-record-card d-flex flex-column h-100" style={{ borderLeft: `3px solid ${urgentBorder}` }}>
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <span className={`badge ${inProgress ? 'bg-warning' : completed ? 'bg-success' : 'bg-primary'}`}>{inProgress ? 'In progress' : completed ? 'Completed' : 'Assigned'}</span>
                        {duration && <span className="small text-muted d-inline-flex align-items-center gap-1"><Clock size={13} /> {duration} min</span>}
                      </div>
                      <h3 className="h6 fw-bold mb-2">{assignment.title || assignment.examId?.title || 'Faculty assessment'}</h3>
                      <p className="small text-muted mb-1">Available until {formatDate(assignment.endDate, 'date confirmed by faculty')}</p>
                      {!completed && !exhausted && (
                        <p className="small fw-semibold mb-3" style={{ color: urgentBorder !== 'transparent' ? urgentBorder : '#6C7686' }}>
                          {daysLeftLabel(daysLeft)}
                        </p>
                      )}
                      <Link to={examId && !exhausted ? `/student/exam/${examId}/attempt` : '/student/exams'} className={`btn ${exhausted ? 'btn-outline-secondary' : 'btn-primary'} btn-sm mt-auto`}>
                        {exhausted ? 'View assessment' : inProgress ? 'Resume assessment' : completed ? 'Retake assessment' : 'Start assessment'} <ArrowRight size={15} />
                      </Link>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="practice-heading">
        <div className="dashboard-section-heading d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
          <div>
            <div className="section-label mb-2">Build your confidence</div>
            <h2 id="practice-heading" className="h5 fw-bold mb-1">Make room for practice</h2>
            <p className="text-muted small mb-0">Choose a skill and take the next step.</p>
          </div>
          <Link to="/student/exams" className="btn btn-outline-secondary btn-sm align-self-start align-self-sm-center">
            Browse assessments {!unavailable.includes('exams') && <span className="badge bg-secondary">{exams.length}</span>} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="row g-3">
          {practiceCards.map(({ title, description, href, icon: Icon, detail, action, accent }) => (
            <div key={href} className="col-12 col-md-6 col-xxl-3">
              <Link to={href} className="card dashboard-practice-card h-100 text-decoration-none">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="icon-box" style={{ background: `color-mix(in srgb, ${accent} 12%, var(--app-surface))`, color: accent }}>
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <ArrowRight size={18} className="text-secondary" aria-hidden="true" />
                  </div>
                  <h3 className="h6 fw-bold text-body mb-2">{title}</h3>
                  <p className="small text-secondary mb-4">{description}</p>
                  <div className="small text-muted mt-auto mb-3">{detail}</div>
                  <span className="small fw-semibold" style={{ color: accent }}>{action}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <section className="card dashboard-results h-100" aria-labelledby="results-heading">
            <div className="card-body p-3 p-md-4">
              <div className="dashboard-section-heading d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div><div className="section-label mb-2">Your progress</div><h2 id="results-heading" className="h5 fw-bold mb-0">Recent results</h2></div>
                <Link to="/student/results" className="btn btn-outline-secondary btn-sm">All results <ArrowRight size={15} /></Link>
              </div>
              {unavailable.includes('results') ? (
                <EmptyState icon={AlertCircle} title="Results are unavailable" description="Your results could not be loaded. Refresh to try again." actionLabel="Try again" onAction={fetchDashboardData} />
              ) : results.length === 0 ? (
                <EmptyState icon={FileCheck} title="Your progress starts here" description="Once an assessment has been evaluated, your score and feedback will appear here." />
              ) : (
                <div className="vstack gap-3">
                  {results.slice(0, 4).map((result, index) => (
                    <Link key={result._id || index} to={result._id ? `/student/results/${result._id}` : '/student/results'} className="action-card text-decoration-none">
                      <span className="icon-box flex-shrink-0"><FileCheck size={20} aria-hidden="true" /></span>
                      <span className="min-width-0 flex-grow-1"><span className="d-block fw-semibold text-body">{result.examId?.title || `Assessment ${index + 1}`}</span><span className="d-block small text-muted mt-1">{formatDate(result.evaluatedAt, 'Evaluation date unavailable')}</span></span>
                      <span className={`badge flex-shrink-0 ${result.status === 'Pass' ? 'bg-success' : result.status === 'Fail' ? 'bg-danger' : 'bg-secondary'}`}>{result.percentage == null ? 'Pending' : `${Math.round(result.percentage)}%`}</span>
                      <ArrowRight size={16} className="text-muted flex-shrink-0" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="col-12 col-xl-5">
          <section className="card dashboard-profile h-100" aria-labelledby="profile-heading">
            <div className="card-body p-3 p-md-4">
              <div className="dashboard-section-heading d-flex justify-content-between align-items-start gap-3 mb-3">
                <div><div className="section-label mb-2">Make it yours</div><h2 id="profile-heading" className="h5 fw-bold mb-1">Your career profile</h2><p className="text-muted small mb-0">Bring your skills and experience together.</p></div>
                <span className="icon-box flex-shrink-0"><UserRound size={22} aria-hidden="true" /></span>
              </div>
              {unavailable.includes('profile') ? (
                <EmptyState icon={AlertCircle} title="Profile is unavailable" description="Refresh to load your saved details and resume." actionLabel="Try again" onAction={fetchDashboardData} />
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between small mt-4 mb-2"><span className="text-secondary">{completedSectionsCount} of 5 sections complete</span><strong style={{ color: 'var(--app-success)' }}>{profilePercentage}%</strong></div>
                  <div className="progress mb-4" role="progressbar" aria-label="Profile completion" aria-valuenow={profilePercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${profilePercentage}%`, backgroundColor: 'var(--app-success)' }} />
                  </div>
                  <ul className="list-unstyled vstack gap-3 mb-4">
                    {profileSections.map((section) => (
                      <li key={section.label} className="d-flex align-items-center gap-2 small">
                        {section.complete ? <CheckCircle2 size={17} style={{ color: 'var(--app-success)' }} aria-hidden="true" /> : <Circle size={17} className="text-muted" aria-hidden="true" />}
                        <span className={section.complete ? 'text-body' : 'text-secondary'}>{section.label}</span>
                        <span className="visually-hidden">{section.complete ? ': complete' : ': incomplete'}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex flex-wrap align-items-center gap-2 pt-3 border-top">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowProfileModal(true)}>{profilePercentage === 100 ? 'Edit profile' : 'Complete profile'} <ArrowRight size={15} /></button>
                    <ResumePdfGenerator user={user} profile={profile} />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
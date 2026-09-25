import '../../styles/faculty.css';
﻿import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BarChart3, BookOpen, CheckSquare, Code2, Eye, FileQuestion, Layers, Mail, PlusCircle, Users } from 'lucide-react';
import SendEmailModal from '../../components/SendEmailModal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const FACULTY_ACCENT = 'var(--app-primary)';

const FacultyDashboard = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    fetchFacultyOverview();
  }, []);

  const fetchFacultyOverview = async () => {
    try {
      setLoading(true);
      const [exRes, qRes, pRes, anaRes, grpRes] = await Promise.all([
        API.get('/exams'),
        API.get('/questions'),
        API.get('/coding'),
        API.get('/admin/analytics'),
        API.get('/groups'),
      ]);
      setExams(exRes.data.exams || []);
      setQuestions(qRes.data.questions || []);
      setProblems(pRes.data.problems || []);
      setAnalytics(anaRes.data.analytics);
      setGroups(grpRes.data.groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-page faculty-workspace">
        <div className="loading-panel">
          <div className="spinner-border text-primary mb-3" role="status" />
          <h5 className="fw-bold mb-1">Loading faculty dashboard</h5>
          <p className="text-muted mb-0">Preparing exams, groups, and question bank details.</p>
        </div>
      </div>
    );
  }

  const draftExams = exams.filter((exam) => exam.status !== 'published');

  const tools = [
    { to: '/faculty/questions', icon: FileQuestion, title: 'Question Bank', description: 'Manage MCQ questions.', accent: 'var(--app-primary)' },
    { to: '/faculty/coding', icon: Code2, title: 'Coding Problems', description: 'Create code assessments.', accent: 'var(--app-primary)' },
    { to: '/faculty/analytics', icon: BarChart3, title: 'Analytics', description: 'Track outcomes by group.', accent: 'var(--app-warning)' },
  ];

  return (
    <div className="workspace-page faculty-workspace">
      <PageHeader
        eyebrow="Faculty Workspace"
        title="Assessment Control Center"
        description="Create exams, manage question banks, assign batches, and monitor candidate performance."
        actions={(
          <>
            <button className="btn btn-outline-info" onClick={() => setShowEmailModal(true)}>
              <Mail size={16} /> Send Email
            </button>
            <Link to="/faculty/exam-assignments" className="btn btn-outline-primary">
              <CheckSquare size={16} /> Assign Exam
            </Link>
            <Link to="/faculty/exams/create" className="btn btn-primary">
              <PlusCircle size={16} /> Create Exam
            </Link>
          </>
        )}
      />

      {draftExams.length > 0 && (
        <section
          aria-labelledby="drafts-heading"
          className="rounded-4 p-4 text-white position-relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, #123C3D 0%, ${FACULTY_ACCENT} 60%, #3F9C8F 100%)` }}
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
                <AlertCircle size={22} />
              </span>
              <div>
                <div className="small" style={{ color: 'rgba(255,255,255,0.7)' }} id="drafts-heading">
                  Needs your review
                </div>
                <h2 className="h5 fw-bold mb-1 mt-1">
                  {draftExams.length} exam{draftExams.length > 1 ? 's' : ''} still in draft
                </h2>
                <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Students can't see these until you publish them.
                </p>
              </div>
            </div>
            <Link to="/faculty/exams" className="btn btn-light fw-semibold flex-shrink-0 align-self-start align-self-md-center">
              Review drafts <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={BookOpen} label="Exams Created" value={exams.length} trend="Drafts and published exams" />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={Layers} label="Managed Groups" value={groups.length} trend="Active college batches" />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={FileQuestion} label="MCQ Questions" value={questions.length} trend={`${problems.length} coding problems`} />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={Users} label="Candidate Attempts" value={analytics?.totalAttempts || 0} trend="Submitted assessments" trendType="positive" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                  <div className="section-label mb-2">Groups</div>
                  <h5 className="fw-bold mb-1">Managed batches</h5>
                  <p className="text-muted mb-0">Assign exams and review progress by group.</p>
                </div>
                <Link to="/admin/groups" className="btn btn-outline-primary btn-sm">
                  Manage Groups <ArrowRight size={15} />
                </Link>
              </div>

              {groups.length === 0 ? (
                <EmptyState title="No groups created" description="Create a group before assigning exams to students." />
              ) : (
                <div className="row g-3">
                  {groups.slice(0, 6).map((group) => (
                    <div key={group._id} className="col-12 col-md-6">
                      <div className="mini-record-card h-100">
                        <div className="d-flex justify-content-between gap-2 mb-3">
                          <span className="badge font-monospace" style={{ backgroundColor: FACULTY_ACCENT }}>{group.code}</span>
                          <span className="badge bg-secondary text-truncate">{group.college}</span>
                        </div>
                        <h6 className="fw-bold mb-1 text-truncate">{group.name}</h6>
                        <p className="text-muted small mb-3 text-truncate">{group.course} · {group.department} · Sem {group.semester}</p>
                        <div className="metric-row mb-3 py-2">
                          <span>Students</span>
                          <strong>{group.students?.length || 0}</strong>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <Link to={`/admin/groups/${group._id}`} className="btn btn-outline-info btn-sm flex-fill"><Eye size={14} /> View</Link>
                          <Link to="/faculty/exam-assignments" className="btn btn-sm flex-fill text-white" style={{ backgroundColor: FACULTY_ACCENT, borderColor: FACULTY_ACCENT }}><CheckSquare size={14} /> Assign</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="section-label mb-2">Tools</div>
              <h5 className="fw-bold mb-3">Build faster</h5>
              <div className="vstack gap-3">
                {tools.map(({ to, icon: Icon, title, description, accent }) => (
                  <Link key={to} to={to} className="action-card text-decoration-none">
                    <span className="icon-box" style={{ backgroundColor: `${accent}1A`, color: accent }}>
                      <Icon size={20} />
                    </span>
                    <span className="min-width-0">
                      <span className="fw-bold d-block text-body">{title}</span>
                      <span className="small text-muted">{description}</span>
                    </span>
                    <ArrowRight size={16} className="ms-auto text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <div className="section-label mb-2">Recent Exams</div>
              <h5 className="fw-bold mb-1">Managed exams</h5>
              <p className="text-muted mb-0">Latest assessments in this college workspace.</p>
            </div>
            <Link to="/faculty/exams" className="btn btn-outline-primary btn-sm">View All <ArrowRight size={15} /></Link>
          </div>

          {exams.length === 0 ? (
            <EmptyState title="No exams created yet" description="Create your first exam and assign it to a batch." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 5).map((exam) => (
                    <tr key={exam._id}>
                      <td><strong>{exam.title}</strong></td>
                      <td><span className="badge bg-secondary">{exam.category}</span></td>
                      <td>{exam.duration} mins</td>
                      <td>{exam.questions?.length || 0} MCQ / {exam.codingProblems?.length || 0} Code</td>
                      <td>
                        <span
                          className="badge text-white"
                          style={{ backgroundColor: exam.status === 'published' ? FACULTY_ACCENT : 'var(--app-warning)' }}
                        >
                          {exam.status}
                        </span>
                      </td>
                      <td className="text-end"><Link to="/faculty/exams" className="btn btn-outline-secondary btn-sm">Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <SendEmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </div>
  );
};

export default FacultyDashboard;
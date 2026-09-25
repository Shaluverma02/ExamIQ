import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, BarChart3, BookOpen, Building2, Shield, ShieldCheck, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const ADMIN_ACCENT = 'var(--app-blue)';

const actions = [
  {
    title: 'College Management',
    description: 'Create and manage college workspaces, registration visibility, and active institutions.',
    href: '/admin/colleges',
    icon: Building2,
    accent: '#2C4A9B',
  },
  {
    title: 'User Directory',
    description: 'Review students and faculty, update access, and inspect academic profiles.',
    href: '/admin/users',
    icon: Users,
    accent: '#2C7A7B',
  },
  {
    title: 'Audit Trail',
    description: 'Track security events, administrative actions, and platform activity.',
    href: '/admin/audit-logs',
    icon: ShieldCheck,
    accent: ADMIN_ACCENT,
  },
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const [uRes, aRes] = await Promise.all([API.get('/admin/users'), API.get('/admin/analytics')]);
      setUsers(uRes.data.users || []);
      setAnalytics(aRes.data.analytics);
    } catch (e) {
      console.error(e);
      setError('We could not load the platform overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-page">
        <div className="loading-panel">
          <div className="spinner-border text-primary mb-3" role="status" />
          <h5 className="fw-bold mb-1">Loading admin console</h5>
          <p className="text-muted mb-0">Preparing college, user, and assessment metrics.</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((user) => user.isActive !== false).length;
  const pendingUsersList = users.filter((user) => user.isEmailVerified === false || user.isActive === false);
  const pendingUsers = pendingUsersList.length;
  const passRate = Math.round(analytics?.passRate || 0);
  const avgScore = Math.round(analytics?.averageScore || 0);

  return (
    <div className="workspace-page management-page">
      <PageHeader
        icon={Shield}
        eyebrow="Admin Workspace"
        title="Platform overview"
        description="A clear view of your colleges, people, and assessment activity."
        actions={(
          <Link to="/admin/colleges" className="btn btn-primary">
            <Building2 size={16} /> Add College
          </Link>
        )}
      />

      {error && <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 flex-wrap" role="alert"><span>{error}</span><button className="btn btn-outline-danger btn-sm" onClick={fetchAdminOverview}>Try again</button></div>}

      {pendingUsers > 0 && (
        <section
          aria-labelledby="pending-heading"
          className="management-review"
        >
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 w-100">
            <div className="d-flex align-items-start gap-3">
              <span
                className="icon-box flex-shrink-0"
              >
                <AlertCircle size={22} />
              </span>
              <div>
                <div className="small text-warning" id="pending-heading">
                  Needs your review
                </div>
                <h2 className="h5 fw-bold mb-1 mt-1">
                  {pendingUsers} account{pendingUsers > 1 ? 's' : ''} pending verification or deactivated
                </h2>
                <p className="small mb-0">
                  These users may have limited or no access until reviewed.
                </p>
              </div>
            </div>
            <Link to="/admin/users" className="btn btn-light fw-semibold flex-shrink-0 align-self-start align-self-md-center">
              Review accounts <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={Users} label="Registered Students" value={analytics?.totalStudents || 0} trend={`${activeUsers} active users`} trendType="positive" />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={Shield} label="Faculty Members" value={analytics?.totalFaculty || 0} trend={`${pendingUsers} pending review`} />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={BookOpen} label="Total Exams" value={analytics?.totalExams || 0} trend="Across active college" />
        </div>
        <div className="col-12 col-sm-6 col-xxl-3">
          <StatCard icon={Activity} label="Evaluated Attempts" value={analytics?.totalAttempts || 0} trend="Submitted assessments" trendType="positive" />
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <div>
                  <div className="section-label mb-2">Operations</div>
                  <h5 className="fw-bold mb-1">Quick actions</h5>
                  <p className="text-muted small mb-0">Manage the essentials of your platform.</p>
                </div>
                <Link to="/admin/analytics" className="btn btn-outline-primary btn-sm">
                  <BarChart3 size={15} /> Analytics
                </Link>
              </div>

              <div className="row g-3">
                {actions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="col-12" key={item.href}>
                      <Link to={item.href} className="action-card text-decoration-none h-100">
                        <span className="icon-box">
                          <Icon size={22} />
                        </span>
                        <span className="min-width-0">
                          <span className="d-block fw-bold text-body mb-1">{item.title}</span>
                          <span className="d-block text-muted small">{item.description}</span>
                        </span>
                        <ArrowRight size={18} className="ms-auto text-muted" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="section-label mb-2">Health</div>
              <h5 className="fw-bold mb-3">Platform snapshot</h5>
              <div className="vstack gap-3">
                <div className="metric-row">
                  <span>Total users</span>
                  <strong>{users.length}</strong>
                </div>
                <div className="metric-row">
                  <span>Active accounts</span>
                  <strong>{activeUsers}</strong>
                </div>

                <div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-secondary">Pass rate</span>
                    <strong>{passRate}%</strong>
                  </div>
                  <div className="progress" style={{ height: 6 }} role="progressbar" aria-label="Pass rate" aria-valuenow={passRate} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${passRate}%`, backgroundColor: ADMIN_ACCENT }} />
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-secondary">Average score</span>
                    <strong>{avgScore}%</strong>
                  </div>
                  <div className="progress" style={{ height: 6 }} role="progressbar" aria-label="Average score" aria-valuenow={avgScore} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${avgScore}%`, backgroundColor: 'var(--app-info)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {users.length === 0 && (
        <EmptyState title="No users yet" description="Create or invite users to begin building the college workspace." actionLabel="Manage users" onAction={() => { window.location.href = '/admin/users'; }} />
      )}
    </div>
  );
};

export default AdminDashboard;

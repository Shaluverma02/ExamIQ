import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BarChart3, Users, BookOpen, Activity, TrendingUp,
  ShieldAlert, ShieldCheck, Download, Shield,
} from 'lucide-react';
import PlagiarismCheckerModal from '../../components/PlagiarismCheckerModal';
import ProctoringAuditModal from '../../components/ProctoringAuditModal';
import { downloadCSV } from '../../utils/exportCSV';
import { downloadResultsExcel } from '../../utils/downloadExcel';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, uRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/users'),
      ]);
      setAnalytics(aRes.data.analytics);
      setUsers(uRes.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    await downloadResultsExcel();
    setDownloadingExcel(false);
  };

  const handleExportCSV = async () => {
    try {
      const res = await API.get('/results');
      const results = res.data.results || [];
      if (!results.length) {
        toast.info('No results available to export');
        return;
      }
      const formatted = results.map((r) => ({
        'Student Name': r.studentId?.name || 'N/A',
        'Student Email': r.studentId?.email || 'N/A',
        'Exam Title': r.examId?.title || 'Assessment',
        'Category': r.examId?.category || 'General',
        'Total Score': r.totalScore,
        'Total Marks': r.totalMarks,
        'Percentage (%)': `${r.percentage}%`,
        'Pass/Fail': r.status,
        'Evaluated At': new Date(r.evaluatedAt).toLocaleString(),
      }));
      downloadCSV(formatted, `Admin_Platform_Report_${Date.now()}.csv`);
      toast.success('📥 Platform report exported!');
    } catch {
      toast.error('Failed to export report');
    }
  };

  if (loading || !analytics) {
    return <div className="text-center py-5 text-body">Loading platform analytics...</div>;
  }

  // User role breakdown
  const roleData = [
    { name: 'Students', value: analytics.totalStudents || 0, color: '#4f46e5' },
    { name: 'Faculty', value: analytics.totalFaculty || 0, color: '#f59e0b' },
  ];

  // Pass/Fail
  const passFailData = [
    { name: 'Pass', value: analytics.passCount || 0, color: '#10b981' },
    { name: 'Fail', value: analytics.failCount || 0, color: '#f43f5e' },
  ];

  // Bar chart for platform overview
  const barData = [
    { name: 'Students', count: analytics.totalStudents || 0 },
    { name: 'Faculty', count: analytics.totalFaculty || 0 },
    { name: 'Exams', count: analytics.totalExams || 0 },
    { name: 'Attempts', count: analytics.totalAttempts || 0 },
    { name: 'Passed', count: analytics.passCount || 0 },
  ];

  // Recent users (last 5)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="workspace-page management-page">
      {/* Header */}
      <PageHeader icon={BarChart3} eyebrow="Performance" title="Platform analytics" description="Understand participation, assessment outcomes, and platform activity." actions={(
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-success fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
          >
            {downloadingExcel ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={15} /> Download Excel
              </>
            )}
          </button>
          <button
            className="btn btn-outline-success fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
            onClick={handleExportCSV}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="btn btn-danger fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
            onClick={() => setShowPlagiarismModal(true)}
          >
            <ShieldAlert size={15} /> Plagiarism Report
          </button>
          <button
            className="btn btn-warning fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 text-dark"
            onClick={() => setShowAuditModal(true)}
          >
            <ShieldCheck size={15} /> Anti-Cheat Audit
          </button>
        </div>
      )} />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Registered Students', value: analytics.totalStudents || 0, icon: <Users size={22} />, color: 'primary' },
          { label: 'Faculty Members', value: analytics.totalFaculty || 0, icon: <Shield size={22} />, color: 'warning' },
          { label: 'Platform Exams', value: analytics.totalExams || 0, icon: <BookOpen size={22} />, color: 'info' },
          { label: 'Total Evaluations', value: analytics.totalAttempts || 0, icon: <Activity size={22} />, color: 'success' },
          { label: 'Pass Percentage', value: `${analytics.passPercentage || 0}%`, icon: <TrendingUp size={22} />, color: 'danger' },
          { label: 'Avg Score', value: `${analytics.averagePercentage || 0}%`, icon: <BarChart3 size={22} />, color: 'secondary' },
        ].map((card, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2">
            <div className="card p-3 text-center h-100">
              <div className={`text-${card.color} mb-2`}>{card.icon}</div>
              <h4 className="fw-bold text-body m-0">{card.value}</h4>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Platform Overview Bar */}
        <div className="col-12 col-lg-6">
          <div className="card p-4 h-100">
            <h6 className="fw-bold text-body mb-3">Platform Overview</h6>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Charts */}
        <div className="col-12 col-lg-6">
          <div className="row g-3 h-100">
            <div className="col-6">
              <div className="card p-3 h-100">
                <h6 className="fw-bold text-body mb-2 text-center small">User Roles</h6>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label>
                        {roleData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card p-3 h-100">
                <h6 className="fw-bold text-body mb-2 text-center small">Pass / Fail</h6>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={passFailData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label>
                        {passFailData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="card p-4">
        <h6 className="fw-bold text-body mb-3">Recently Registered Users</h6>
        {recentUsers.length === 0 ? (
          <p className="text-muted text-center py-3">No users registered yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0">
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="fw-semibold text-body">{u.name}</td>
                    <td className="text-muted small">{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'bg-danger' :
                        u.role === 'faculty' ? 'bg-warning text-dark' : 'bg-primary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <PlagiarismCheckerModal isOpen={showPlagiarismModal} onClose={() => setShowPlagiarismModal(false)} />
      <ProctoringAuditModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
    </div>
  );
};

export default AdminAnalytics;

import '../../styles/faculty.css';
﻿import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Download, ShieldAlert, ShieldCheck } from 'lucide-react';
import PlagiarismCheckerModal from '../../components/PlagiarismCheckerModal';
import ProctoringAuditModal from '../../components/ProctoringAuditModal';
import { downloadCSV } from '../../utils/exportCSV';
import { downloadResultsExcel } from '../../utils/downloadExcel';
import { toast } from 'react-toastify';

const FacultyAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [groupPerformance, setGroupPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, groupsRes, resultsRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/groups').catch(() => ({ data: { groups: [] } })),
        API.get('/results').catch(() => ({ data: { results: [] } })),
      ]);

      setAnalytics(analyticsRes.data.analytics);
      const results = resultsRes.data.results || [];
      const rows = (groupsRes.data.groups || []).map((group) => {
        const studentIds = new Set((group.students || []).map((student) => (typeof student === 'object' ? student._id : student)).filter(Boolean));
        const groupResults = results.filter((item) => studentIds.has(item.studentId?._id || item.studentId));
        const attempted = groupResults.length;
        const enrolled = studentIds.size;
        const passCount = groupResults.filter((item) => item.status === 'Pass').length;
        const average = attempted ? groupResults.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / attempted : 0;
        const passRate = attempted ? (passCount / attempted) * 100 : 0;
        return {
          id: group._id,
          name: group.name,
          department: group.department || '-',
          course: group.course || '-',
          enrolled,
          attempted,
          passRate: Math.round(passRate),
          average: Number(average.toFixed(1)),
        };
      });
      setGroupPerformance(rows);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load analytics');
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
        'Student Name': r.studentId ? r.studentId.name : 'N/A',
        'Student Email': r.studentId ? r.studentId.email : 'N/A',
        'Exam Title': r.examId ? r.examId.title : 'Assessment',
        Category: r.examId ? r.examId.category : 'General',
        'Total Score': r.totalScore,
        'Total Marks': r.totalMarks,
        'Percentage (%)': `${r.percentage}%`,
        'Objective Score': r.objectiveScore,
        'Coding Score': r.codingScore,
        'Pass/Fail Status': r.status,
        'Evaluated At': new Date(r.evaluatedAt).toLocaleString(),
      }));

      downloadCSV(formatted, `ExamiQ_Class_Marksheet_${Date.now()}.csv`);
      toast.success('Downloaded marksheet CSV spreadsheet');
    } catch (err) {
      toast.error('Failed to export CSV marksheet');
    }
  };

  if (loading || !analytics) {
    return <div className="text-center py-5 text-body">Loading performance analytics...</div>;
  }

  const pieData = [
    { name: 'Pass', value: analytics.passCount, color: '#10b981' },
    { name: 'Fail', value: analytics.failCount, color: '#f43f5e' },
  ];

  const barData = [
    { name: 'Total Students', count: analytics.totalStudents },
    { name: 'Total Attempts', count: analytics.totalAttempts },
    { name: 'Pass Count', count: analytics.passCount },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <BarChart3 className="text-primary" size={28} /> Faculty Assessment Analytics
          </h3>
          <p className="text-muted small m-0">Performance analytics across objective MCQs and programming challenges</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-success fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm" onClick={handleDownloadExcel} disabled={downloadingExcel}>
            {downloadingExcel ? <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Downloading...</> : <><Download size={16} /> Download Excel</>}
          </button>
          <button className="btn btn-outline-success fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-danger fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm" onClick={() => setShowPlagiarismModal(true)}>
            <ShieldAlert size={16} /> Code Plagiarism Report
          </button>
          <button className="btn btn-warning fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm text-dark" onClick={() => setShowAuditModal(true)}>
            <ShieldCheck size={16} /> Anti-Cheat Proctoring Audit
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6 col-lg-3"><div className="card p-4 text-center"><h2 className="fw-bold text-success m-0">{analytics.passPercentage}%</h2><span className="text-muted small">Overall Pass Percentage</span></div></div>
        <div className="col-12 col-md-6 col-lg-3"><div className="card p-4 text-center"><h2 className="fw-bold text-warning m-0">{analytics.averagePercentage}%</h2><span className="text-muted small">Average Student Score</span></div></div>
        <div className="col-12 col-md-6 col-lg-3"><div className="card p-4 text-center"><h2 className="fw-bold text-info m-0">{analytics.totalAttempts}</h2><span className="text-muted small">Total Exams Evaluated</span></div></div>
        <div className="col-12 col-md-6 col-lg-3"><div className="card p-4 text-center"><h2 className="fw-bold text-body m-0">{analytics.totalStudents}</h2><span className="text-muted small">Enrolled Candidates</span></div></div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card p-4">
            <h6 className="fw-bold text-body mb-3">Pass / Fail Ratio Distribution</h6>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card p-4">
            <h6 className="fw-bold text-body mb-3">Participation & Success Counts</h6>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h5 className="fw-bold text-body mb-3">Group Performance Matrix</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Batch / Group Name</th>
                <th>Department / Course</th>
                <th>Enrolled Candidates</th>
                <th>Evaluated Attempts</th>
                <th>Class Pass Rate</th>
                <th>Batch Average %</th>
                <th>Performance Status</th>
              </tr>
            </thead>
            <tbody>
              {groupPerformance.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-secondary py-4">No group performance data available yet.</td></tr>
              ) : groupPerformance.map((group) => {
                const status = group.average >= 75 ? 'High Performing' : group.average >= 50 ? 'On Track' : 'Needs Attention';
                const badge = group.average >= 75 ? 'bg-success' : group.average >= 50 ? 'bg-info text-dark' : 'bg-warning text-dark';
                return (
                  <tr key={group.id}>
                    <td className="fw-bold text-body">{group.name}</td>
                    <td><span className="badge bg-primary">{group.course} / {group.department}</span></td>
                    <td>{group.enrolled} Students</td>
                    <td>{group.attempted} Attempted</td>
                    <td><strong className="text-success">{group.passRate}%</strong></td>
                    <td><strong className="text-warning">{group.average}%</strong></td>
                    <td><span className={`badge ${badge}`}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PlagiarismCheckerModal isOpen={showPlagiarismModal} onClose={() => setShowPlagiarismModal(false)} />
      <ProctoringAuditModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
    </div>
  );
};

export default FacultyAnalytics;

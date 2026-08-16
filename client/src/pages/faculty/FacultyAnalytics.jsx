import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, CheckCircle, ShieldAlert, ShieldCheck, Download } from 'lucide-react';
import PlagiarismCheckerModal from '../../components/PlagiarismCheckerModal';
import ProctoringAuditModal from '../../components/ProctoringAuditModal';
import { downloadCSV } from '../../utils/exportCSV';
import { downloadResultsExcel } from '../../utils/downloadExcel';
import { toast } from 'react-toastify';

const FacultyAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Modals state
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/analytics');
      setAnalytics(res.data.analytics);
    } catch (e) {
      console.error(e);
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
        'Category': r.examId ? r.examId.category : 'General',
        'Total Score': r.totalScore,
        'Total Marks': r.totalMarks,
        'Percentage (%)': `${r.percentage}%`,
        'Objective Score': r.objectiveScore,
        'Coding Score': r.codingScore,
        'Pass/Fail Status': r.status,
        'Evaluated At': new Date(r.evaluatedAt).toLocaleString(),
      }));

      downloadCSV(formatted, `ExamiQ_Class_Marksheet_${Date.now()}.csv`);
      toast.success('📥 Downloaded Marksheet CSV spreadsheet!');
    } catch (err) {
      toast.error('Failed to export CSV marksheet');
    }
  };

  if (loading || !analytics) {
    return <div className="text-center py-5 text-light">Loading performance analytics...</div>;
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
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <BarChart3 className="text-primary" size={28} /> Faculty Assessment Analytics
          </h3>
          <p className="text-muted small m-0">Performance analytics across objective MCQs & programming challenges</p>
        </div>

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
                <Download size={16} /> Download Excel
              </>
            )}
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
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 text-center">
            <h2 className="fw-extrabold text-success m-0">{analytics.passPercentage}%</h2>
            <span className="text-muted small">Overall Pass Percentage</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 text-center">
            <h2 className="fw-extrabold text-warning m-0">{analytics.averagePercentage}%</h2>
            <span className="text-muted small">Average Student Score</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 text-center">
            <h2 className="fw-extrabold text-info m-0">{analytics.totalAttempts}</h2>
            <span className="text-muted small">Total Exams Evaluated</span>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 text-center">
            <h2 className="fw-extrabold text-light m-0">{analytics.totalStudents}</h2>
            <span className="text-muted small">Enrolled Candidates</span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="glass-card p-4">
            <h6 className="fw-bold text-light mb-3">Pass / Fail Ratio Distribution</h6>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="glass-card p-4">
            <h6 className="fw-bold text-light mb-3">Participation & Success Counts</h6>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Item Difficulty & Discrimination Index Analysis Table */}
      <div className="glass-card p-4 mb-4 border border-secondary">
        <h6 className="fw-bold text-light mb-3 d-flex align-items-center gap-2">
          <TrendingUp size={18} className="text-warning" /> Item Difficulty & Discrimination Index Analysis
        </h6>
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Question Item</th>
                <th>Topic</th>
                <th>Target Difficulty</th>
                <th>Class Accuracy %</th>
                <th>Discrimination Index</th>
                <th>Quality Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-semibold text-light">What is the worst-case time complexity of QuickSort?</td>
                <td><span className="badge bg-secondary">Algorithms</span></td>
                <td><span className="badge bg-warning text-dark">Medium</span></td>
                <td><strong className="text-success">84%</strong></td>
                <td className="font-monospace text-info">+0.42</td>
                <td><span className="badge bg-success">High Discrimination</span></td>
              </tr>
              <tr>
                <td className="fw-semibold text-light">Explain the difference between process and thread in OS.</td>
                <td><span className="badge bg-secondary">Operating Systems</span></td>
                <td><span className="badge bg-danger">Hard</span></td>
                <td><strong className="text-warning">48%</strong></td>
                <td className="font-monospace text-info">+0.38</td>
                <td><span className="badge bg-success">Optimal Quality</span></td>
              </tr>
              <tr>
                <td className="fw-semibold text-light">Which data structure operates on LIFO principle?</td>
                <td><span className="badge bg-secondary">Data Structures</span></td>
                <td><span className="badge bg-success">Easy</span></td>
                <td><strong className="text-success">96%</strong></td>
                <td className="font-monospace text-muted">+0.15</td>
                <td><span className="badge bg-info">Easy Baseline</span></td>
              </tr>
              <tr>
                <td className="fw-semibold text-light">Implement a function to detect cycle in a Directed Graph.</td>
                <td><span className="badge bg-secondary">Graphs</span></td>
                <td><span className="badge bg-danger">Hard</span></td>
                <td><strong className="text-danger">22%</strong></td>
                <td className="font-monospace text-danger">+0.08</td>
                <td><span className="badge bg-warning text-dark">Requires Review</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch-wise Gradebook & Department Performance Comparison Matrix */}
      <div className="glass-card p-4 border border-secondary">
        <h6 className="fw-bold text-light mb-3 d-flex align-items-center gap-2">
          <Users size={18} className="text-info" /> Batch & Department Gradebook Comparison Matrix
        </h6>
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
              <tr>
                <td className="fw-bold text-light">BCA 2026 Batch A</td>
                <td><span className="badge bg-primary">BCA / Computer Science</span></td>
                <td>48 Students</td>
                <td>44 Attempted</td>
                <td><strong className="text-success">92%</strong></td>
                <td><strong className="text-warning">78.5%</strong></td>
                <td><span className="badge bg-success">High Performing</span></td>
              </tr>
              <tr>
                <td className="fw-bold text-light">B.Tech CSE Section B</td>
                <td><span className="badge bg-info text-dark">B.Tech / CSE</span></td>
                <td>60 Students</td>
                <td>58 Attempted</td>
                <td><strong className="text-success">86%</strong></td>
                <td><strong className="text-warning">74.2%</strong></td>
                <td><span className="badge bg-success">Optimal</span></td>
              </tr>
              <tr>
                <td className="fw-bold text-light">MCA Semester 2</td>
                <td><span className="badge bg-secondary">MCA / IT</span></td>
                <td>35 Students</td>
                <td>30 Attempted</td>
                <td><strong className="text-warning">68%</strong></td>
                <td><strong className="text-info">62.0%</strong></td>
                <td><span className="badge bg-warning text-dark">Needs Intervention</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PlagiarismCheckerModal
        isOpen={showPlagiarismModal}
        onClose={() => setShowPlagiarismModal(false)}
      />

      <ProctoringAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};

export default FacultyAnalytics;

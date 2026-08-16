import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  Users,
  Building,
  BookOpen,
  Trophy,
  ArrowLeft,
  Calendar,
  FileCheck,
  CheckCircle2,
  XCircle,
  BarChart3,
  Award,
  Download,
} from 'lucide-react';
import { downloadResultsExcel } from '../../utils/downloadExcel';

const GroupDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'students' | 'exams' | 'results'

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/groups/${id}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGroupExcel = async () => {
    setDownloadingExcel(true);
    await downloadResultsExcel({ groupId: id });
    setDownloadingExcel(false);
  };

  const handleExportGroupCsv = () => {
    if (!data || !data.results || data.results.length === 0) {
      toast.warning('No results available to export for this group');
      return;
    }

    let csv = 'Student Name,Student Email,Exam Title,Score,Total Marks,Percentage,Status,Date\n';
    data.results.forEach((r) => {
      csv += `"${r.studentId?.name || ''}","${r.studentId?.email || ''}","${r.examId?.title || ''}",${r.totalScore},${r.totalMarks},${r.percentage}%,${r.status},"${new Date(r.createdAt).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group_report_${data.group.code}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Group Performance CSV Report downloaded!');
  };

  if (loading) {
    return <div className="text-center py-5 text-muted">Loading group details...</div>;
  }

  if (!data || !data.group) {
    return (
      <div className="glass-card text-center py-5 text-muted">
        <h4>Group Not Found</h4>
        <Link to="/admin/groups" className="btn btn-outline-primary btn-sm rounded-pill mt-3">
          Back to Groups
        </Link>
      </div>
    );
  }

  const { group, assignedExams = [], stats = {}, results = [] } = data;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <Link to="/admin/groups" className="text-primary text-decoration-none small d-flex align-items-center gap-1 mb-2">
            <ArrowLeft size={16} /> Back to All Groups
          </Link>

          <div className="d-flex align-items-center gap-3">
            <h3 className="fw-extrabold text-light m-0">{group.name}</h3>
            <span className="badge bg-primary font-monospace fs-6 px-3 py-1">{group.code}</span>
            <span className={`badge ${group.isActive ? 'bg-success' : 'bg-secondary'}`}>
              {group.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="text-muted small mt-1 d-flex flex-wrap align-items-center gap-3">
            <span><Building size={14} className="me-1 text-info" />{group.college}</span>
            <span>Course: <strong>{group.course}</strong></span>
            <span>Dept: <strong>{group.department}</strong></span>
            <span>Sem: <strong>{group.semester}</strong></span>
            <span>Sec: <strong>{group.section}</strong></span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-success fw-bold btn-sm px-3 rounded-pill d-flex align-items-center gap-2 shadow-sm"
            onClick={handleDownloadGroupExcel}
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

          <button
            type="button"
            className="btn btn-outline-success fw-bold btn-sm px-3 rounded-pill d-flex align-items-center gap-2"
            onClick={handleExportGroupCsv}
          >
            <Download size={16} /> Export CSV
          </button>

          <Link
            to="/faculty/exam-assignments"
            className="btn btn-primary fw-bold btn-sm px-4 rounded-pill d-flex align-items-center gap-2 shadow-sm"
          >
            <BookOpen size={16} /> Assign Exam To Group
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-20 rounded-3 text-primary">
              <Users size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{stats.totalStudents || 0}</h3>
              <span className="text-muted small">Enrolled Students</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-info bg-opacity-20 rounded-3 text-info">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{stats.totalExamsAssigned || 0}</h3>
              <span className="text-muted small">Assigned Exams</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-20 rounded-3 text-warning">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{stats.averageScore || 0}%</h3>
              <span className="text-muted small">Average Pass Score</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-20 rounded-3 text-success">
              <FileCheck size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{stats.passCount || 0} / {stats.totalAttempts || 0}</h3>
              <span className="text-muted small">Passed Attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <ul className="nav nav-tabs border-secondary mb-4">
        <li className="nav-item">
          <button
            className={`nav-link text-light fw-bold ${activeTab === 'info' ? 'active bg-primary border-primary text-white' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Group Information
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link text-light fw-bold ${activeTab === 'students' ? 'active bg-primary border-primary text-white' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Enrolled Students ({group.students?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link text-light fw-bold ${activeTab === 'exams' ? 'active bg-primary border-primary text-white' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            Assigned Exams ({assignedExams.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link text-light fw-bold ${activeTab === 'results' ? 'active bg-primary border-primary text-white' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Exam Results ({results.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: Group Information */}
      {activeTab === 'info' && (
        <div className="glass-card p-4">
          <h5 className="fw-bold text-light mb-3">Group Details & Attributes</h5>
          <div className="row g-3 small">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Group Name:</div>
                <div className="fw-bold fs-6 text-light">{group.name}</div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Group Code:</div>
                <div className="fw-bold fs-6 text-primary font-monospace">{group.code}</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">College / Institution:</div>
                <div className="fw-bold text-light">{group.college}</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Course & Department:</div>
                <div className="fw-bold text-light">{group.course} ({group.department})</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Semester & Section:</div>
                <div className="fw-bold text-light">Sem {group.semester} · Sec {group.section}</div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Academic Year:</div>
                <div className="fw-bold text-light">{group.academicYear}</div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Created By:</div>
                <div className="fw-bold text-light">{group.createdBy?.name || 'Administrator'} ({group.createdBy?.email || ''})</div>
              </div>
            </div>

            <div className="col-12">
              <div className="p-3 rounded-3 bg-dark border border-secondary">
                <div className="text-muted mb-1">Description / Notes:</div>
                <div className="text-light">{group.description || 'No description provided.'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enrolled Students */}
      {activeTab === 'students' && (
        <div className="glass-card p-4">
          <h5 className="fw-bold text-light mb-3">Enrolled Student Roster</h5>
          {(!group.students || group.students.length === 0) ? (
            <div className="text-center py-4 text-muted">No students currently assigned to this group.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle m-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((st, idx) => (
                    <tr key={st._id}>
                      <td>{idx + 1}</td>
                      <td><strong className="text-light">{st.name}</strong></td>
                      <td>
                        <span className="badge bg-secondary font-monospace">
                          {st.profile?.rollNumber || 'Not assigned'}
                        </span>
                      </td>
                      <td className="text-muted small">{st.email}</td>
                      <td className="text-muted small">{st.phone || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assigned Exams */}
      {activeTab === 'exams' && (
        <div className="glass-card p-4">
          <h5 className="fw-bold text-light mb-3">Exams Assigned to Group</h5>
          {assignedExams.length === 0 ? (
            <div className="text-center py-4 text-muted">No active exams assigned to this group yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle m-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Exam Title</th>
                    <th>Schedule Window</th>
                    <th>Duration</th>
                    <th>Attempts</th>
                    <th>Assigned By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedExams.map((as) => (
                    <tr key={as._id}>
                      <td><strong className="text-light">{as.title || as.examId?.title}</strong></td>
                      <td className="small text-muted">
                        {new Date(as.startDate).toLocaleDateString()} – {new Date(as.endDate).toLocaleDateString()}
                      </td>
                      <td>{as.duration} mins</td>
                      <td>{as.attemptsAllowed} attempt(s)</td>
                      <td className="small text-muted">{as.facultyId?.name}</td>
                      <td>
                        <span className={`badge ${as.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                          {as.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Results & Performance Analytics */}
      {activeTab === 'results' && (
        <div className="glass-card p-4">
          <h5 className="fw-bold text-light mb-3">Group Exam Performance Results</h5>
          {results.length === 0 ? (
            <div className="text-center py-4 text-muted">No submission results evaluated for this group yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle m-0">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Score / Total</th>
                    <th>Percentage</th>
                    <th>Result Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id}>
                      <td><strong className="text-light">{r.studentId?.name}</strong></td>
                      <td>{r.examId?.title}</td>
                      <td>{r.totalScore} / {r.totalMarks}</td>
                      <td className="fw-bold text-info">{r.percentage}%</td>
                      <td>
                        <span className={`badge ${r.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDetails;

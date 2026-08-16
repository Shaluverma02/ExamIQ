import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  Award,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Trash2,
  Layers,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  HelpCircle,
  Code2,
} from 'lucide-react';
import StudentAttemptsModal from '../../components/StudentAttemptsModal';
import DeleteAttemptModal from '../../components/DeleteAttemptModal';

const FacultyAssessmentResults = () => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [studentMatrix, setStudentMatrix] = useState([]);
  const [rawResults, setRawResults] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');

  // Modals state
  const [attemptsModalOpen, setAttemptsModalOpen] = useState(false);
  const [targetStudentForAttempts, setTargetStudentForAttempts] = useState(null);
  const [studentAttemptsList, setStudentAttemptsList] = useState([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetAttemptToDelete, setTargetAttemptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Result View Modal state
  const [viewResultModalOpen, setViewResultModalOpen] = useState(false);
  const [viewingResultDoc, setViewingResultDoc] = useState(null);

  useEffect(() => {
    fetchAssessmentsList();
  }, []);

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchAssessmentResultsAndStats(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  const fetchAssessmentsList = async () => {
    try {
      const res = await API.get('/exams');
      const examsList = res.data.exams || res.data;
      setAssessments(examsList);
      if (examsList.length > 0) {
        setSelectedAssessmentId(examsList[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load assessments');
    }
  };

  const fetchAssessmentResultsAndStats = async (examId) => {
    try {
      setLoading(true);
      const [resResults, resStats] = await Promise.all([
        API.get(`/assessments/${examId}/results`),
        API.get(`/assessments/${examId}/result-statistics`).catch(() => null),
      ]);

      setRawResults(resResults.data.results || []);
      setStudentMatrix(resResults.data.studentMatrix || []);

      const foundExam = assessments.find((a) => a._id.toString() === examId.toString());
      if (foundExam) setSelectedAssessment(foundExam);

      if (resStats && resStats.data?.statistics) {
        setStats(resStats.data.statistics);
      } else {
        // Fallback stats calculation
        const resultsList = resResults.data.results || [];
        const scores = resultsList.map((r) => r.totalScore || 0);
        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
        setStats({
          assessmentTitle: foundExam?.title || 'Assessment',
          totalAssigned: resultsList.length,
          totalAttempted: resultsList.length,
          notAttemptedCount: 0,
          totalAttempts: resultsList.length,
          averageScore: Number(avg),
          highestScore: scores.length > 0 ? Math.max(...scores) : 0,
          lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
          passCount: resultsList.filter((r) => r.status === 'Pass').length,
          failCount: resultsList.filter((r) => r.status === 'Fail').length,
        });
      }
    } catch (err) {
      toast.error('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  // Open Student Attempts Modal
  const handleOpenAttemptsModal = async (studentRow) => {
    setTargetStudentForAttempts(studentRow);
    try {
      const res = await API.get(`/assessments/${selectedAssessmentId}/students/${studentRow.studentId._id || studentRow.studentId}/attempts`);
      setStudentAttemptsList(res.data.attempts || []);
      setAttemptsModalOpen(true);
    } catch (err) {
      toast.error('Failed to fetch student attempts history');
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (attemptItem, studentRow = null) => {
    const studentName = studentRow ? studentRow.studentName : (targetStudentForAttempts ? targetStudentForAttempts.studentName : 'Student');
    const examTitle = selectedAssessment?.title || 'Assessment';

    setTargetAttemptToDelete({
      attemptId: attemptItem.attemptId || attemptItem._id,
      assessmentTitle: examTitle,
      studentName: studentName,
      attemptNumber: attemptItem.attemptNumber || 1,
      score: attemptItem.score || attemptItem.totalScore || 0,
      percentage: attemptItem.percentage || 0,
      date: attemptItem.submittedAt || attemptItem.createdAt,
    });
    setDeleteModalOpen(true);
  };

  // Confirm Delete Attempt
  const handleConfirmDelete = async () => {
    if (!targetAttemptToDelete) return;
    try {
      setIsDeleting(true);
      await API.delete(`/assessments/${selectedAssessmentId}/attempts/${targetAttemptToDelete.attemptId}`);
      toast.success('Attempt result permanently deleted!');
      setDeleteModalOpen(false);

      // Refresh list
      fetchAssessmentResultsAndStats(selectedAssessmentId);

      // Update active attempts modal list if open
      if (attemptsModalOpen && targetStudentForAttempts) {
        const res = await API.get(`/assessments/${selectedAssessmentId}/students/${targetStudentForAttempts.studentId._id || targetStudentForAttempts.studentId}/attempts`);
        setStudentAttemptsList(res.data.attempts || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete attempt result');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Detailed Result View
  const handleViewResultDetail = async (resultOrAttempt) => {
    try {
      const resultId = resultOrAttempt.resultId || resultOrAttempt._id || resultOrAttempt.attemptId;
      const res = await API.get(`/results/${resultId}`);
      setViewingResultDoc(res.data.result || res.data);
      setViewResultModalOpen(true);
    } catch (err) {
      toast.error('Failed to load result details');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!selectedAssessmentId) return;
    window.open(`${API.defaults.baseURL}/assessments/${selectedAssessmentId}/export/excel`, '_blank');
    toast.info('Downloading Excel Results report...');
  };

  // Filtered Student Matrix
  const filteredStudents = studentMatrix.filter((st) => {
    const matchesSearch =
      st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || st.latestStatus.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'BEST_SCORE') return b.bestScore - a.bestScore;
    if (sortBy === 'LATEST_SCORE') return b.latestScore - a.latestScore;
    return new Date(b.latestSubmittedAt) - new Date(a.latestSubmittedAt);
  });

  return (
    <div className="container-fluid py-4 min-vh-100 bg-dark text-light">
      {/* Top Header & Assessment Selection Bar */}
      <div className="glass-card p-4 rounded-4 border border-secondary mb-4 shadow-lg">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
              <Award className="text-primary" size={28} /> Faculty Assessment Results Manager
            </h3>
            <p className="text-secondary small m-0 mt-1">
              Select an assessment to view student multi-attempt performances, best vs latest scores, and manage attempt records.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select bg-dark text-light border-primary font-monospace fw-bold"
              style={{ minWidth: 260 }}
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
            >
              {assessments.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title} ({ex.category || 'General'})
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline-success font-monospace fw-bold d-flex align-items-center gap-2 rounded-pill px-3"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 bg-dark border border-secondary rounded-4 shadow-sm h-100">
              <div className="text-secondary small font-monospace">Assigned Students</div>
              <h3 className="fw-extrabold text-info m-0 mt-1">{stats.totalAssigned}</h3>
              <div className="extra-small text-muted mt-1">
                Attempted: <strong className="text-light">{stats.totalAttempted}</strong> | Pending: <strong className="text-warning">{stats.notAttemptedCount}</strong>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 bg-dark border border-secondary rounded-4 shadow-sm h-100">
              <div className="text-secondary small font-monospace">Total Attempts</div>
              <h3 className="fw-extrabold text-primary m-0 mt-1">{stats.totalAttempts}</h3>
              <div className="extra-small text-muted mt-1">Total attempt submissions logged</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 bg-dark border border-secondary rounded-4 shadow-sm h-100">
              <div className="text-secondary small font-monospace">Average Score</div>
              <h3 className="fw-extrabold text-success m-0 mt-1">{stats.averageScore} pts</h3>
              <div className="extra-small text-muted mt-1">
                High: <strong className="text-success">{stats.highestScore}</strong> | Low: <strong className="text-danger">{stats.lowestScore}</strong>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="p-3 bg-dark border border-secondary rounded-4 shadow-sm h-100">
              <div className="text-secondary small font-monospace">Pass / Fail Ratio</div>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className="badge bg-success fs-6 px-3">{stats.passCount} Pass</span>
                <span className="badge bg-danger fs-6 px-3">{stats.failCount} Fail</span>
              </div>
              <div className="extra-small text-muted mt-2">Overall cohort performance</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filtering Toolbar */}
      <div className="glass-card p-3 rounded-4 border border-secondary mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary font-monospace"
                placeholder="Search Student by name, email or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary font-monospace"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PASS">Pass Only</option>
              <option value="FAIL">Fail Only</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary font-monospace"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="LATEST">Sort by Latest Date</option>
              <option value="BEST_SCORE">Sort by Best Score (High to Low)</option>
              <option value="LATEST_SCORE">Sort by Latest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Results Matrix Table */}
      <div className="glass-card rounded-4 border border-secondary shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" />
            <div className="text-secondary small">Loading Assessment Matrix...</div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Users size={40} className="mb-2 opacity-50" />
            <p className="mb-0">No student assessment records match your search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0 font-monospace">
              <thead className="table-secondary text-uppercase extra-small border-bottom border-secondary">
                <tr>
                  <th className="py-3 px-3">Student Info</th>
                  <th className="py-3 px-2">Roll No</th>
                  <th className="py-3 px-2 text-center">Attempts</th>
                  <th className="py-3 px-2 text-center text-success">Best Score</th>
                  <th className="py-3 px-2 text-center text-info">Latest Score</th>
                  <th className="py-3 px-2 text-center">%</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2">Submitted</th>
                  <th className="py-3 px-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const latestResult = st.attempts[0];
                  return (
                    <tr key={st.studentId._id || st.studentId}>
                      <td className="py-3 px-3">
                        <div className="fw-bold text-light">{st.studentName}</div>
                        <div className="extra-small text-muted">{st.email}</div>
                      </td>
                      <td className="py-3 px-2 small text-secondary">{st.rollNumber}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="badge bg-primary px-2.5 py-1 fs-6">{st.attemptCount}</span>
                      </td>
                      <td className="py-3 px-2 text-center fw-bold text-success fs-6">{st.bestScore} pts</td>
                      <td className="py-3 px-2 text-center fw-bold text-info fs-6">{st.latestScore} pts</td>
                      <td className="py-3 px-2 text-center font-bold">{st.latestPercentage}%</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`badge ${st.latestStatus === 'Pass' ? 'bg-success' : 'bg-danger'} px-2.5 py-1`}>
                          {st.latestStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 extra-small text-muted">
                        {st.latestSubmittedAt ? new Date(st.latestSubmittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm rounded-pill px-2.5 py-1 extra-small fw-bold"
                            onClick={() => handleViewResultDetail(latestResult)}
                            title="View Full Result Detail"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-1 extra-small fw-bold"
                            onClick={() => handleOpenAttemptsModal(st)}
                            title="View Attempt History"
                          >
                            <Layers size={13} /> Attempts
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-1 extra-small fw-bold"
                            onClick={() => handleOpenDeleteModal(latestResult, st)}
                            title="Delete Attempt Result"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Attempts Modal */}
      <StudentAttemptsModal
        isOpen={attemptsModalOpen}
        onClose={() => setAttemptsModalOpen(false)}
        assessmentTitle={selectedAssessment?.title || 'Assessment'}
        studentName={targetStudentForAttempts?.studentName || 'Student'}
        attemptsList={studentAttemptsList}
        onViewAttempt={handleViewResultDetail}
        onDeleteAttempt={(att) => handleOpenDeleteModal(att)}
      />

      {/* Delete Confirmation Modal */}
      {targetAttemptToDelete && (
        <DeleteAttemptModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          assessmentTitle={targetAttemptToDelete.assessmentTitle}
          studentName={targetAttemptToDelete.studentName}
          attemptNumber={targetAttemptToDelete.attemptNumber}
          score={targetAttemptToDelete.score}
          percentage={targetAttemptToDelete.percentage}
          date={targetAttemptToDelete.date}
          loading={isDeleting}
        />
      )}

      {/* Single Result Viewer Modal */}
      {viewResultModalOpen && viewingResultDoc && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 2060, backdropFilter: 'blur(8px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content text-light border border-secondary shadow-lg rounded-4 bg-dark">
              <div className="modal-header border-bottom border-secondary px-4 pt-4 pb-3">
                <h5 className="modal-title text-info fw-bold font-monospace">
                  Detailed Result Breakdown - Attempt #{viewingResultDoc.attemptNumber || 1}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewResultModalOpen(false)} />
              </div>
              <div className="modal-body px-4 py-3 font-monospace" style={{ maxHeight: 460, overflowY: 'auto' }}>
                <div className="p-3 bg-black rounded-3 border border-secondary mb-3">
                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted">Student:</span> <strong className="text-light">{viewingResultDoc.studentId?.name}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Assessment:</span> <strong className="text-info">{viewingResultDoc.examId?.title}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Score:</span> <strong className="text-success">{viewingResultDoc.totalScore} / {viewingResultDoc.totalMarks}</strong> ({viewingResultDoc.percentage}%)
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Status:</span> <span className={`badge ${viewingResultDoc.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>{viewingResultDoc.status}</span>
                    </div>
                  </div>
                </div>

                <div className="small text-muted mb-2">Question Breakdown:</div>
                <div className="p-3 bg-black rounded-3 border border-secondary small">
                  <div>Correct Answers: <strong className="text-success">{viewingResultDoc.correctAnswers || 0}</strong></div>
                  <div>Wrong Answers: <strong className="text-danger">{viewingResultDoc.wrongAnswers || 0}</strong></div>
                  <div>Skipped Questions: <strong className="text-warning">{viewingResultDoc.skippedAnswers || 0}</strong></div>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary px-4 py-3">
                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setViewResultModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAssessmentResults;

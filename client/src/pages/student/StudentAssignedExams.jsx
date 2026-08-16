import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examAssignmentAPI } from '../../services/api';
import {
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
} from 'lucide-react';
import PrintableQuestionPaperModal from '../../components/PrintableQuestionPaperModal';

const StudentAssignedExams = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State for Printable Question Paper PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfExamId, setSelectedPdfExamId] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await examAssignmentAPI.getStudentAssignments();
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignments.filter((a) => {
    const title = a.title || a.examId?.title || '';
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusInfo = (assignment) => {
    if (assignment.attemptsRemaining <= 0) {
      return { label: 'Attempts Exhausted', className: 'bg-danger' };
    }
    if (assignment.attempt?.status === 'started') {
      return { label: 'In Progress', className: 'bg-warning text-dark' };
    }
    if (['submitted', 'auto-submitted', 'evaluated'].includes(assignment.attempt?.status)) {
      return { label: 'Completed', className: 'bg-success' };
    }
    return { label: 'Available', className: 'bg-primary' };
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0">Assigned Exams</h3>
          <p className="text-muted small m-0">
            Exams assigned to you by faculty — only these can be attempted
          </p>
        </div>

        <div className="position-relative" style={{ width: 280 }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control bg-secondary text-light border-0 ps-5"
            placeholder="Search assigned exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading assigned exams...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-5 text-center text-muted">
          <AlertCircle size={40} className="mb-3 opacity-50" />
          <h5 className="text-light">No assigned exams</h5>
          <p className="small mb-0">
            Your faculty has not assigned any exams to your batch yet.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((assignment) => {
            const exam = assignment.examId;
            const statusInfo = getStatusInfo(assignment);
            const canAttempt = assignment.attemptsRemaining > 0;
            const isInProgress = assignment.attempt?.status === 'started';

            return (
              <div key={assignment._id} className="col-12 col-md-6 col-lg-4">
                <div className="glass-card p-4 h-100 d-flex flex-column border border-secondary">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                    <span className="text-muted small d-flex align-items-center gap-1">
                      <Clock size={14} />
                      {assignment.duration || exam?.duration} mins
                    </span>
                  </div>

                  <h5 className="fw-bold text-light mb-1">
                    {assignment.title || exam?.title}
                  </h5>

                  <p className="text-secondary small mb-2">
                    {exam?.description || 'Faculty-assigned assessment'}
                  </p>

                  <div className="small text-muted mb-3">
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <Calendar size={13} />
                      Until {new Date(assignment.endDate).toLocaleDateString()}
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <BookOpen size={13} />
                      {exam?.questions?.length || 0} MCQ · {exam?.codingProblems?.length || 0} Coding
                    </div>
                  </div>

                  {assignment.groupIds?.length > 0 && (
                    <div className="mb-3 d-flex flex-wrap gap-1">
                      {assignment.groupIds.map((g) => (
                        <span key={g._id} className="badge bg-secondary small">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center small text-muted mb-3 border-top border-bottom border-secondary py-2">
                    <span>
                      Attempts: {assignment.attemptsUsed}/{assignment.attemptsAllowed}
                    </span>
                    <span>Marks: {exam?.totalMarks || '—'}</span>
                  </div>

                  <div className="mt-auto d-flex gap-2">
                    {canAttempt ? (
                      <Link
                        to={`/student/exam/${exam?._id}/attempt`}
                        className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      >
                        {isInProgress ? (
                          <>
                            <Play size={16} /> Resume
                          </>
                        ) : (
                          <>
                            Start <ArrowRight size={16} />
                          </>
                        )}
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-secondary flex-grow-1" disabled>
                        <CheckCircle2 size={16} className="me-1" /> Completed
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline-info d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setSelectedPdfExamId(exam?._id);
                        setShowPdfModal(true);
                      }}
                      title="Download Printable Question Paper PDF for Offline Practice"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Question Paper Modal */}
      <PrintableQuestionPaperModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        examId={selectedPdfExamId}
      />
    </div>
  );
};

export default StudentAssignedExams;

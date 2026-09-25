import '../../styles/student.css';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
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
  const [error, setError] = useState('');

  // Modal State for Printable Question Paper PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfExamId, setSelectedPdfExamId] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await examAssignmentAPI.getStudentAssignments();
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError('We could not load your assigned assessments. Please try again.');
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
    <div className="student-page">
      <PageHeader eyebrow="Your schedule" title="Assigned assessments" description="Stay on top of your faculty assignments, due dates, and remaining attempts." />
      <div className="student-toolbar">
        <div className="position-relative student-search">
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5" aria-label="Search assigned assessments"
            placeholder="Search assigned exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="small text-muted" role="status">{loading ? 'Loading assignments…' : `${filtered.length} assignments`}</span>
      </div>

      {loading ? (
        <div className="student-loading card" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><p>Loading your assignments…</p></div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Assignments unavailable" description={error} actionLabel="Try again" onAction={fetchAssignments} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title={search ? 'No matching assignments' : 'Your schedule is clear'} description={search ? 'Try a different assessment title.' : 'Your faculty assignments will appear here when they are available.'} actionLabel={search ? 'Clear search' : ''} onAction={() => setSearch('')} />
      ) : (
        <div className="row g-4">
          {filtered.map((assignment) => {
            const exam = assignment.examId;
            const statusInfo = getStatusInfo(assignment);
            const canAttempt = assignment.attemptsRemaining > 0;
            const isInProgress = assignment.attempt?.status === 'started';

            return (
              <div key={assignment._id} className="col-12 col-md-6 col-xl-4">
                <div className="card student-exam-card p-4 h-100 d-flex flex-column border">
                  <div className="student-course-icon mb-4"><BookOpen size={23} aria-hidden="true" /></div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                    <span className="text-muted small d-flex align-items-center gap-1">
                      <Clock size={14} />
                      {assignment.duration || exam?.duration} mins
                    </span>
                  </div>

                  <h5 className="fw-bold text-body mb-1">
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

                  <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center small text-muted mb-4 border-top border-bottom py-3">
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
                      aria-label="Download printable question paper"
                      title="Download printable question paper"
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

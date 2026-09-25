import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examAssignmentAPI } from '../../services/api';
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  FileText,
  Filter,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import PrintableQuestionPaperModal from '../../components/PrintableQuestionPaperModal';
import '../../styles/student.css';

const ExamList = () => {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'completed', 'expired'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for Printable Question Paper PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfExamId, setSelectedPdfExamId] = useState(null);

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
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

  const getStatus = (assignment) => {
    if (assignment.computedStatus) return assignment.computedStatus;
    const now = new Date();
    const isExpired = assignment.endDate ? new Date(assignment.endDate) < now : false;
    const attemptsExhausted = assignment.attemptsRemaining != null && assignment.attemptsRemaining <= 0;
    const isCompleted = attemptsExhausted || ['submitted', 'auto-submitted', 'evaluated'].includes(assignment.attempt?.status);
    const isInProgress = assignment.attempt?.status === 'started' && !isExpired;

    if (isCompleted) return 'completed';
    if (isExpired) return 'expired';
    if (isInProgress) return 'in_progress';
    return 'available';
  };

  const filteredAssignments = assignments.filter((a) => {
    const exam = a.examId;
    const title = a.title || exam?.title || '';
    const category = exam?.category || '';
    const matchesSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const status = getStatus(a);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'available') return status === 'available' || status === 'in_progress';
    if (statusFilter === 'completed') return status === 'completed';
    if (statusFilter === 'expired') return status === 'expired';
    return true;
  });

  const counts = {
    all: assignments.length,
    available: assignments.filter((a) => {
      const s = getStatus(a);
      return s === 'available' || s === 'in_progress';
    }).length,
    completed: assignments.filter((a) => getStatus(a) === 'completed').length,
    expired: assignments.filter((a) => getStatus(a) === 'expired').length,
  };

  return (
    <div className="student-page assessment-catalog">
      <PageHeader
        eyebrow="My Assessments"
        title="Assigned Assessments"
        description="View and attempt the assessments assigned to you by your faculty."
      />

      {/* Filter Tabs and Search Toolbar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        {/* Status Filter Tabs */}
        <div className="btn-group p-1 bg-body-tertiary rounded-3 border" role="group" aria-label="Assessment status filter">
          <button
            type="button"
            className={`btn btn-sm rounded-2 fw-semibold px-3 ${statusFilter === 'all' ? 'btn-primary shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            All <span className="badge bg-secondary bg-opacity-25 ms-1">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-2 fw-semibold px-3 ${statusFilter === 'available' ? 'btn-primary shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setStatusFilter('available')}
          >
            Available <span className="badge bg-secondary bg-opacity-25 ms-1">{counts.available}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-2 fw-semibold px-3 ${statusFilter === 'completed' ? 'btn-primary shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed <span className="badge bg-success bg-opacity-25 text-success ms-1">{counts.completed}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-2 fw-semibold px-3 ${statusFilter === 'expired' ? 'btn-primary shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setStatusFilter('expired')}
          >
            Expired <span className="badge bg-danger bg-opacity-25 text-danger ms-1">{counts.expired}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="position-relative student-search" style={{ maxWidth: 360 }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            aria-label="Search assessments by title or topic"
            className="form-control ps-5"
            placeholder="Search exam by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="student-loading card p-5 text-center" role="status">
          <span className="spinner-border text-primary mx-auto mb-3" aria-hidden="true" />
          <p className="text-secondary mb-0">Loading your assigned assessments…</p>
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Assessments unavailable"
          description={error}
          actionLabel="Try again"
          onAction={fetchAssignedExams}
        />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            search
              ? 'No matching assessments'
              : statusFilter === 'completed'
              ? 'No completed assessments yet'
              : statusFilter === 'expired'
              ? 'No expired assessments'
              : 'No assigned assessments'
          }
          description={
            search
              ? 'Try adjusting your search terms or filters.'
              : statusFilter === 'completed'
              ? 'Exams you have submitted or completed will appear here.'
              : statusFilter === 'expired'
              ? 'Exams whose deadline has passed will appear here.'
              : 'Assessments assigned by your faculty will appear here.'
          }
          actionLabel={search ? 'Clear search' : ''}
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="row g-4">
          {filteredAssignments.map((assignment) => {
            const exam = assignment.examId;
            const status = getStatus(assignment);
            const isCompleted = status === 'completed';
            const isExpired = status === 'expired';
            const isInProgress = status === 'in_progress';
            const isAvailable = status === 'available';

            return (
              <div key={assignment._id} className="col-12 col-md-6 col-xl-4">
                <div
                  className={`card student-exam-card p-4 h-100 d-flex flex-column justify-content-between border position-relative ${
                    isExpired ? 'opacity-75' : ''
                  }`}
                  style={{
                    borderTop: isCompleted
                      ? '3px solid #16a34a'
                      : isExpired
                      ? '3px solid #dc2626'
                      : isInProgress
                      ? '3px solid #ca8a04'
                      : '3px solid #2563eb',
                  }}
                >
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="student-course-icon">
                        <BookOpen size={22} aria-hidden="true" />
                      </div>

                      {/* Status Badges */}
                      {isCompleted && (
                        <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 d-inline-flex align-items-center gap-1 py-1.5 px-2.5">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                      {isExpired && (
                        <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 d-inline-flex align-items-center gap-1 py-1.5 px-2.5">
                          <AlertCircle size={13} /> Expired
                        </span>
                      )}
                      {isInProgress && (
                        <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 d-inline-flex align-items-center gap-1 py-1.5 px-2.5">
                          <Play size={13} /> In Progress
                        </span>
                      )}
                      {isAvailable && (
                        <span className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 py-1.5 px-2.5">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20">
                        {exam?.category || 'General'}
                      </span>
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <Clock size={14} /> {assignment.duration || exam?.duration || 0} mins
                      </span>
                    </div>

                    <h2 className="h5 fw-bold text-body mb-1">
                      {assignment.title || exam?.title}
                    </h2>
                    <p className="text-secondary small line-clamp-2 mb-3">
                      {exam?.description || 'Faculty-assigned proctored assessment.'}
                    </p>

                    {/* Metadata & Deadlines */}
                    <div className="small text-muted mb-3 p-2.5 rounded bg-body-tertiary">
                      <div className="d-flex align-items-center gap-1.5 mb-1">
                        <Calendar size={13} className={isExpired ? 'text-danger' : 'text-primary'} />
                        <span className={isExpired ? 'text-danger fw-semibold' : ''}>
                          {isExpired ? 'Expired on: ' : 'Deadline: '}
                          {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : 'Open'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Attempts: {assignment.attemptsUsed ?? 0}/{assignment.attemptsAllowed ?? 1}</span>
                        <span>Marks: {exam?.totalMarks ?? '—'}</span>
                      </div>
                    </div>

                    <div className="student-exam-metrics mb-4">
                      <div>
                        <strong>{exam?.questions?.length || 0}</strong>
                        <span>MCQs</span>
                      </div>
                      <div>
                        <strong>{exam?.codingProblems?.length || 0}</strong>
                        <span>Coding</span>
                      </div>
                      <div>
                        <strong>{exam?.totalMarks ?? '—'}</strong>
                        <span>Total Marks</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto d-flex gap-2">
                    {isCompleted ? (
                      <button
                        type="button"
                        className="btn btn-secondary flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 opacity-75"
                        disabled
                      >
                        <CheckCircle2 size={16} /> Completed
                      </button>
                    ) : isExpired ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                        disabled
                      >
                        <AlertCircle size={16} /> Expired
                      </button>
                    ) : isInProgress ? (
                      <Link
                        to={`/student/exam/${exam?._id}/attempt`}
                        className="btn btn-warning flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        <Play size={16} /> Resume Assessment
                      </Link>
                    ) : (
                      <Link
                        to={`/student/exam/${exam?._id}/attempt`}
                        className="btn btn-primary flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        Start Assessment <ArrowRight size={16} />
                      </Link>
                    )}

                    {exam?._id && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-3"
                        onClick={() => {
                          setSelectedPdfExamId(exam._id);
                          setShowPdfModal(true);
                        }}
                        aria-label="Download printable question paper"
                        title="Download printable question paper"
                      >
                        <FileText size={16} />
                      </button>
                    )}
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

export default ExamList;

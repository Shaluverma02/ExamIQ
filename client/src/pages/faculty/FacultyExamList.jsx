import '../../styles/faculty.css';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import {
  BookOpen, PlusCircle, Search, Clock, FileQuestion,
  Code2, Edit, Eye, Trash2, AlertCircle, FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PrintableQuestionPaperModal from '../../components/PrintableQuestionPaperModal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

const FacultyExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleting, setDeleting] = useState(null);

  // Modal State for Printable Question Paper PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfExamId, setSelectedPdfExamId] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/exams');
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      setDeleting(examId);
      await API.delete(`/exams/${examId}`);
      setExams((prev) => prev.filter((e) => e._id !== examId));
      toast.success('Exam deleted successfully');
    } catch (err) {
      toast.error('Failed to delete exam');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = exams.filter((ex) => {
    const matchSearch =
      ex.title.toLowerCase().includes(search.toLowerCase()) ||
      ex.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || ex.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const publishedCount = exams.filter((e) => e.status === 'published').length;
  const draftCount = exams.filter((e) => e.status === 'draft').length;

  return (
    <div className="workspace-page faculty-workspace">
      <PageHeader
        eyebrow="Assessment Operations"
        title="Manage exams"
        description="Review exam windows, question mix, publishing status, and assessment actions from one place."
        actions={(
          <Link to="/faculty/exams/create" className="btn btn-primary">
            <PlusCircle size={16} /> Create exam
          </Link>
        )}
      />

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <StatCard icon={BookOpen} label="Total exams" value={exams.length} trend="All assessment windows" />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard icon={Eye} label="Published" value={publishedCount} trend="Visible to candidates" trendType="positive" />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard icon={AlertCircle} label="Drafts" value={draftCount} trend="Needs completion" />
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row gap-3">
            <div className="position-relative flex-grow-1">
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
            </div>
            <select
              className="form-select"
              style={{ width: 'min(100%, 220px)' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-panel"><div className="spinner-border text-primary mb-3" role="status" /><p className="text-muted mb-0">Loading your exams...</p></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-5 px-3">
          <BookOpen size={48} className="text-muted mb-3" />
          <p className="text-muted mb-2">
            {exams.length === 0
              ? 'No exams created yet.'
              : 'No exams match your filters.'}
          </p>
          {exams.length === 0 && (
            <Link to="/faculty/exams/create" className="btn btn-primary rounded-pill px-4">
              <PlusCircle size={16} className="me-2" /> Create First Exam
            </Link>
          )}
        </div>
      ) : (
        <div className="vstack gap-3">
          {filtered.map((exam) => (
            <article key={exam._id} className="card">
              <div className="card-body p-3 p-lg-4">
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div className="min-width-0">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className={`badge ${exam.status === 'published' ? 'bg-success' : exam.status === 'draft' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {exam.status}
                      </span>
                      <span className="badge bg-body-tertiary border text-secondary">{exam.category}</span>
                    </div>
                    <h5 className="fw-bold text-body mb-1 text-break">{exam.title}</h5>
                    <p className="text-muted small mb-0">{exam.description?.slice(0, 120) || 'No exam description added.'}{exam.description?.length > 120 ? '...' : ''}</p>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    <button
                      className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                      onClick={() => { setSelectedPdfExamId(exam._id); setShowPdfModal(true); }}
                      title="Printable Question Paper PDF"
                    >
                      <FileText size={14} /> PDF
                    </button>
                    <Link to={`/faculty/exams/edit/${exam._id}`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                      <Edit size={14} /> Edit
                    </Link>
                    <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={() => handleDelete(exam._id)} disabled={deleting === exam._id}>
                      <Trash2 size={14} /> {deleting === exam._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="row g-2 mt-3 pt-3 border-top">
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Duration</div>
                    <div className="fw-semibold text-body d-flex align-items-center gap-1"><Clock size={14} /> {exam.duration} mins</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Questions</div>
                    <div className="fw-semibold text-body"><FileQuestion size={14} className="me-1" />{exam.questions?.length || 0} MCQ</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Coding problems</div>
                    <div className="fw-semibold text-info"><Code2 size={14} className="me-1" />{exam.codingProblems?.length || 0} Code</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Total marks</div>
                    <div className="fw-bold text-body">{exam.totalMarks}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
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

export default FacultyExamList;

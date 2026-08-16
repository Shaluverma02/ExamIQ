import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import {
  BookOpen, PlusCircle, Search, Clock, FileQuestion,
  Code2, Edit, Eye, Trash2, AlertCircle, FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PrintableQuestionPaperModal from '../../components/PrintableQuestionPaperModal';

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
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0">Exam Management</h3>
          <p className="text-muted small m-0">Create, edit and manage all your assessments</p>
        </div>
        <Link
          to="/faculty/exams/create"
          className="btn btn-primary fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
        >
          <PlusCircle size={18} /> Create New Exam
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-20 rounded-3 text-primary">
              <BookOpen size={22} />
            </div>
            <div>
              <h4 className="fw-extrabold m-0 text-light">{exams.length}</h4>
              <span className="text-muted small">Total Exams</span>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-20 rounded-3 text-success">
              <Eye size={22} />
            </div>
            <div>
              <h4 className="fw-extrabold m-0 text-light">{publishedCount}</h4>
              <span className="text-muted small">Published</span>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-20 rounded-3 text-warning">
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 className="fw-extrabold m-0 text-light">{draftCount}</h4>
              <span className="text-muted small">Drafts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <div className="position-relative flex-grow-1">
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control bg-secondary text-light border-0 ps-5"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select bg-secondary text-light border-0"
          style={{ width: 180 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5 text-muted">Loading exams...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-5">
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
        <div className="glass-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle m-0">
              <thead>
                <tr className="text-muted small text-uppercase border-bottom border-secondary">
                  <th className="px-4 py-3">Exam Title</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Duration</th>
                  <th className="py-3">Questions</th>
                  <th className="py-3">Marks</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam) => (
                  <tr key={exam._id}>
                    <td className="px-4">
                      <div className="fw-bold text-light">{exam.title}</div>
                      <div className="text-muted small">{exam.description?.slice(0, 50) || ''}{exam.description?.length > 50 ? '…' : ''}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{exam.category}</span>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1 text-muted small">
                        <Clock size={13} /> {exam.duration} mins
                      </span>
                    </td>
                    <td>
                      <div className="small">
                        <span className="text-light me-2">
                          <FileQuestion size={13} className="me-1" />
                          {exam.questions?.length || 0} MCQ
                        </span>
                        <span className="text-info">
                          <Code2 size={13} className="me-1" />
                          {exam.codingProblems?.length || 0} Code
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-light">{exam.totalMarks}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          exam.status === 'published'
                            ? 'bg-success'
                            : exam.status === 'draft'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedPdfExamId(exam._id);
                            setShowPdfModal(true);
                          }}
                          title="Printable Question Paper PDF"
                        >
                          <FileText size={13} /> PDF Paper
                        </button>
                        <Link
                          to={`/faculty/exams/edit/${exam._id}`}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        >
                          <Edit size={13} /> Edit
                        </Link>
                        <button
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                          onClick={() => handleDelete(exam._id)}
                          disabled={deleting === exam._id}
                        >
                          <Trash2 size={13} />
                          {deleting === exam._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

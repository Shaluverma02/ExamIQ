import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { Trophy, CheckCircle2, XCircle, Clock, ArrowRight, FileText, Search, Download } from 'lucide-react';
import { downloadResultsExcel } from '../../utils/downloadExcel';

const StudentResultsList = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await API.get('/results');
      setResults(res.data.results || []);
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

  const filtered = results.filter((r) =>
    (r.examId?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.examId?.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const passCount = results.filter((r) => r.status === 'Pass').length;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0">My Exam Results</h3>
          <p className="text-muted small m-0">Review your performance across all assessments</p>
        </div>
        <div className="d-flex align-items-center gap-2">
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
          <div className="position-relative" style={{ width: 260 }}>
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control bg-secondary text-light border-0 ps-5"
              placeholder="Search by exam or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 text-center">
            <h3 className="fw-extrabold text-light m-0">{results.length}</h3>
            <span className="text-muted small">Total Attempts</span>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 text-center">
            <h3 className="fw-extrabold text-success m-0">{passCount}</h3>
            <span className="text-muted small">Passed</span>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="glass-card p-3 text-center">
            <h3 className="fw-extrabold text-warning m-0">{avgScore}%</h3>
            <span className="text-muted small">Average Score</span>
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="text-center py-5 text-muted">Loading your results...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-5">
          <FileText size={48} className="text-muted mb-3" />
          <p className="text-muted mb-0">
            {results.length === 0
              ? 'No exams attempted yet. Go to Exams tab to start!'
              : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((result) => {
            const isPass = result.status === 'Pass';
            return (
              <div
                key={result._id}
                className={`glass-card p-4 border ${
                  isPass ? 'border-success border-opacity-25' : 'border-danger border-opacity-25'
                }`}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  {/* Left Info */}
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className={`p-3 rounded-3 ${
                        isPass ? 'bg-success bg-opacity-20 text-success' : 'bg-danger bg-opacity-20 text-danger'
                      }`}
                    >
                      {isPass ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                      <h6 className="fw-bold text-light mb-1">
                        {result.examId?.title || 'Assessment'}
                      </h6>
                      <div className="d-flex gap-3 small text-muted flex-wrap">
                        <span>{result.examId?.category || 'General'}</span>
                        <span className="d-flex align-items-center gap-1">
                          <Clock size={13} />
                          {new Date(result.evaluatedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score + Badge + Button */}
                  <div className="d-flex align-items-center gap-3 ms-auto flex-wrap">
                    <div className="text-end">
                      <div className="fw-extrabold fs-5 text-light">
                        {result.totalScore}{' '}
                        <span className="text-muted fw-normal fs-6">/ {result.totalMarks}</span>
                      </div>
                      <div className="small text-muted">{result.percentage}%</div>
                    </div>

                    <span className={`badge fs-6 px-3 py-2 ${isPass ? 'bg-success' : 'bg-danger'}`}>
                      {result.status}
                    </span>

                    <Link
                      to={`/student/results/${result._id}`}
                      className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 rounded-pill px-3"
                    >
                      Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentResultsList;

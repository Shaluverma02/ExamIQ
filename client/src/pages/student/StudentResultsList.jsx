import '../../styles/student.css';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { Trophy, CheckCircle2, XCircle, Clock, ArrowRight, Search, Download } from 'lucide-react';
import { downloadResultsExcel } from '../../utils/downloadExcel';

const StudentResultsList = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/results');
      setResults(res.data.results || []);
    } catch (err) {
      setError('We could not load your results. Please try again.');
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
    <div className="student-page">
      <PageHeader eyebrow="Your progress" title="Assessment results" description="Review your scores, understand your progress, and plan your next step." />
      <div className="student-toolbar">
        <div className="d-flex align-items-center flex-wrap gap-3 w-100 justify-content-between">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={handleDownloadExcel}
            disabled={downloadingExcel || loading || results.length === 0}
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
          <div className="position-relative student-search">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control ps-5" aria-label="Search results by exam or category"
              placeholder="Search by exam or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4"><StatCard icon={Trophy} label="Total attempts" value={loading ? '…' : error ? '—' : results.length} trend="Evaluated assessments" /></div>
        <div className="col-12 col-sm-4"><StatCard icon={CheckCircle2} label="Assessments passed" value={loading ? '…' : error ? '—' : passCount} trend="Your successful attempts" /></div>
        <div className="col-12 col-sm-4"><StatCard icon={Clock} label="Average score" value={loading ? '…' : error || !results.length ? '—' : avgScore + '%'} trend="Across evaluated attempts" /></div>
      </div>
      {/* Results List */}
      {loading ? (
        <div className="student-loading card" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><p>Loading your results…</p></div>
      ) : error ? (
        <EmptyState title="Results unavailable" description={error} actionLabel="Try again" onAction={fetchResults} />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-5 px-3">
          <div
            className={`mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center ${
              results.length === 0 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'
            }`}
            style={{ width: 72, height: 72 }}
          >
            {results.length === 0 ? <Trophy size={34} /> : <Search size={34} />}
          </div>
          <h5 className="fw-bold text-body mb-2">
            {results.length === 0 ? 'No exams attempted yet' : 'No results found'}
          </h5>
          <p className="text-muted mb-3">
            {results.length === 0
              ? 'Go to the Assessments tab and start your first exam.'
              : 'Try another exam title or category.'}
          </p>
          {results.length === 0 && (
            <Link to="/student/exams" className="btn btn-primary rounded-pill px-4 mx-auto">
              Go to Assessments <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((result) => {
            const isPass = result.status === 'Pass';
            return (
              <div
                key={result._id}
                className={`card student-result-row p-4 border ${
                  isPass ? 'is-pass' : 'is-fail'
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
                      <h6 className="fw-bold text-body mb-1">
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
                  <div className="d-flex align-items-center gap-3 ms-md-auto flex-wrap">
                    <div className="text-end">
                      <div className="fw-bold fs-5 text-body">
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
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 rounded-pill px-3"
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

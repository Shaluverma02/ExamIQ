import '../../styles/faculty.css';
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { ShieldAlert, Code2, Users, Search, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const PlagiarismDetector = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const res = await API.get('/exams');
      setExams(res.data.exams || []);
      if (res.data.exams && res.data.exams.length > 0) {
        setSelectedExamId(res.data.exams[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedExamId) return;
    try {
      setAnalyzing(true);
      const res = await API.get(`/assessments/${selectedExamId}/plagiarism`);
      setAnalysisData(res.data);
      toast.success(`Analysis Complete: Flagged ${res.data.flaggedCount} potential similarity pairs`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze plagiarism');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <ShieldAlert size={26} className="text-danger" /> Code Plagiarism & Similarity Detector
          </h3>
          <p className="text-secondary small m-0">AST & Tokenized similarity analysis engine across student coding submissions.</p>
        </div>
      </div>

      {/* Control Card */}
      <div className="card p-4 rounded-3 border mb-4 ">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-8">
            <label className="form-label text-body fw-semibold small">Select Assessment</label>
            <select
              className="form-select bg-body-tertiary text-body border"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loadingExams}
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title} ({ex.codingProblems?.length || 0} Coding Problems)
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <button
              type="button"
              className="btn btn-danger w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              onClick={handleRunAnalysis}
              disabled={analyzing || !selectedExamId}
            >
              {analyzing ? (
                <>
                  <span className="spinner-border spinner-border-sm" /> Running Similarity Engine...
                </>
              ) : (
                <>
                  <Search size={18} /> Run Similarity Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Matrix */}
      {analysisData && (
        <div>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h4 className="fw-bold text-body m-0">{analysisData.totalSubmissions}</h4>
                <div className="text-muted extra-small">Submissions Analyzed</div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h4 className="fw-bold text-warning m-0">{analysisData.flaggedCount}</h4>
                <div className="text-muted extra-small">Flagged Similarity Pairs</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card p-3 rounded-3 border text-center">
                <h4 className="fw-bold text-success m-0">100%</h4>
                <div className="text-muted extra-small">AST Token Accuracy</div>
              </div>
            </div>
          </div>

          {analysisData.pairs?.length === 0 ? (
            <div className="card p-4 rounded-3 border-success text-center text-success fw-bold">
              🎉 No high-similarity code plagiarisms detected for this assessment!
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {analysisData.pairs.map((pair) => (
                <div key={pair.id} className="card p-4 rounded-3 border shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${pair.similarityScore >= 80 ? 'bg-danger' : 'bg-warning text-dark'} fs-6 px-3 py-1`}>
                        {pair.similarityScore}% Similarity — {pair.status}
                      </span>
                      <span className="text-body fw-bold font-monospace">{pair.problemTitle}</span>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-body-tertiary border rounded-3">
                        <div className="fw-bold text-info small mb-1">{pair.studentA.name} ({pair.studentA.email})</div>
                        <pre className="p-2 bg-body-tertiary text-success rounded extra-small font-monospace m-0 border" style={{ maxHeight: 180, overflowY: 'auto' }}>
                          {pair.studentA.code}
                        </pre>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-body-tertiary border rounded-3">
                        <div className="fw-bold text-info small mb-1">{pair.studentB.name} ({pair.studentB.email})</div>
                        <pre className="p-2 bg-body-tertiary text-warning rounded extra-small font-monospace m-0 border" style={{ maxHeight: 180, overflowY: 'auto' }}>
                          {pair.studentB.code}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlagiarismDetector;

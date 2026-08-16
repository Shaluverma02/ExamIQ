import React, { useState, useEffect } from 'react';
import { plagiarismAPI } from '../services/api';
import { toast } from 'react-toastify';
import { ShieldAlert, RefreshCw, FileCode, Users, Code } from 'lucide-react';

const PlagiarismCheckerModal = ({ isOpen, onClose, examId }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await plagiarismAPI.getReport(examId || 'all');
        if (response.data.success) {
          setReport(response.data.report);
        }
      } catch (err) {
        toast.error('Failed to load Plagiarism Report');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, examId]);

  if (!isOpen) return null;

  const filteredPairs = (report?.pairs || []).filter((p) => {
    if (riskFilter === 'HIGH') return p.riskLevel === 'High';
    if (riskFilter === 'MEDIUM') return p.riskLevel === 'Medium';
    return true;
  });

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content text-light border border-danger shadow-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Header */}
          <div className="modal-header border-secondary d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h5 className="modal-title d-flex align-items-center gap-2 text-danger fw-bold">
              <ShieldAlert className="text-danger" size={26} />
              Code Similarity & Plagiarism Detector
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <RefreshCw size={40} className="text-danger spinner-border spinner-border-sm mb-3" style={{ width: '3rem', height: '3rem' }} />
                <h6 className="text-light fw-bold">Comparing Candidate Code Submissions...</h6>
                <p className="text-muted small">Executing AST Tokenization and Levenshtein Distance Matrix.</p>
              </div>
            ) : report ? (
              <div className="d-flex flex-column gap-4">
                {/* Stats Summary */}
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-muted small d-block">Submissions Scanned</span>
                      <span className="fs-4 fw-bold text-light">{report.totalSubmissionsScanned}</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-muted small d-block">Candidate Pairs</span>
                      <span className="fs-4 fw-bold text-info">{report.totalPairsAnalyzed}</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-muted small d-block">High Risk Flags (&ge;70%)</span>
                      <span className="fs-4 fw-bold text-danger">{report.highRiskCount}</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border border-secondary text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-muted small d-block">Medium Risk (40-69%)</span>
                      <span className="fs-4 fw-bold text-warning">{report.mediumRiskCount}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Filter */}
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                  <h6 className="text-light fw-bold m-0 d-flex align-items-center gap-2">
                    <Users size={18} /> Candidate Similarity Pairs ({filteredPairs.length})
                  </h6>
                  <div className="btn-group btn-group-sm">
                    <button className={`btn ${riskFilter === 'ALL' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setRiskFilter('ALL')}>
                      All
                    </button>
                    <button className={`btn ${riskFilter === 'HIGH' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setRiskFilter('HIGH')}>
                      High Risk Only
                    </button>
                    <button className={`btn ${riskFilter === 'MEDIUM' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setRiskFilter('MEDIUM')}>
                      Medium Risk
                    </button>
                  </div>
                </div>

                {/* Pairs Table */}
                {filteredPairs.length === 0 ? (
                  <div className="p-4 rounded text-center text-muted border border-secondary" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    No suspicious code matches found matching filter.
                  </div>
                ) : (
                  <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover align-middle m-0 small">
                      <thead className="sticky-top" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <tr className="text-muted">
                          <th>Problem Title</th>
                          <th>Student A</th>
                          <th>Student B</th>
                          <th>Similarity</th>
                          <th>Risk Flag</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPairs.map((pair) => (
                          <tr key={pair.pairId} className={pair.riskLevel === 'High' ? 'table-danger bg-opacity-10' : ''}>
                            <td className="fw-semibold text-light">{pair.problemTitle}</td>
                            <td>
                              <div className="fw-bold">{pair.studentA.name}</div>
                              <span className="text-muted text-truncate d-block" style={{ maxWidth: 140 }}>{pair.studentA.email}</span>
                            </td>
                            <td>
                              <div className="fw-bold">{pair.studentB.name}</div>
                              <span className="text-muted text-truncate d-block" style={{ maxWidth: 140 }}>{pair.studentB.email}</span>
                            </td>
                            <td>
                              <div className="progress bg-secondary" style={{ height: '18px', width: '90px' }}>
                                <div
                                  className={`progress-bar ${pair.similarityScore >= 70 ? 'bg-danger' : pair.similarityScore >= 40 ? 'bg-warning' : 'bg-info'}`}
                                  style={{ width: `${pair.similarityScore}%` }}
                                >
                                  {pair.similarityScore}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${pair.riskLevel === 'High' ? 'bg-danger' : pair.riskLevel === 'Medium' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                {pair.riskLevel} Risk
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" onClick={() => setSelectedPair(pair)}>
                                <Code size={14} /> Compare Diff
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Side-by-Side Diff View Modal/Drawer */}
                {selectedPair && (
                  <div className="p-3 rounded border border-info" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-info fw-bold m-0 d-flex align-items-center gap-2">
                        <FileCode size={18} /> Code Match Diff: {selectedPair.problemTitle} ({selectedPair.similarityScore}% Match)
                      </h6>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedPair(null)}>Close Diff</button>
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded border border-secondary bg-dark">
                          <span className="badge bg-primary mb-2">{selectedPair.studentA.name} ({selectedPair.studentA.email})</span>
                          <pre className="p-2 bg-black text-light font-monospace small mb-0 rounded" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {selectedPair.studentA.code}
                          </pre>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded border border-secondary bg-dark">
                          <span className="badge bg-warning text-dark mb-2">{selectedPair.studentB.name} ({selectedPair.studentB.email})</span>
                          <pre className="p-2 bg-black text-light font-monospace small mb-0 rounded" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {selectedPair.studentB.code}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="modal-footer border-secondary" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismCheckerModal;
import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Bot, CheckCircle2, AlertTriangle, Lightbulb, Code2, RefreshCw, Zap } from 'lucide-react';

const AICodeReviewModal = ({ isOpen, onClose, codeData }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (isOpen && codeData && codeData.code) {
      fetchAnalysis();
    }
  }, [isOpen, codeData]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.analyzeCode({
        code: codeData.code,
        language: codeData.language || 'javascript',
        problemTitle: codeData.problemTitle || 'Coding Submission',
      });
      if (response.data.success) {
        setAnalysis(response.data.analysis);
      }
    } catch (err) {
      toast.error('Could not fetch AI Code Insights');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(11, 17, 32, 0.75)', zIndex: 2050, backdropFilter: 'blur(6px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border shadow-lg">
          {/* Header */}
          <div className="modal-header px-4 py-3 d-flex align-items-center justify-content-between">
            <h5 className="modal-title d-flex align-items-center gap-2 text-primary fw-bold">
              <Bot className="text-primary" size={24} />
              <span>AI Code Insights & Complexity Review</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <RefreshCw size={36} className="text-primary spinner-border spinner-border-sm mb-3" style={{ width: '2.5rem', height: '2.5rem' }} />
                <h6 className="fw-bold mb-1">Analyzing Code Structure & Complexity...</h6>
                <p className="text-muted small mb-0">Evaluating AST patterns, time/space limits, and edge cases.</p>
              </div>
            ) : analysis ? (
              <div className="d-flex flex-column gap-4">
                {/* Summary Metrics Banner */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 bg-secondary rounded border text-center">
                      <span className="text-muted small d-block">Time Complexity</span>
                      <span className="fs-4 fw-bold text-warning">{analysis.timeComplexity}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-secondary rounded border text-center">
                      <span className="text-muted small d-block">Space Complexity</span>
                      <span className="fs-4 fw-bold text-success">{analysis.spaceComplexity}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-secondary rounded border text-center">
                      <span className="text-muted small d-block">Quality Score</span>
                      <span className="fs-4 fw-bold text-primary">{analysis.qualityScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* Summary Text */}
                {analysis.summary && (
                  <div className="p-3 rounded border bg-secondary" style={{ borderColor: 'var(--primary-color)' }}>
                    <p className="mb-0 small d-flex align-items-center gap-2 lh-base">
                      <Zap className="text-warning flex-shrink-0" size={18} />
                      <span>{analysis.summary}</span>
                    </p>
                  </div>
                )}

                {/* Strengths & Weaknesses Grid */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="h-100 p-3 rounded border border-success">
                      <h6 className="text-success fw-bold d-flex align-items-center gap-2 mb-3">
                        <CheckCircle2 size={18} /> Strengths
                      </h6>
                      <ul className="list-unstyled mb-0 small d-flex flex-column gap-2">
                        {analysis.strengths && analysis.strengths.map((str, idx) => (
                          <li key={idx} className="d-flex align-items-start gap-2 text-secondary">
                            <span className="text-success">•</span> <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="h-100 p-3 rounded border border-warning">
                      <h6 className="text-warning fw-bold d-flex align-items-center gap-2 mb-3">
                        <AlertTriangle size={18} /> Edge Cases & Areas to Improve
                      </h6>
                      <ul className="list-unstyled mb-0 small d-flex flex-column gap-2">
                        {analysis.weaknesses && analysis.weaknesses.map((w, idx) => (
                          <li key={idx} className="d-flex align-items-start gap-2 text-secondary">
                            <span className="text-warning">•</span> <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="p-3 bg-secondary rounded border">
                    <h6 className="text-primary fw-bold d-flex align-items-center gap-2 mb-2">
                      <Lightbulb className="text-warning" size={18} /> Optimization Recommendations
                    </h6>
                    <ul className="mb-0 small text-secondary ps-3">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="mb-1">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Refactored Code */}
                {analysis.suggestedCode && (
                  <div>
                    <h6 className="fw-bold d-flex align-items-center gap-2 mb-2">
                      <Code2 className="text-primary" size={18} /> AI Suggested Optimized Solution
                    </h6>
                    <pre className="p-3 rounded border font-monospace small" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-primary)', color: 'var(--success-color)' }}>
                      <code>{analysis.suggestedCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="modal-footer px-4 py-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICodeReviewModal;
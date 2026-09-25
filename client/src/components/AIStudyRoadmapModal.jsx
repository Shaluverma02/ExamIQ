import React, { useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Sparkles, Brain, CheckCircle2, AlertTriangle, Calendar, X, BookOpen, Target } from 'lucide-react';

const AIStudyRoadmapModal = ({ isOpen, onClose, resultData }) => {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  if (!isOpen) return null;

  const handleGenerateRoadmap = async () => {
    try {
      setLoading(true);
      const res = await API.post('/ai/study-roadmap', {
        examTitle: resultData?.examId?.title || 'Recent Exam',
        score: resultData?.totalScore || 0,
        totalMarks: resultData?.totalMarks || 100,
        percentage: resultData?.percentage || 0,
      });
      setRoadmap(res.data.roadmap);
      toast.success('AI Diagnostic Study Roadmap generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate study roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content card text-body border-info shadow-lg rounded-3">
          <div className="modal-header border-bottom border px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-info bg-opacity-20 text-info rounded-3">
                <Brain size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-body m-0">AI Weak-Topic Diagnostic & Study Roadmap</h5>
                <p className="text-muted small m-0">Personalized revision plan based on evaluation insights</p>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-4">
            {!roadmap ? (
              <div className="text-center py-5">
                <Sparkles size={48} className="text-info mb-3 opacity-75 animate-bounce" />
                <h5 className="fw-bold text-body mb-2">Generate Your AI Performance Diagnostic</h5>
                <p className="text-muted small mb-4" style={{ maxWidth: 460, margin: '0 auto' }}>
                  Analyze your wrong answers, identify conceptual weak areas, and receive a customized 7-day revision roadmap.
                </p>
                <button
                  className="btn btn-info fw-bold px-4 py-2 rounded-pill d-inline-flex align-items-center gap-2 shadow"
                  onClick={handleGenerateRoadmap}
                  disabled={loading}
                >
                  <Sparkles size={18} /> {loading ? 'Analyzing Performance...' : 'Generate AI Study Plan'}
                </button>
              </div>
            ) : (
              <div>
                <div className="p-3 bg-body-tertiary rounded-3 border mb-4">
                  <h6 className="fw-bold text-info mb-1 d-flex align-items-center gap-2">
                    <Target size={18} /> Diagnostic Summary
                  </h6>
                  <p className="text-secondary small m-0">{roadmap.overallSummary}</p>
                </div>

                <div className="row g-3 mb-4">
                  {/* Weak Topics */}
                  <div className="col-12 col-md-6">
                    <div className="card p-3 border-danger border-opacity-50 h-100">
                      <h6 className="fw-bold text-danger mb-2 d-flex align-items-center gap-2">
                        <AlertTriangle size={18} /> Weak Topics (Focus Needed)
                      </h6>
                      <ul className="list-group list-group-flush bg-transparent">
                        {roadmap.weakTopics.map((wt, idx) => (
                          <li key={idx} className="list-group-item bg-transparent text-body border-subtle px-0 py-2 small d-flex align-items-center gap-2">
                            <span className="badge bg-danger rounded-circle p-1"> </span> {wt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strong Topics */}
                  <div className="col-12 col-md-6">
                    <div className="card p-3 border-success border-opacity-50 h-100">
                      <h6 className="fw-bold text-success mb-2 d-flex align-items-center gap-2">
                        <CheckCircle2 size={18} /> Mastered Concept Areas
                      </h6>
                      <ul className="list-group list-group-flush bg-transparent">
                        {roadmap.strongTopics.map((st, idx) => (
                          <li key={idx} className="list-group-item bg-transparent text-body border-subtle px-0 py-2 small d-flex align-items-center gap-2">
                            <span className="badge bg-success rounded-circle p-1"> </span> {st}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 7-Day Action Plan */}
                <h6 className="fw-bold text-body mb-3 d-flex align-items-center gap-2">
                  <Calendar size={18} className="text-warning" /> 7-Day Revision & Mastery Roadmap
                </h6>
                <div className="row g-2">
                  {roadmap.dailyPlan.map((dp, idx) => (
                    <div key={idx} className="col-12 col-md-6">
                      <div className="p-3 bg-body-tertiary rounded-3 border h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-warning text-dark font-monospace fw-bold">{dp.day}</span>
                          <span className="text-info small fw-bold">{dp.focus}</span>
                        </div>
                        <p className="text-secondary small m-0 mt-2">{dp.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top border px-4 py-3">
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudyRoadmapModal;

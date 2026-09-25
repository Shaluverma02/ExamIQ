import '../../styles/faculty.css';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { ShieldAlert, RefreshCw, AlertTriangle, Send, Eye, Camera, Mic, CheckCircle2, User } from 'lucide-react';

const LiveProctorDashboard = () => {
  const { examId: initialExamId } = useParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || '');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Warning Modal State
  const [warningTarget, setWarningTarget] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchLiveSessions(selectedExamId);
    }
  }, [selectedExamId]);

  useEffect(() => {
    let interval = null;
    if (autoRefresh && selectedExamId) {
      interval = setInterval(() => {
        fetchLiveSessions(selectedExamId, true);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedExamId]);

  const fetchExams = async () => {
    try {
      const res = await API.get('/exams');
      const list = res.data.exams || [];
      setExams(list);
      if (list.length > 0 && !selectedExamId) {
        setSelectedExamId(list[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveSessions = async (examId, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await API.get(`/proctor/live-sessions/${examId}`);
      setSessions(res.data.sessions || []);
    } catch (e) {
      console.error('Failed to fetch live proctor sessions:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleSendWarning = async () => {
    if (!warningTarget || !warningMessage.trim()) return;
    try {
      await API.post('/proctor/send-warning', {
        examId: selectedExamId,
        userId: warningTarget.userId?._id || warningTarget.userId,
        message: warningMessage,
      });
      toast.success(`Warning dispatched to ${warningTarget.studentName}`);
      setWarningTarget(null);
      setWarningMessage('');
    } catch (e) {
      toast.error('Failed to send warning');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <ShieldAlert className="text-danger" size={28} /> Live Multi-Candidate Proctor Command Center
          </h3>
          <p className="text-muted small m-0">Real-time video snapshots, audio meters, and security violation tracking</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select bg-secondary text-body border-0 fw-semibold"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.title} ({ex.duration} mins)
              </option>
            ))}
          </select>

          <button
            className={`btn btn-sm fw-bold px-3 d-flex align-items-center gap-1 rounded-pill ${
              autoRefresh ? 'btn-success' : 'btn-outline-secondary'
            }`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={14} className={autoRefresh ? 'spinner-border spinner-border-sm' : ''} />
            {autoRefresh ? 'Live Polling Active' : 'Polling Paused'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Connecting to active proctoring feeds...</div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-5 text-muted">
          No candidates currently taking this exam. Active candidate webcam stream cards will render here automatically.
        </div>
      ) : (
        <div className="row g-4">
          {sessions.map((sess) => (
            <div key={sess.attemptId} className="col-12 col-md-6 col-lg-4">
              <div className={`card p-3 rounded-3 border ${sess.violationCount > 0 ? 'border-danger' : 'border'}`}>
                {/* Status Bar */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={`badge ${sess.isOnline ? 'bg-success' : 'bg-secondary'} font-monospace small`}>
                    ● {sess.status}
                  </span>
                  <span className={`badge ${sess.violationCount > 0 ? 'bg-danger' : 'bg-body-tertiary text-muted'} fw-bold`}>
                    {sess.violationCount} Violations
                  </span>
                </div>

                {/* Candidate Video Feed Thumbnail */}
                <div className="position-relative bg-body-tertiary rounded-3 overflow-hidden mb-3" style={{ height: 160 }}>
                  {sess.snapshot ? (
                    <img
                      src={sess.snapshot}
                      alt="Candidate Feed"
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <Camera size={32} className="mb-1 opacity-50" />
                      <span className="small">Webcam Snapshot Pending</span>
                    </div>
                  )}

                  <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-body-tertiary bg-opacity-75 d-flex align-items-center justify-content-between">
                    <span className="text-body small font-monospace truncate" style={{ maxWidth: 150 }}>
                      {sess.studentName}
                    </span>
                    <span className="small text-warning d-flex align-items-center gap-1">
                      <Mic size={12} /> {sess.audioLevel}%
                    </span>
                  </div>
                </div>

                {/* Candidate Info & Actions */}
                <div className="d-flex justify-content-between align-items-center pt-1">
                  <div>
                    <div className="fw-bold text-body small">{sess.studentName}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{sess.studentEmail}</div>
                  </div>

                  <button
                    className="btn btn-outline-warning btn-sm fw-bold rounded-pill px-3 d-flex align-items-center gap-1"
                    onClick={() => setWarningTarget(sess)}
                  >
                    <Send size={12} /> Warn Candidate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Warning Modal */}
      {warningTarget && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content card text-body border-warning">
              <div className="modal-header border">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <AlertTriangle size={18} /> Issue Proctor Warning
                </h5>
                <button type="button" className="btn-close" aria-label="Close dialog" onClick={() => setWarningTarget(null)} />
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  Candidate: <strong className="text-body">{warningTarget.studentName}</strong> ({warningTarget.studentEmail})
                </p>

                <label className="form-label small text-muted fw-bold">Warning Message *</label>
                <textarea
                  className="form-control bg-secondary text-body border-0"
                  rows={3}
                  placeholder="e.g. Please ensure your face is fully visible in camera stream..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                />
              </div>
              <div className="modal-footer border">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setWarningTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning btn-sm fw-bold px-4" onClick={handleSendWarning}>
                  Send Warning Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveProctorDashboard;

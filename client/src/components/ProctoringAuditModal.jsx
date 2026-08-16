import React, { useState, useEffect } from 'react';
import { antiCheatAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  ShieldCheck, AlertCircle, Eye, RefreshCw, Clock,
  Copy, Maximize2, Camera, ZoomIn, X, Monitor
} from 'lucide-react';

const EVENT_ICON = {
  tab_switch: <Monitor size={13} className="text-warning" />,
  focus_lost: <Eye size={13} className="text-orange" style={{ color: '#fd7e14' }} />,
  copy_paste: <Copy size={13} className="text-danger" />,
  fullscreen_exit: <Maximize2 size={13} className="text-info" />,
};

const EVENT_COLOR = {
  tab_switch: 'warning',
  focus_lost: 'orange',
  copy_paste: 'danger',
  fullscreen_exit: 'info',
};

const ProctoringAuditModal = ({ isOpen, onClose, examId }) => {
  const [loading, setLoading] = useState(false);
  const [auditList, setAuditList] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [expandedSnapshot, setExpandedSnapshot] = useState(null);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const response = await antiCheatAPI.getAudit(examId || 'all');
        if (response.data.success) {
          setAuditList(response.data.auditList || []);
        }
      } catch (err) {
        toast.error('Failed to load Anti-Cheat Audit Logs');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen, examId]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await antiCheatAPI.getAudit(examId || 'all');
      if (response.data.success) {
        setAuditList(response.data.auditList || []);
        toast.success('Audit logs refreshed successfully');
      }
    } catch (err) {
      toast.error('Failed to refresh Anti-Cheat Audit Logs');
    } finally {
      setLoading(false);
    }
  };

  const totalTabSwitches = auditList.reduce((acc, a) => acc + (a.metrics?.tabSwitches || 0), 0);
  const totalCopyPastes = auditList.reduce((acc, a) => acc + (a.metrics?.copyPastes || 0), 0);
  const totalFullscreenExits = auditList.reduce((acc, a) => acc + (a.metrics?.fullscreenExits || 0), 0);
  const highRiskCount = auditList.filter((a) => a.riskStatus === 'High Violation Risk').length;
  const snapshotCount = auditList.reduce(
    (acc, a) => acc + (a.logs || []).filter((l) => l.snapshot).length, 0
  );

  return (
    <>
      {/* Main audit modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1050 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content text-light border border-warning shadow-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Header */}
            <div className="modal-header border-secondary d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h5 className="modal-title d-flex align-items-center gap-2 text-warning fw-bold">
                <ShieldCheck className="text-warning" size={26} />
                Proctoring &amp; Anti-Cheat Audit Console
              </h5>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                  onClick={handleRefresh}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button type="button" className="btn-close btn-close-white" onClick={onClose} />
              </div>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <RefreshCw
                    size={40}
                    className="text-warning mb-3 spinner-border"
                    style={{ width: '3rem', height: '3rem' }}
                  />
                  <h6 className="text-light fw-bold">Loading Proctoring Event Timelines...</h6>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {/* Metric Summary Cards */}
                  <div className="row g-3">
                    {[
                      { label: 'Tab Switch Events', value: totalTabSwitches, color: 'warning' },
                      { label: 'Blocked Copy-Pastes', value: totalCopyPastes, color: 'danger' },
                      { label: 'Fullscreen Exits', value: totalFullscreenExits, color: 'info' },
                      { label: 'High Violation Flags', value: highRiskCount, color: 'danger' },
                      {
                        label: 'Snapshots Captured',
                        value: snapshotCount,
                        color: 'purple',
                        icon: <Camera size={14} className="me-1" />,
                      },
                    ].map((m, idx) => (
                      <div key={idx} className="col-12 col-sm-6 col-md">
                        <div className="p-3 rounded border border-secondary text-center h-100" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <span className="text-muted small d-block mb-1">
                            {m.icon}{m.label}
                          </span>
                          <span className={`fs-4 fw-bold text-${m.color === 'purple' ? 'light' : m.color}`} style={m.color === 'purple' ? { color: '#c77dff' } : {}}>
                            {m.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Candidate Table */}
                  <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover align-middle m-0 small">
                      <thead className="sticky-top" style={{ backgroundColor: 'var(--bg-secondary)', top: 0, zIndex: 1 }}>
                        <tr className="text-muted">
                          <th>Student</th>
                          <th>Exam</th>
                          <th>Tab Switches</th>
                          <th>Copy-Pastes</th>
                          <th>Snapshots</th>
                          <th>Total Events</th>
                          <th>Proctor Status</th>
                          <th>Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-4">
                              No exam attempts found. Attempts will appear here after students start exams.
                            </td>
                          </tr>
                        ) : (
                          auditList.map((item) => {
                            const snaps = (item.logs || []).filter((l) => l.snapshot).length;
                            return (
                              <tr
                                key={item.attemptId}
                                className={item.riskStatus === 'High Violation Risk' ? 'table-danger bg-opacity-10' : ''}
                              >
                                <td>
                                  <div className="fw-bold">{item.studentName}</div>
                                  <span className="text-muted small text-truncate d-block" style={{ maxWidth: 160 }}>{item.studentEmail}</span>
                                </td>
                                <td className="text-light">{item.examTitle}</td>
                                <td className="fw-bold text-warning">{item.metrics.tabSwitches}</td>
                                <td className="fw-bold text-danger">{item.metrics.copyPastes}</td>
                                <td>
                                  {snaps > 0 ? (
                                    <span className="badge d-flex align-items-center gap-1" style={{ background: '#c77dff', color: '#fff', width: 'fit-content' }}>
                                      <Camera size={11} /> {snaps}
                                    </span>
                                  ) : (
                                    <span className="text-muted">0</span>
                                  )}
                                </td>
                                <td>{item.metrics.totalViolations} events</td>
                                <td>
                                  <span
                                    className={`badge ${item.riskStatus === 'High Violation Risk'
                                        ? 'bg-danger'
                                        : item.riskStatus === 'Moderate Warning'
                                          ? 'bg-warning text-dark'
                                          : 'bg-success'
                                      }`}
                                  >
                                    {item.riskStatus}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                                    onClick={() => setSelectedAttempt(selectedAttempt?.attemptId === item.attemptId ? null : item)}
                                  >
                                    <Eye size={14} /> {selectedAttempt?.attemptId === item.attemptId ? 'Hide' : `View (${item.logs.length})`}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ─── Event Timeline with Snapshot Thumbnails ─── */}
                  {selectedAttempt && (
                    <div className="p-3 rounded border border-warning bg-dark">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-warning fw-bold m-0 d-flex align-items-center gap-2">
                          <Clock size={18} /> Anti-Cheat Timeline: {selectedAttempt.studentName}
                        </h6>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedAttempt(null)}>
                          <X size={14} /> Close
                        </button>
                      </div>

                      {selectedAttempt.logs.length === 0 ? (
                        <p className="text-success small mb-0">
                          ✓ Clean attempt — No security violations recorded during this exam session.
                        </p>
                      ) : (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                          {selectedAttempt.logs.map((log, idx) => (
                            <div
                              key={idx}
                              className="rounded border p-3 bg-secondary bg-opacity-25"
                              style={{
                                borderColor: log.snapshot ? '#c77dff44' : '#30363d',
                              }}
                            >
                              {/* Event header row */}
                              <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                                <div className="d-flex align-items-center gap-2">
                                  <span>
                                    {EVENT_ICON[log.eventType] || <AlertCircle size={13} />}
                                  </span>
                                  <span
                                    className={`badge text-uppercase bg-${EVENT_COLOR[log.eventType] || 'secondary'}`}
                                    style={EVENT_COLOR[log.eventType] === 'orange' ? { background: '#fd7e14' } : {}}
                                  >
                                    {log.eventType?.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-light small">{log.metadata || 'Security event triggered'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  {log.snapshot && (
                                    <span className="badge d-flex align-items-center gap-1" style={{ background: '#c77dff', color: '#fff' }}>
                                      <Camera size={10} /> Snapshot
                                    </span>
                                  )}
                                  <span className="text-muted small font-monospace">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>

                              {/* Snapshot thumbnail (if captured) */}
                              {log.snapshot && (
                                <div className="mt-2 position-relative" style={{ display: 'inline-block' }}>
                                  <img
                                    src={log.snapshot}
                                    alt={`Violation snapshot #${idx + 1}`}
                                    className="rounded border"
                                    style={{
                                      maxHeight: 120,
                                      maxWidth: '100%',
                                      objectFit: 'cover',
                                      borderColor: '#c77dff88',
                                      cursor: 'pointer',
                                      transition: 'transform 0.15s',
                                    }}
                                    onClick={() => setExpandedSnapshot(log.snapshot)}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                  />
                                  <button
                                    className="position-absolute btn btn-sm d-flex align-items-center gap-1"
                                    style={{
                                      top: 4, right: 4, padding: '2px 6px',
                                      background: 'rgba(0,0,0,0.7)', color: '#c77dff', border: '1px solid #c77dff44',
                                    }}
                                    onClick={() => setExpandedSnapshot(log.snapshot)}
                                  >
                                    <ZoomIn size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer border-secondary" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>
                Close Audit Console
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Full-screen Snapshot Lightbox ─── */}
      {expandedSnapshot && (
        <div
          onClick={() => setExpandedSnapshot(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.95)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setExpandedSnapshot(null)}
              className="btn btn-sm btn-danger"
              style={{ position: 'absolute', top: -36, right: 0, zIndex: 1 }}
            >
              <X size={16} /> Close
            </button>
            <div
              className="rounded small mb-2 text-center"
              style={{ color: '#c77dff' }}
            >
              <Camera size={14} className="me-1" />
              Violation Snapshot — Click anywhere to close
            </div>
            <img
              src={expandedSnapshot}
              alt="Full violation snapshot"
              className="img-fluid rounded border"
              style={{ maxHeight: '85vh', border: '2px solid #c77dff55' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProctoringAuditModal;
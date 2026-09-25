import React from 'react';
import { Layers, Eye, Trash2, X, Clock, CheckCircle2 } from 'lucide-react';

const StudentAttemptsModal = ({
  isOpen,
  onClose,
  assessmentTitle = 'Assessment',
  studentName = 'Student',
  attemptsList = [],
  onViewAttempt,
  onDeleteAttempt,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 2040, backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content text-body border shadow-lg rounded-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header border-bottom border px-4 pt-4 pb-3">
            <div>
              <h5 className="modal-title text-info d-flex align-items-center gap-2 fw-bold m-0">
                <Layers size={22} className="text-info" />
                <span>Student Attempt History</span>
              </h5>
              <div className="text-muted small mt-1 font-monospace">
                Student: <strong className="text-body">{studentName}</strong> | Assessment: <strong className="text-info">{assessmentTitle}</strong>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={onClose} />
          </div>

          <div className="modal-body px-4 py-3" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {attemptsList.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <Layers size={36} className="mb-2 opacity-50" />
                <p className="mb-0">No attempts found for this student.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {attemptsList.map((att, idx) => (
                  <div
                    key={att.attemptId || idx}
                    className="p-3 rounded-3 bg-body-tertiary border d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 font-monospace transition-all hover-border-primary"
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary px-2.5 py-1">Attempt #{att.attemptNumber || idx + 1}</span>
                        <span className={`badge ${att.resultStatus === 'Pass' ? 'bg-success' : 'bg-danger'} px-2.5 py-1`}>
                          {att.resultStatus}
                        </span>
                        <span className="text-muted extra-small">
                          Submitted: {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-3 text-secondary small">
                        <span className="text-body fw-bold fs-6">
                          Score: <span className="text-success">{att.score}</span> / {att.totalMarks || 100} ({att.percentage}%)
                        </span>
                        {att.timeTakenMin !== undefined && (
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={14} /> {att.timeTakenMin} min
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-info btn-sm rounded-pill px-3 d-flex align-items-center gap-1 fw-bold"
                        onClick={() => onViewAttempt(att)}
                      >
                        <Eye size={14} /> View Result
                      </button>
                      {onDeleteAttempt && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-1 fw-bold"
                          onClick={() => onDeleteAttempt(att)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer border-top border px-4 py-3">
            <button type="button" className="btn btn-secondary btn-sm px-4 rounded-pill font-monospace" onClick={onClose}>
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttemptsModal;

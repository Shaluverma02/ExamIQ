import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteAttemptModal = ({
  isOpen,
  onClose,
  onConfirm,
  assessmentTitle = 'Assessment',
  studentName = 'Student',
  attemptNumber = 1,
  score = 0,
  percentage = 0,
  date = '',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 2050, backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div
          className="modal-content text-light border border-danger shadow-lg rounded-4"
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #0d0d0d 100%)', boxShadow: '0 0 35px rgba(220,53,69,0.35)' }}
        >
          <div className="modal-header border-bottom border-danger px-4 pt-4 pb-3">
            <h5 className="modal-title text-danger d-flex align-items-center gap-2 fw-bold">
              <AlertTriangle size={22} className="text-danger" />
              <span>Confirm Permanent Deletion</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading} />
          </div>

          <div className="modal-body px-4 py-3">
            <p className="fw-semibold text-light mb-3 fs-6">
              Are you sure you want to delete this test attempt record?
            </p>

            {/* Target Record Specifications Box */}
            <div className="p-3 rounded-3 bg-dark border border-secondary mb-3 font-monospace small">
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">Assessment:</span>
                <span className="text-light fw-bold">{assessmentTitle}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">Student Name:</span>
                <span className="text-info fw-bold">{studentName}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">Attempt Number:</span>
                <span className="badge bg-secondary">Attempt #{attemptNumber}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">Score / Percentage:</span>
                <span className="text-success fw-bold">{score} pts ({percentage}%)</span>
              </div>
              {date && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Date:</span>
                  <span className="text-muted">{new Date(date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Critical Warning Box */}
            <div className="alert alert-danger border border-danger shadow-sm mb-0 p-3 small">
              🚨 <strong>Warning:</strong> "This attempt result will be permanently deleted."
              <div className="extra-small text-light mt-1">
                This action cannot be undone. Other attempts and the student account will remain intact.
              </div>
            </div>
          </div>

          <div className="modal-footer border-top border-secondary px-4 py-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-4 rounded-pill font-monospace"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm px-4 rounded-pill fw-bold font-monospace d-flex align-items-center gap-1.5 shadow-sm"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Delete Attempt Result
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAttemptModal;

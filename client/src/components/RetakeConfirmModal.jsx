import React from 'react';
import { AlertCircle, RefreshCw, X, Play } from 'lucide-react';

const RetakeConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  assessmentTitle = 'Assessment',
  previousAttempts = 1,
  maxAttempts = 3,
  loading = false,
}) => {
  if (!isOpen) return null;

  const attemptsDisplay = maxAttempts && maxAttempts > 0 ? `${previousAttempts} / ${maxAttempts}` : `${previousAttempts} / Unlimited`;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 2050, backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content text-light border border-info shadow-lg rounded-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="modal-header border-bottom border-secondary px-4 pt-4 pb-3">
            <h5 className="modal-title text-info d-flex align-items-center gap-2 fw-bold">
              <RefreshCw size={22} className="text-info" />
              <span>Retake Assessment Confirmation</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading} />
          </div>

          <div className="modal-body px-4 py-3">
            <p className="fw-semibold text-light mb-3 fs-6">
              Are you sure you want to retake this assessment?
            </p>

            <div className="p-3 rounded-3 bg-dark border border-secondary mb-3 font-monospace">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Assessment:</span>
                <span className="text-info fw-bold">{assessmentTitle}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Previous Attempts:</span>
                <span className="badge bg-primary fs-6 px-3">{attemptsDisplay}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-25 text-info small">
              <AlertCircle size={16} className="me-1 mb-0.5 inline-block" />
              Starting a retake will generate a <strong>brand-new attempt</strong>. Your previous scores will remain safely stored.
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
              className="btn btn-info btn-sm px-4 rounded-pill fw-bold text-dark font-monospace d-flex align-items-center gap-1.5 shadow-sm"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" /> Starting...
                </>
              ) : (
                <>
                  <Play size={16} /> Start Retake
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetakeConfirmModal;

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

const SubmissionConfirmModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'END';

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2050, backdropFilter: 'blur(5px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
        <div
          className="modal-content text-body border-warning"
          style={{ background: 'linear-gradient(135deg, #1f1b0a 0%, #0d0d0d 100%)', boxShadow: '0 0 30px rgba(255,193,7,0.3)' }}
        >
          <div className="modal-header border px-4 pt-3 pb-2">
            <h5 className="modal-title text-warning d-flex align-items-center gap-2 fw-bold">
              <AlertTriangle size={22} />
              Confirm Test Submission
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-body px-4 py-3">
            <p className="small text-body mb-3">
              Are you sure you want to finish and submit your exam? Once submitted, your answers will be locked and finalized.
            </p>

            <div className="p-3 rounded-3 bg-body-tertiary border mb-3">
              <label className="form-label small text-warning fw-bold mb-2">
                Type <span className="badge bg-warning text-dark font-monospace px-2">END</span> to unlock final submission:
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-body border-0 font-monospace text-center fs-5 fw-bold letter-spacing-2"
                placeholder="END"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer border px-4 py-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-4 rounded-pill"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm px-4 fw-bold rounded-pill d-flex align-items-center gap-1"
              disabled={!isConfirmed || isSubmitting}
              onClick={onConfirm}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Submitting Final Exam...' : 'Confirm & End Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmModal;

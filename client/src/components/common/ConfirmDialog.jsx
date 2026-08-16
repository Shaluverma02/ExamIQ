import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary' | 'success' | 'warning'
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(11, 17, 32, 0.75)', zIndex: 2050, backdropFilter: 'blur(6px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border shadow-lg">
          <div className="modal-header px-4 pt-3 pb-2">
            <h5 className="modal-title d-flex align-items-center gap-2 fw-bold">
              <AlertTriangle size={20} className={`text-${variant}`} />
              <span>{title}</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            />
          </div>

          <div className="modal-body px-4 py-3">
            <p className="text-secondary small m-0 lh-base">{description}</p>
          </div>

          <div className="modal-footer px-4 py-3 d-flex justify-content-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
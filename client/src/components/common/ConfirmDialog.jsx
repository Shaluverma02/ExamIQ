import React, { useEffect, useRef } from 'react';
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
  variant = 'danger',
  loading = false,
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
      style={{ zIndex: 2050 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content app-confirm-dialog shadow-lg">
          <div className="modal-header px-4 pt-3 pb-2">
            <h5 className="modal-title d-flex align-items-center gap-2 fw-bold">
              <AlertTriangle size={20} className={`text-${variant}`} />
              <span>{title}</span>
            </h5>
            <button
              ref={closeButtonRef}
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

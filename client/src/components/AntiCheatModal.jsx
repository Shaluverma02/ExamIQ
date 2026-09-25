import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../services/api';
import { AlertTriangle, Camera, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';

const CAPTURE_DEBOUNCE_MS = 3000; // Minimum gap between captures (prevent spam)

const AntiCheatModal = ({ examId, onMaxViolations }) => {
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [lastSnapshot, setLastSnapshot] = useState(null); // Store latest screenshot preview for UI
  const lastCaptureTime = useRef(0);

  /**
   * Capture a screenshot of the current page using html2canvas
   * Returns a base64 data URL string or null on failure
   */
  const captureSnapshot = useCallback(async () => {
    const now = Date.now();
    if (now - lastCaptureTime.current < CAPTURE_DEBOUNCE_MS) return null;
    lastCaptureTime.current = now;

    try {
      const canvas = await html2canvas(document.body, {
        scale: 0.35, // Low scale = small file (~30-60 KB)
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#0d0d0d',
        ignoreElements: (el) => el.classList?.contains('anticheat-modal-overlay'), // Skip our own modal
      });
      return canvas.toDataURL('image/webp', 0.6);
    } catch (err) {
      console.warn('Snapshot capture failed:', err);
      return null;
    }
  }, []);

  /**
   * Log a security violation event, attaching a screenshot if available
   */
  const logViolation = useCallback(async (eventType, metadata) => {
    setViolationCount((prev) => {
      const nextCount = prev + 1;
      setWarningMessage(`⚠ Security Alert: ${eventType.replace(/_/g, ' ').toUpperCase()} detected (${nextCount}/3 Warnings)`);
      setShowWarning(true);

      if (nextCount >= 3) {
        if (onMaxViolations) {
          setTimeout(() => {
            onMaxViolations();
          }, 1200);
        }
      }
      return nextCount;
    });

    // Capture snapshot (non-blocking)
    const snapshot = await captureSnapshot();
    if (snapshot) {
      setLastSnapshot(snapshot); // Show in warning modal
    }

    try {
      await API.post(`/exams/${examId}/anticheat`, {
        eventType,
        metadata: metadata || 'Security event triggered',
        snapshot: snapshot || '',
      });
    } catch (e) {
      // ignore — don't interrupt student
    }
  }, [examId, captureSnapshot, onMaxViolations]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'Student switched to another tab or minimized the browser');
      }
    };

    const handleBlur = () => {
      // Only trigger focus_lost when NOT already handling a tab switch
      if (!document.hidden) {
        logViolation('focus_lost', 'Window focus lost — student may have switched to another app');
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      logViolation('copy_paste', `Attempted ${e.type} event blocked by proctoring engine`);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('copy_paste', 'Right-click context menu blocked by proctoring engine');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [logViolation]);

  if (!showWarning) return null;

  return (
    <div
      className="modal fade show d-block anticheat-modal-overlay"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(11, 17, 32, 0.85)', zIndex: 2050, backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div
          className="modal-content text-body border-danger shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #0d0d0d 100%)', boxShadow: '0 0 40px rgba(220,53,69,0.4)' }}
        >
          {/* Blinking red top bar */}
          <div
            className="w-100 rounded-top"
            style={{ height: 4, background: 'linear-gradient(90deg, #dc3545, #ff6b6b, #dc3545)', animation: 'pulse 1s infinite' }}
          />
          <div className="modal-header border-bottom border-danger px-4 pt-3 pb-2">
            <h5 className="modal-title text-danger d-flex align-items-center gap-2 fw-bold">
              <AlertTriangle size={20} className="text-danger" />
              <span>Proctoring Engine — Security Violation</span>
            </h5>
          </div>

          <div className="modal-body px-4 py-3">
            <p className="fw-semibold text-warning fs-6 mb-2">{warningMessage}</p>

            {violationCount >= 3 ? (
              <div className="alert alert-danger font-monospace border-danger shadow-sm mb-3">
                🚨 <strong>MAXIMUM VIOLATIONS (3/3) EXCEEDED!</strong>
                <div className="extra-small mt-1 text-body">
                  Your exam has reached the maximum allowed security violation limit (3 tab switches / focus losses). The exam is being <strong>automatically finalized & submitted</strong> to faculty immediately.
                </div>
              </div>
            ) : (
              <p className="small text-secondary mb-3">
                Your exam is being <strong className="text-body">live-monitored</strong>. Every violation is recorded with a{' '}
                <strong className="text-danger">timestamped snapshot</strong> and sent to your faculty for review. Total violations flagged:{' '}
                <strong className="text-danger" style={{ fontSize: '1.1em' }}>{violationCount} / 3</strong>
              </p>
            )}

            {/* Snapshot Preview */}
            {lastSnapshot && (
              <div
                className="p-2 rounded border mb-3"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Camera size={14} className="text-warning" />
                  <span className="small text-warning fw-bold">Snapshot Captured & Logged</span>
                  <Eye size={14} className="text-muted ms-auto" />
                </div>
                <img
                  src={lastSnapshot}
                  alt="Violation snapshot"
                  className="img-fluid rounded border-danger"
                  style={{ maxHeight: 140, width: '100%', objectFit: 'cover', opacity: 0.85 }}
                />
                <p className="text-muted small mb-0 mt-1 text-center">
                  This screenshot has been flagged to faculty
                </p>
              </div>
            )}

            <div
              className="p-2 rounded border small text-muted"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              🔒 Tab switching, alt+tabbing, copy/pasting, and right-clicking are all logged. Reaching <span className="text-danger fw-bold">3 violations</span> triggers automatic exam submission.
            </div>
          </div>

          <div className="modal-footer border-top border px-4 py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">Violation #{violationCount} recorded at {new Date().toLocaleTimeString()}</span>
            <button
              type="button"
              className="btn btn-danger btn-sm px-4 fw-bold rounded-pill"
              onClick={() => setShowWarning(false)}
            >
              I Understand — Resume Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntiCheatModal;
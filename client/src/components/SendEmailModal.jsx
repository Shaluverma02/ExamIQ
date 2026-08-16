import React, { useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Mail, Send, CheckCircle2, AlertCircle, X, Users, User, Shield } from 'lucide-react';

const SendEmailModal = ({ isOpen, onClose, defaultRecipientType = 'broadcast', defaultTargetId = '' }) => {
  const [recipientType, setRecipientType] = useState(defaultRecipientType); // 'broadcast' | 'group' | 'individual'
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.warning('Please fill in both Subject and Message body!');
      return;
    }

    try {
      setSending(true);
      const res = await API.post('/admin/send-email', {
        recipientType,
        targetId: targetId || null,
        subject,
        message,
      });

      toast.success(res.data.message || '✉️ Email notifications dispatched successfully!');
      setSubject('');
      setMessage('');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to dispatch email broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content glass-card text-light border border-primary shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark border-bottom border-secondary px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                <Mail size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-extrabold text-light m-0">
                  Instant Email Broadcast & Notification Dispatcher
                </h5>
                <p className="text-muted small m-0">Send proctored exam announcements & score updates to candidates</p>
              </div>
            </div>

            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Recipient Type */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">RECIPIENT TARGET AUDIENCE:</label>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${
                      recipientType === 'broadcast' ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setRecipientType('broadcast')}
                  >
                    <Users size={14} /> Broadcast to All Active Students
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${
                      recipientType === 'group' ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setRecipientType('group')}
                  >
                    <Shield size={14} /> Assigned Target Group
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">EMAIL SUBJECT LINE:</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-light border-secondary"
                  placeholder="e.g. 📢 Important Update: End-Term Proctored Examination Schedule"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Message Body */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">MESSAGE BODY / ANNOUNCEMENT DETAILS:</label>
                <textarea
                  rows={6}
                  className="form-control bg-secondary text-light border-secondary"
                  placeholder="Dear Candidate,&#10;&#10;Please note that your upcoming assessment is scheduled for tomorrow at 10:00 AM..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-footer border-top border-secondary px-4 py-3 justify-content-between">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary fw-bold rounded-pill px-4 d-flex align-items-center gap-2 shadow"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" /> Dispatching Emails...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Dispatch Email Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;

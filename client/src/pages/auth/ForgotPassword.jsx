import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { KeyRound, Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Password reset link sent!');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-body" style={{ maxWidth: 460, width: '100%' }}>
        <div className="text-center mb-4">
          <div className="rounded-circle bg-warning bg-opacity-15 text-warning p-3 d-inline-flex mb-3">
            <KeyRound size={32} />
          </div>
          <h3 className="fw-bold text-body m-0">Reset Password</h3>
          <p className="text-secondary small mt-2 mb-0">
            Enter your account email address and we will send you a password recovery link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="alert alert-success bg-success bg-opacity-15 text-success border-0 p-3 rounded-3 mb-4 small fw-medium">
              ✉ Password reset email dispatched! Please check your inbox and click the reset link.
            </div>
            <Link to="/login" className="btn btn-outline-primary rounded-pill px-4 fw-semibold small">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1">
                <Mail size={14} /> Registered Email Address
              </label>
              <input
                type="email"
                className="form-control py-2"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold rounded-pill d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send size={16} /> Send Recovery Link
                </>
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
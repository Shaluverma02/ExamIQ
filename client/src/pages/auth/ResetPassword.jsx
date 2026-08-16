import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { Lock, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(`/auth/reset-password/${token}`, { password });
      toast.success(res.data.message || 'Password reset successful!');

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      navigate(
        res.data.user?.role === 'admin'
          ? '/admin/dashboard'
          : res.data.user?.role === 'faculty'
            ? '/faculty/dashboard'
            : '/student/dashboard'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired password reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-body" style={{ maxWidth: 460, width: '100%' }}>
        <div className="text-center mb-4">
          <div className="rounded-circle bg-primary bg-opacity-15 text-primary p-3 d-inline-flex mb-3">
            <Lock size={32} />
          </div>
          <h3 className="fw-bold text-body m-0">Set New Password</h3>
          <p className="text-secondary small mt-2 mb-0">Enter your new account password below.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">New Password *</label>
            <input
              type="password"
              className="form-control py-2"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-secondary fw-semibold">Confirm New Password *</label>
            <input
              type="password"
              className="form-control py-2"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Updating Password...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Save New Password
              </>
            )}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-secondary small text-decoration-none fw-semibold">
              Cancel and Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
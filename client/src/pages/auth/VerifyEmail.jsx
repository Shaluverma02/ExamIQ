import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verify = async () => {
    try {
      const res = await API.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Email verification link is invalid or expired');
    }
  };

  return (
    <div className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow-sm rounded-4 p-5 bg-body text-center" style={{ maxWidth: 460, width: '100%' }}>
        {status === 'verifying' && (
          <div>
            <div className="spinner-border text-primary mb-3" style={{ width: 40, height: 40 }} role="status">
              <span className="visually-hidden">Verifying...</span>
            </div>
            <h4 className="fw-bold text-body mb-2">Account Verification</h4>
            <p className="text-secondary small mb-0">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="rounded-circle bg-success bg-opacity-15 text-success p-3 d-inline-flex mb-3">
              <CheckCircle2 size={40} />
            </div>
            <h4 className="fw-bold text-body mb-2">Account Verified!</h4>
            <p className="text-success small mb-4 fw-medium">{message}</p>
            <Link to="/login" className="btn btn-primary rounded-pill px-5 fw-semibold small shadow-sm">
              Proceed to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="rounded-circle bg-danger bg-opacity-15 text-danger p-3 d-inline-flex mb-3">
              <XCircle size={40} />
            </div>
            <h4 className="fw-bold text-body mb-2">Verification Failed</h4>
            <p className="text-danger small mb-4 fw-medium">{message}</p>
            <Link to="/login" className="btn btn-outline-primary rounded-pill px-4 fw-semibold small shadow-sm">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
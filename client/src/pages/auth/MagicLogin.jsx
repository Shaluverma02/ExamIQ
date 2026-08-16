import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';

const MagicLogin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [status, setStatus] = useState('authenticating'); // 'authenticating' | 'success' | 'error'
  const [message, setMessage] = useState('Authenticating with secure magic link...');

  useEffect(() => {
    if (token) {
      authenticateMagicLink();
    } else {
      setStatus('error');
      setMessage('No magic token provided in link URL');
    }
  }, [token]);

  const authenticateMagicLink = async () => {
    try {
      const res = await API.get(`/auth/magic-login?token=${token}`);
      setStatus('success');
      setMessage(res.data.message || 'Authenticated successfully!');

      if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);

        setTimeout(() => {
          const role = res.data.user.role;
          navigate(role === 'admin' ? '/admin/dashboard' : role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
        }, 1200);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Magic login link is invalid or expired');
    }
  };

  return (
    <div className="min-vh-100 bg-body-tertiary d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow-sm rounded-4 p-5 bg-body text-center" style={{ maxWidth: 460, width: '100%' }}>
        {status === 'authenticating' && (
          <div>
            <div className="rounded-circle bg-primary bg-opacity-15 text-primary p-3 d-inline-flex mb-3">
              <Sparkles size={36} className="spinner-grow spinner-grow-sm" />
            </div>
            <h4 className="fw-bold text-body mb-2">Magic Link Sign-In</h4>
            <p className="text-secondary small mb-0">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="rounded-circle bg-success bg-opacity-15 text-success p-3 d-inline-flex mb-3">
              <CheckCircle2 size={40} />
            </div>
            <h4 className="fw-bold text-body mb-2">Welcome Back!</h4>
            <p className="text-success small mb-4 fw-medium">{message} Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="rounded-circle bg-danger bg-opacity-15 text-danger p-3 d-inline-flex mb-3">
              <XCircle size={40} />
            </div>
            <h4 className="fw-bold text-body mb-2">Sign-In Failed</h4>
            <p className="text-danger small mb-4 fw-medium">{message}</p>
            <Link to="/login" className="btn btn-outline-primary rounded-pill px-4 fw-semibold small shadow-sm">
              Return to Login Screen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLogin;
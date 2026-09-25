import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import AuthLayout from '../../components/common/AuthLayout';

const MagicLogin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { fetchMe } = useContext(AuthContext);

  const [status, setStatus] = useState('authenticating');
  const [message, setMessage] = useState('Authenticating with secure magic link...');

  useEffect(() => {
    const authenticateMagicLink = async () => {
      try {
        const res = await API.get(`/auth/magic-login?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Authenticated successfully');

        if (res.data.token && res.data.user) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (fetchMe) await fetchMe();

          setTimeout(() => {
            const role = res.data.user.role;
            navigate(
              role === 'admin'
                ? '/admin/dashboard'
                : role === 'college_admin'
                  ? '/college-admin/dashboard'
                  : role === 'faculty'
                    ? '/faculty/dashboard'
                    : '/student/dashboard'
            );
          }, 900);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Magic login link is invalid or expired');
      }
    };

    if (token) authenticateMagicLink();
    else {
      setStatus('error');
      setMessage('No magic token provided in link URL');
    }
  }, [fetchMe, navigate, token]);

  const stateIcon =
    status === 'authenticating'
      ? <Loader2 size={38} className="animate-spin text-primary" />
      : status === 'success'
        ? <CheckCircle2 size={42} className="text-success" />
        : <XCircle size={42} className="text-danger" />;

  return (
    <AuthLayout title="Magic link sign in" description={message}>
      <div className="text-center">
        <div className="icon-box mx-auto mb-3" style={{ width: 62, height: 62 }}>
          {status === 'authenticating' ? <Sparkles size={24} className="me-1 text-primary" /> : stateIcon}
        </div>
        <p className={`small fw-semibold mb-4 ${status === 'error' ? 'text-danger' : status === 'success' ? 'text-success' : 'text-secondary'}`}>
          {status === 'success' ? `${message}. Redirecting to your dashboard...` : message}
        </p>
        {status === 'error' && (
          <Link to="/login" className="btn btn-outline-primary">
            Return to login
          </Link>
        )}
      </div>
    </AuthLayout>
  );
};

export default MagicLogin;

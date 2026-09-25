import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck, RotateCw, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import Brand from '../../components/common/Brand';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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
      toast.success(res.data.message || 'Password reset link sent');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Left panel — same visual language as login/register */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between p-5 position-relative overflow-hidden"
        style={{
          width: '42%',
          background: 'linear-gradient(155deg, #1B2A63 0%, #2C4A9B 55%, #2C7A7B 100%)',
          color: '#fff',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Brand compact inverted />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="fw-semibold mb-3" style={{ fontSize: '1.9rem', lineHeight: 1.25, maxWidth: 340 }}>
            Locked out happens. Getting back in shouldn't be hard.
          </h2>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 340 }}>
            We'll email a secure reset link to your registered address — your exams, results, and groups will be right where you left them.
          </p>

          <div className="d-flex align-items-center gap-3">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.14)' }}
            >
              <ShieldCheck size={16} />
            </span>
            <span className="small" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Reset links expire after a short window for your security
            </span>
          </div>
        </div>

        <div className="small" style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.55)' }}>
          Remembered your password after all?
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -40,
            top: '36%',
            width: 210,
            borderRadius: 16,
            padding: 16,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.18)',
            transform: 'rotate(-6deg)',
            zIndex: 1,
          }}
        >
          <div className="d-flex align-items-center gap-2 mb-2">
            <MailCheck size={16} color="#7FE0C4" />
            <span className="small fw-semibold">Reset link sent</span>
          </div>
          <div className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>name@institute.edu</div>
          <div className="small mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Expires in 30 minutes</div>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            bottom: -110,
            left: -90,
          }}
        />
      </div>

      {/* Right panel — form */}
      <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 p-4 p-md-5">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="d-lg-none mb-4">
            <Brand compact />
          </div>

          {submitted ? (
            <div className="text-center">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{ width: 56, height: 56, background: 'rgba(44, 122, 123, 0.12)' }}
              >
                <MailCheck size={26} color="#2C7A7B" />
              </span>

              <h1 className="fw-semibold mb-2" style={{ fontSize: '1.5rem' }}>Check your inbox</h1>
              <p className="text-secondary mb-1">
                We've sent a password reset link to
              </p>
              <p className="fw-semibold mb-4">{email}</p>

              <div className="d-grid gap-2">
                <Link to="/login" className="btn btn-primary rounded-pill fw-semibold">
                  Return to login
                </Link>
                <button
                  type="button"
                  className="btn btn-link text-secondary text-decoration-none small d-inline-flex align-items-center justify-content-center gap-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <RotateCw size={14} className={loading ? 'spin' : ''} />
                  {loading ? 'Resending...' : "Didn't get it? Resend link"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="fw-semibold mb-1" style={{ fontSize: '1.6rem' }}>Reset password</h1>
              <p className="text-secondary mb-4">
                Enter your account email and ExamiQ will send a recovery link.
              </p>

              <form onSubmit={handleSubmit}>
                <Input
                  label="Registered email"
                  type="email"
                  placeholder="name@institute.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                  required
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-100 mt-2 mb-3 rounded-pill fw-semibold shadow-sm"
                >
                  <Send size={16} />
                  Send recovery link
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="small text-secondary text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold"
                  >
                    <ArrowLeft size={14} />
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
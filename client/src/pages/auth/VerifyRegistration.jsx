import React, { useState } from 'react';
import { CheckCircle2, Mail, Phone, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';
import AuthLayout from '../../components/common/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const VerifyRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const verifyEmail = searchParams.get('verifyEmail') === 'true';
  const verifyPhone = searchParams.get('verifyPhone') === 'true';
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!email || (verifyEmail && emailCode.length !== 6) || (verifyPhone && phoneCode.length !== 6)) {
      toast.error('Enter each required six-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await API.post('/auth/registration/verify', { email, emailCode, phoneCode });
      toast.success(response.data?.message || 'Email and mobile number verified');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify your registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      const response = await API.post('/auth/registration/request-codes', { email });
      setEmailCode('');
      setPhoneCode('');
      toast.success(response.data?.message || 'New verification codes sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send new verification codes');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your registration"
      description="Enter the verification codes sent to your registered email and mobile number."
      eyebrow="Secure your account"
      maxWidth={520}
    >
      <div className="text-center mb-4">
        <div className="icon-box mx-auto" style={{ width: 62, height: 62 }}>
          <CheckCircle2 size={30} className="text-success" />
        </div>
      </div>

      {!email || (!verifyEmail && !verifyPhone) ? (
        <div className="alert alert-warning small">
          Registration verification details are missing. Please return to the registration page and try again.
        </div>
      ) : (
        <form onSubmit={handleVerify} className="auth-form-stack">
          <p className="small text-secondary text-center mb-1">
            {verifyEmail && <>Email code sent to <strong>{email}</strong>{verifyPhone ? ' and ' : '.'}</>}
            {verifyPhone && <>SMS code sent to your registered mobile number.</>}
          </p>
          {verifyEmail && (
            <Input
              label="Email verification code"
              icon={Mail}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              placeholder="Enter 6-digit email code"
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ''))}
            />
          )}
          {verifyPhone && (
            <Input
              label="SMS verification code"
              icon={Phone}
              type="text"
              inputMode="numeric"
              autoComplete={verifyEmail ? 'off' : 'one-time-code'}
              maxLength={6}
              required
              autoFocus={!verifyEmail}
              placeholder="Enter 6-digit SMS code"
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, ''))}
            />
          )}
          <Button type="submit" loading={loading} className="w-100">
            Verify and continue
          </Button>
          <button type="button" className="btn btn-link w-100" onClick={handleResend} disabled={resending}>
            <RefreshCw size={15} className={resending ? 'animate-spin' : ''} /> Send codes again
          </button>
        </form>
      )}

      <div className="text-center mt-4 small text-secondary">
        Already verified? <Link to="/login" className="text-primary text-decoration-none fw-semibold">Sign in</Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyRegistration;

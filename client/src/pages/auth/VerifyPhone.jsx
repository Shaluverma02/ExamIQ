import React, { useState } from 'react';
import { CheckCircle2, Phone, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';
import AuthLayout from '../../components/common/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const VerifyPhone = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!email || code.trim().length !== 6) {
      toast.error('Enter the 6-digit code sent to your mobile number');
      return;
    }
    try {
      setLoading(true);
      const response = await API.post('/auth/phone/verify', { email, code: code.trim() });
      setVerified(true);
      toast.success(response.data?.message || 'Mobile number verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify mobile number');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      const response = await API.post('/auth/phone/request-code', { email });
      toast.success(response.data?.message || 'A new code was sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send a new code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title={verified ? 'Mobile number verified' : 'Verify your mobile'} description={verified ? 'Your phone number is now connected to your ExamiQ account.' : 'Enter the 6-digit code sent to your mobile number.'}>
      <div className="text-center mb-4">
        <div className="icon-box mx-auto" style={{ width: 62, height: 62 }}>
          {verified ? <CheckCircle2 size={32} className="text-success" /> : <Phone size={27} />}
        </div>
      </div>

      {!email ? (
        <div className="alert alert-warning small">Open this page from the registration confirmation link.</div>
      ) : verified ? (
        <Link to="/login" className="btn btn-primary w-100">Continue to login</Link>
      ) : (
        <form onSubmit={handleVerify}>
          <Input label="Verification code" type="text" inputMode="numeric" maxLength={6} autoFocus required placeholder="Enter 6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
          <Button type="submit" loading={loading} className="w-100">Verify mobile</Button>
          <button type="button" className="btn btn-link w-100 mt-2" onClick={handleResend} disabled={resending}>
            <RefreshCw size={15} className={resending ? 'animate-spin' : ''} /> Send code again
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default VerifyPhone;
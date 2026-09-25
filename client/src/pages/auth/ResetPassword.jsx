import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import AuthLayout from '../../components/common/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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
      toast.success(res.data.message || 'Password reset successful');

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
    <AuthLayout title="Set new password" description="Choose a new password for your ExamiQ account.">
      <form onSubmit={handleSubmit}>
        <Input
          label="New password"
          type="password"
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          required
          autoFocus
        />

        <Input
          label="Confirm new password"
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={Lock}
          required
        />

        <Button type="submit" variant="primary" loading={loading} className="w-100 mb-3">
          <CheckCircle2 size={16} />
          Save password
        </Button>

        <div className="text-center">
          <Link to="/login" className="small text-secondary text-decoration-none fw-semibold">
            Cancel and return to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

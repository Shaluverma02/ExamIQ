import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AuthLayout from '../../components/common/AuthLayout';

const getDashboardPath = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return '/admin/dashboard';
  if (normalized === 'college_admin') return '/college-admin/dashboard';
  if (normalized === 'faculty') return '/faculty/dashboard';
  if (normalized === 'recruiter') return '/recruiter/dashboard';
  return '/student/dashboard';
};

const Login = () => {
  const { login, user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');

    try {
      setIsSubmitting(true);
      const userData = await login(email.trim().toLowerCase(), password, rememberMe);
      navigate(getDashboardPath(userData?.role), { replace: true });
    } catch (err) {
      const message = err.message || 'Invalid credentials or account issue. Please try again.';
      setError(message === 'Invalid email or password'
        ? 'Login failed. Check the email and password created for this role. Existing colleges created before admin setup need a College Admin account first.'
        : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="login" eyebrow="YOUR LEARNING JOURNEY CONTINUES" title="Welcome back." description="Sign in to your workspace and pick up where you left off.">
      <div className="eq-auth-context"><ShieldCheck size={16} /><span>Your institution. Your workspace. Your next step.</span></div>
      {error && <div className="alert alert-danger small mb-3" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form-stack" aria-busy={isSubmitting}>
        <Input label="Email address" type="email" required placeholder="name@institute.edu" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} autoComplete="username" autoFocus />
        <Input label="Password" type="password" required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} autoComplete="current-password" />
        <div className="eq-login-options">
          <label className="form-check d-flex align-items-center gap-2 small text-secondary m-0">
            <input type="checkbox" className="form-check-input mt-0" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password" className="small fw-semibold text-decoration-none">Forgot password?</Link>
        </div>
        <Button type="submit" variant="primary" loading={isSubmitting} className="w-100 mt-2">Sign in <ArrowRight size={18} /></Button>
      </form>
      <p className="eq-auth-switch">New to ExamiQ? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
};

export default Login;

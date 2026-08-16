import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Lock, Mail, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');

    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError('Invalid credentials or account issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@examportal.edu');
      setPassword('password123');
    } else if (demoRole === 'faculty') {
      setEmail('faculty@examportal.edu');
      setPassword('password123');
    } else {
      setEmail('student@examportal.edu');
      setPassword('password123');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary py-5 px-3">
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 w-100 bg-body" style={{ maxWidth: 450 }}>
        {/* Logo & Header */}
        <div className="text-center mb-4">
          <div className="rounded-3 bg-primary p-3 d-inline-block text-white mb-2 shadow-sm">
            <Terminal size={32} />
          </div>
          <h3 className="fw-bold text-body m-0">Welcome Back</h3>
          <p className="text-secondary small mt-1 mb-0">Login to continue to your examination workspace</p>
        </div>

        {/* Demo Quick Logins */}
        <div className="mb-4 bg-body-tertiary p-3 rounded-4 border text-center">
          <div className="small text-secondary fw-semibold mb-2">⚡ Demo Roles Quick Fill:</div>
          <div className="d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill fw-semibold px-3"
              onClick={() => handleDemoLogin('student')}
            >
              Student
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm rounded-pill fw-semibold px-3"
              onClick={() => handleDemoLogin('faculty')}
            >
              Faculty
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm rounded-pill fw-semibold px-3"
              onClick={() => handleDemoLogin('admin')}
            >
              Admin
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger small p-2 mb-3 border-0 rounded-3">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
          />

          <div className="d-flex align-items-center justify-content-between mb-4">
            <label className="d-flex align-items-center gap-2 small text-secondary cursor-pointer m-0 fw-medium">
              <input
                type="checkbox"
                className="form-check-input mt-0"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password" className="text-primary small text-decoration-none fw-semibold">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-100 py-2.5 rounded-pill fw-semibold shadow-sm">
            Log In <ArrowRight size={18} />
          </Button>
        </form>

        <div className="text-center mt-4 pt-3 border-top small text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary text-decoration-none fw-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
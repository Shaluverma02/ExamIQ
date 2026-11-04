import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/common/AuthLayout';

const ForgotPassword = () => (
  <AuthLayout
    mode="forgot"
    title="Password recovery unavailable."
    description="Password recovery is temporarily paused while secure email delivery is being configured."
    eyebrow="ACCOUNT RECOVERY"
    maxWidth={460}
    storyKicker="YOUR ACCOUNT, SECURED"
    storyTitle={<>A fresh start.<br /><span>When you need it.</span></>}
    storyDescription="Account recovery will be available when secure email delivery is ready. Your learning progress and achievements remain safe."
  >
    <div className="auth-forgot-state">
      <span className="auth-forgot-state-icon"><ShieldCheck size={26} /></span>
      <span className="auth-forgot-state-label">SECURE RECOVERY TEMPORARILY PAUSED</span>
      <h2>Contact your institution administrator</h2>
      <p>For your account security, a password can’t be changed using an email address alone. Please contact your administrator for help.</p>
      <Link to="/login" className="btn btn-primary auth-forgot-primary">
        Back to sign in <ArrowRight size={16} />
      </Link>
    </div>
  </AuthLayout>
);

export default ForgotPassword;

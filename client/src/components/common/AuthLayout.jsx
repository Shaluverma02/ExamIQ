import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Sparkles, ShieldCheck } from 'lucide-react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import '../../styles/public.css';
import '../../styles/auth-refresh.css';

const AuthLayout = ({ title, description, children, maxWidth = 460, eyebrow = 'Welcome to ExamiQ', mode }) => {
  return (
    <main className={`auth-shell eq-auth ${mode ? 'auth-refresh' : ''}`}>
      <aside className="auth-story">
        <Link to="/" className="text-decoration-none" aria-label="ExamiQ home">
          <Brand inverted />
        </Link>
        <div className="auth-story-content">
          <div className="auth-story-kicker"><span /> LEARN TODAY. LEAD TOMORROW.</div>
          <h2 className="auth-story-title">Big dreams.<br />Small steps.<br /><span>Start here.</span></h2>
          <p className="auth-story-description">Build your skills, take on new challenges, and turn your potential into progress.</p>
          {mode && <div className="auth-learning-art" aria-hidden="true">
            <img className="auth-learning-image" src="/auth-study.svg" alt="" />
            <span className="auth-art-code"><Code2 size={22} /> Build your skills</span>
            <span className="auth-art-spark"><Sparkles size={20} /> Ready for more</span>
          </div>}
        </div>
        <div className="auth-story-footer"><ShieldCheck size={16} /><span>One workspace. Every role. Shared progress.</span></div>
      </aside>

      <div className="auth-content">
        <div className="auth-topbar">
          <Link to="/" className="auth-mobile-brand text-decoration-none" aria-label="ExamiQ home"><Brand compact /></Link>
          <Link to="/" className="auth-home-link"><ArrowLeft size={16} /> Back to home</Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-container" style={{ '--auth-form-width': `${maxWidth}px` }}>
          <section className="auth-card" aria-labelledby="auth-title">
            {mode && <nav className="auth-mode-tabs" aria-label="Account access">
              <Link to="/login" className={mode === 'login' ? 'is-active' : ''} aria-current={mode === 'login' ? 'page' : undefined}>Sign in</Link>
              <Link to="/register" className={mode === 'register' ? 'is-active' : ''} aria-current={mode === 'register' ? 'page' : undefined}>Create account</Link>
            </nav>}
            <div className="auth-form-heading">
              <div className="page-eyebrow mb-2">{eyebrow}</div>
              <h1 id="auth-title">{title}</h1>
              {description && <p>{description}</p>}
            </div>
            {children}
          </section>
          <p className="auth-form-footer">ExamiQ · Learning, assessment, achievement.</p>
        </div>
      </div>
    </main>
  );
};

export default AuthLayout;

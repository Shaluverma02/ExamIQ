import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BarChart3, BookOpenCheck, Code2, ShieldCheck } from 'lucide-react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import '../../styles/public.css';

const AuthLayout = ({ title, description, children, maxWidth = 460, eyebrow = 'Welcome to ExamiQ' }) => {
  return (
    <main className="auth-shell eq-auth">
      <aside className="auth-story">
        <Link to="/" className="text-decoration-none" aria-label="ExamiQ home">
          <Brand inverted />
        </Link>
        <div className="auth-story-content">
          <div className="auth-story-kicker"><span /> A connected assessment platform</div>
          <h2 className="auth-story-title">Your potential.<br />One platform.<br /><span>Every next step.</span></h2>
          <p className="auth-story-description">A focused place to learn, deliver assessments, and turn results into progress.</p>
          <div className="eq-auth-journey">
            <div className="eq-auth-journey-heading"><span>Your assessment journey</span><ArrowUpRight size={16} /></div>
            {[
              [Code2, '01', 'Prepare with purpose', 'Build skills through coding practice.'],
              [BookOpenCheck, '02', 'Assess with confidence', 'Keep exams and assignments together.'],
              [BarChart3, '03', 'Understand your progress', 'Explore results and earned credentials.'],
            ].map(([Icon, number, heading, text]) => (
              <div className="eq-auth-journey-item" key={number}>
                <span className="eq-auth-journey-icon"><Icon size={20} /></span>
                <div><h3>{heading}</h3><p>{text}</p></div>
                <span className="eq-auth-journey-number">{number}</span>
              </div>
            ))}
          </div>
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

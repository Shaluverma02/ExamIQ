import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  FileCheck,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import API from '../services/api';
import Brand from '../components/common/Brand';
import ThemeToggle from '../components/common/ThemeToggle';
import '../styles/public.css';

const capabilities = [
  {
    title: 'Exam delivery',
    description: 'Faculty can build assessments, assign batches, manage schedules, and review attempts from one workspace.',
    icon: BookOpenCheck,
  },
  {
    title: 'Coding practice',
    description: 'Students get problem-solving and practice arenas with language selection, cases, and result feedback.',
    icon: Code2,
  },
  {
    title: 'Proctoring workflows',
    description: 'Live monitoring, proctor dashboards, warnings, and audit trails are grouped for exam operations.',
    icon: ShieldCheck,
  },
  {
    title: 'Certificates',
    description: 'Passing records can be issued as credentials and checked from the public verification page.',
    icon: Award,
  },
  {
    title: 'Group management',
    description: 'Admins and faculty can organize students into groups, courses, departments, and semesters.',
    icon: Layers,
  },
  {
    title: 'Analytics',
    description: 'Dashboards summarize users, exams, submissions, scores, and performance trends.',
    icon: BarChart3,
  },
];

const steps = [
  'Create question banks and exams',
  'Assign students, groups, and retake rules',
  'Run assessments with monitoring tools',
  'Review results, exports, and certificates',
];

const faqs = [
  {
    q: 'Who uses ExamiQ?',
    a: 'Students, faculty, and administrators each get a dedicated workspace for learning, assessment, and institution management.',
  },
  {
    q: 'Does it support coding exams?',
    a: 'Yes. Faculty can manage coding questions and assessments, and students can build their skills in dedicated practice arenas.',
  },
  {
    q: 'Can certificates be verified publicly?',
    a: 'Yes. Enter a certificate ID below to check an issued credential. You do not need to sign in to verify a certificate.',
  },
];

const defaultOverview = {
  stats: [
    { label: 'Active Students', value: '-' },
    { label: 'Faculty', value: '-' },
    { label: 'Published Exams', value: '-' },
    { label: 'Avg Score', value: '-' },
  ],
  recentAssessments: [],
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [overview, setOverview] = useState(defaultOverview);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewUnavailable, setOverviewUnavailable] = useState(false);
  const [certificateId, setCertificateId] = useState('');

  useEffect(() => {
    let alive = true;

    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        const res = await API.get('/public/overview');
        if (alive) {
          setOverview({
            stats: res.data?.stats?.length ? res.data.stats : defaultOverview.stats,
            recentAssessments: res.data?.recentAssessments || [],
          });
        }
      } catch (err) {
        if (alive) {
          setOverview(defaultOverview);
          setOverviewUnavailable(true);
        }
      } finally {
        if (alive) setOverviewLoading(false);
      }
    };

    loadOverview();
    return () => {
      alive = false;
    };
  }, []);

  const handleCertificateSearch = (e) => {
    e.preventDefault();
    const value = certificateId.trim();
    if (value) navigate(`/verify-certificate/${encodeURIComponent(value)}`);
  };

  return (
    <div className="landing-page eq-public">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <nav className="landing-container landing-nav" aria-label="Main navigation">
          <Link to="/" className="text-decoration-none" aria-label="ExamiQ home"><Brand /></Link>
          <div id="public-navigation" className={`landing-nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#portals" onClick={() => setMenuOpen(false)}>For your role</a>
            <a href="#verify" onClick={() => setMenuOpen(false)}>Verify certificate</a>
          </div>
          <div className="landing-nav-actions">
            <ThemeToggle />
            <Link to="/login" className="landing-signin">Sign in</Link>
            <Link to="/register" className="btn btn-primary">Get started <ArrowUpRight size={16} /></Link>
            <button type="button" className="eq-public-menu" aria-expanded={menuOpen} aria-controls="public-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="landing-container landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><span /> The connected assessment platform</span>
            <h1 className="landing-headline">Great learning.<br />Better assessment.<br /><span>All in one place.</span></h1>
            <p className="landing-lead">Bring exams, coding practice, and results together. Give every student a clear path forward, and every institution the tools to guide them.</p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get started <ArrowRight size={19} /></Link>
              <Link to="/login" className="eq-public-secondary">Open your workspace <ArrowUpRight size={17} /></Link>
            </div>
            <div className="landing-audience"><span><CheckCircle2 size={16} /> Role-based workspaces</span><span><CheckCircle2 size={16} /> Connected results</span></div>
          </div>

          <div className="landing-preview-wrap">
            <div className="landing-preview">
              <div className="landing-preview-topbar"><span><span className="landing-preview-dot" /> ExamiQ workspace</span><span className="eq-preview-avatar" aria-hidden="true">EQ</span></div>
              <div className="eq-preview-layout">
              <aside className="eq-preview-sidebar" aria-label="Platform preview"><span className="eq-preview-side-active"><LayoutDashboard size={17} /><span>Overview</span></span><span><BookOpenCheck size={17} /><span>Assessments</span></span><span><Code2 size={17} /><span>Practice</span></span><span><BarChart3 size={17} /><span>Results</span></span><span><Award size={17} /><span>Certificates</span></span><div className="eq-preview-side-footer"><ShieldCheck size={18} /><small>A workspace for<br />every next step.</small></div></aside>
              <div className="landing-preview-body">
                <div className="landing-preview-heading">
                  <div><div className="page-eyebrow">Platform overview</div><h2>Progress starts here.</h2></div>
                  <span className="landing-preview-heading-icon"><BarChart3 size={23} /></span>
                </div>
                <div className="landing-preview-stats" aria-busy={overviewLoading}>
                  {overview.stats.map((item, index) => {
                    const Icon = [Users, GraduationCap, BookOpenCheck, BarChart3][index % 4];
                    return <div className="landing-preview-stat" key={item.label}><Icon size={18} /><strong>{overviewLoading ? '…' : item.value}</strong><span>{item.label}</span></div>;
                  })}
                </div>
                <div className="landing-assessment-heading"><h3>Recent assessments</h3><span>{overviewLoading ? 'Loading' : overviewUnavailable ? 'Unavailable' : 'Platform activity'}</span></div>
                <div className="landing-assessment-list" aria-live="polite" aria-busy={overviewLoading}>
                  {overviewLoading ? (
                    <div className="landing-preview-empty"><BookOpenCheck size={27} /><p>Loading current assessments…</p></div>
                  ) : overviewUnavailable ? (
                    <div className="landing-preview-empty"><BookOpenCheck size={27} /><p>Platform activity is unavailable right now.</p><span>You can still open your workspace to continue.</span></div>
                  ) : overview.recentAssessments.length === 0 ? (
                    <div className="landing-preview-empty"><BookOpenCheck size={27} /><p>Your next challenge is on its way.</p><span>Published assessments will appear here.</span></div>
                  ) : overview.recentAssessments.map((exam) => (
                    <div className="landing-assessment" key={exam.id}>
                      <span className="landing-assessment-icon"><FileCheck size={19} /></span>
                      <div className="landing-assessment-info"><strong>{exam.title}</strong><span>{exam.category} · {exam.totalMarks || 0} marks</span></div>
                      <span className={`badge ${exam.status === 'Open' ? 'bg-success' : 'bg-secondary'}`}>{exam.status}</span>
                    </div>
                  ))}
                </div>
                <Link to="/login" className="landing-preview-link">Find your next assessment <ArrowRight size={16} /></Link>
              </div>
              </div>
            </div>
            <div className="landing-preview-note"><span className="landing-note-icon"><ShieldCheck size={21} /></span><div><strong>From practice to achievement</strong><span>One connected learning experience.</span></div></div>
          </div>
        </section>

        <div className="eq-platform-strip"><div className="landing-container"><span>BUILT AROUND YOUR WORKFLOW</span><div><BookOpenCheck size={19} /> Assessments</div><div><Code2 size={19} /> Coding practice</div><div><ShieldCheck size={19} /> Proctoring</div><div><BarChart3 size={19} /> Analytics</div></div></div>

        <section id="platform" className="landing-container landing-section">
          <div className="landing-section-heading">
            <div><div className="page-eyebrow">One platform, more possibilities</div><h2>Everything you need.<br />Working together.</h2></div>
            <p>Bring the everyday work of learning and assessment together, from the first question to the final result.</p>
          </div>
          <div className="landing-capability-grid">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article className="landing-capability" key={item.title}><span className="landing-capability-icon"><Icon size={23} /></span><h3>{item.title}</h3><p>{item.description}</p></article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="landing-container landing-section">
          <div className="landing-workflow">
            <div className="landing-workflow-copy">
              <div className="page-eyebrow">A clear path from start to finish</div>
              <h2>Less admin.<br />More impact.</h2>
              <p>Set up, run, and review your assessments in one connected workflow.</p>
              <Link to="/register" className="btn btn-primary">Create your account <ArrowUpRight size={17} /></Link>
            </div>
            <ol className="landing-steps">{steps.map((step, index) => <li className="landing-step" key={step}><span className="landing-step-number">0{index + 1}</span><span>{step}</span><ArrowUpRight size={18} /></li>)}</ol>
          </div>
        </section>

        <section id="portals" className="landing-container landing-section">
          <div className="landing-section-heading"><div><div className="page-eyebrow">Designed for your role</div><h2>Your work. Your workspace.</h2></div><p>A dedicated experience for everyone who makes learning happen.</p></div>
          <div className="landing-role-grid">
            {[
              ['Students', 'Build confidence, one challenge at a time.', 'Practice, exams, results, certificates, and leaderboards.', Users],
              ['Faculty', 'Turn your expertise into their next step.', 'Exam builder, assignments, question banks, and analytics.', Terminal],
              ['Administrators', 'Keep your institution moving together.', 'Users, groups, categories, audit logs, and system analytics.', ShieldCheck],
            ].map(([title, subtitle, description, Icon]) => (
              <Link to="/login" className="landing-role" key={title}><div className="landing-role-top"><span className="landing-role-icon"><Icon size={24} /></span><ArrowUpRight size={21} /></div><div className="page-eyebrow">For {title.toLowerCase()}</div><h3>{subtitle}</h3><p>{description}</p><span className="landing-role-action">Open {title === 'Administrators' ? 'admin' : title === 'Students' ? 'student' : 'faculty'} portal <ArrowRight size={16} /></span></Link>
            ))}
          </div>
        </section>

        <section className="landing-container landing-section landing-faq-layout">
          <div><div className="page-eyebrow">Good to know</div><h2>A few answers<br />before you begin.</h2><p className="text-secondary">Get familiar with your new workspace.</p></div>
          <div className="landing-faqs">
            {faqs.map((faq, index) => (
              <div className={`landing-faq ${openFaq === index ? 'is-open' : ''}`} key={faq.q}>
                <h3><button id={`faq-question-${index}`} type="button" className="landing-faq-button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`}><span>{faq.q}</span>{openFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button></h3>
                <div id={`faq-answer-${index}`} className="landing-faq-answer" role="region" aria-labelledby={`faq-question-${index}`} hidden={openFaq !== index}><p>{faq.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="verify" className="landing-container landing-section">
          <div className="landing-verify">
            <span className="landing-verify-icon"><Award size={32} /></span>
            <div className="landing-verify-copy"><div className="page-eyebrow">Achievement, verified</div><h2>A credential you can check.</h2><p>Have an ExamiQ certificate? Enter its ID to verify it.</p></div>
            <form className="landing-verify-form" onSubmit={handleCertificateSearch}><label htmlFor="certificate-id" className="visually-hidden">Certificate ID</label><input id="certificate-id" className="form-control" value={certificateId} onChange={(e) => setCertificateId(e.target.value)} placeholder="Enter certificate ID" required /><button className="btn btn-primary" type="submit"><Search size={17} /> Verify</button></form>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <Link to="/" className="text-decoration-none" aria-label="ExamiQ home"><Brand /></Link>
          <span>Learning, assessment, achievement.</span>
          <div><a href="#verify">Verify a certificate</a><span>© {new Date().getFullYear()} ExamiQ</span></div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

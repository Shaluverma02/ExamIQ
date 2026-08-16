import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Terminal,
  Shield,
  Award,
  Cpu,
  Code2,
  ArrowRight,
  CheckCircle2,
  Users,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Play,
  FileCheck,
  Layers,
  Globe,
  Check,
  CheckSquare,
  Bot,
  Brain,
  ShieldAlert,
  FileText,
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'How does the proctored anti-cheating security engine work?',
      a: 'ExamiQ enforces strict fullscreen lockout, window focus loss detection, copy-paste blocking, and live WebRTC webcam monitoring with snapshot logging. A maximum of 4 security violations triggers automatic exam submission immediately.',
    },
    {
      q: 'Which programming languages are supported in the isolated Code Judge?',
      a: 'Our sandboxed code judge supports Python 3, JavaScript (Node.js), C++ (g++), C (gcc), and Java (OpenJDK). Each submission is evaluated against custom hidden test cases with strict CPU time & memory limits.',
    },
    {
      q: 'How does the Retake Assessment feature and score tracking work?',
      a: 'Assessments can be configured with customizable retake rules (allowRetake & maxAttempts). Retaking an assessment creates a brand-new attempt without overwriting previous scores. Faculty can view both Best Score and Latest Score per student.',
    },
    {
      q: 'How are completion certificates verified by third parties?',
      a: 'Every passing certificate includes a unique cryptographic Verification ID and a scannable QR Code routing to an authentic online credential validation page.',
    },
  ];

  return (
    <div className="landing-page-root min-vh-100 d-flex flex-column" style={{ backgroundColor: '#070b14', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Background Glow Elements */}
      <div
        className="position-fixed top-0 start-50 translate-middle-x pointer-events-none"
        style={{
          width: '90vw',
          height: '550px',
          background: 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.25) 0%, rgba(14, 165, 233, 0.12) 40%, rgba(7, 11, 20, 0) 75%)',
          zIndex: 0,
        }}
      />

      {/* Header / Navbar */}
      <header className="px-4 px-md-5 py-3 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-30 sticky-top backdrop-blur" style={{ zIndex: 100, backgroundColor: 'rgba(11, 17, 32, 0.92)' }}>
        <div className="d-flex align-items-center gap-3 style-cursor-pointer" onClick={() => navigate('/')}>
          <div className="rounded-3 p-2 text-white shadow-lg d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)' }}>
            <Terminal size={24} />
          </div>
          <span className="fs-3 fw-extrabold tracking-tight landing-text-bright">
            Exami<span style={{ color: '#38bdf8' }}>Q</span>
            <span className="badge ms-2 fs-6 px-2.5 py-0.5 font-monospace landing-badge-pill">PRO</span>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2.5">
          <Link
            to="/login"
            className="btn px-4 py-2 fw-bold rounded-pill font-monospace small transition-all landing-btn-signin"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="btn px-4 py-2 fw-extrabold rounded-pill font-monospace small shadow-lg border-0"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', color: '#ffffff' }}
          >
            Get Started 🚀
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-5 text-center position-relative" style={{ zIndex: 10 }}>
        {/* Top Hero Pill Badge */}
        <div className="d-inline-flex align-items-center gap-2 px-3.5 py-1.5 rounded-pill mb-4 font-monospace extra-small fw-bold landing-badge-pill">
          <Sparkles size={15} style={{ color: '#fbbf24' }} className="animate-pulse" />
          <span style={{ color: '#38bdf8' }}>Next-Gen Assessment & Live Sandboxed Coding Arena</span>
        </div>

        {/* Hero Heading (Explicit Pure White + Gradient Highlight) */}
        <h1 className="display-3 fw-extrabold mb-4 leading-tight landing-text-bright" style={{ maxWidth: 960, margin: '0 auto', fontSize: '3.4rem', color: '#ffffff' }}>
          Empowering Institutions with{' '}
          <span
            className="landing-text-gradient"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            Proctored Exams
          </span>{' '}
          & Code Evaluation
        </h1>

        {/* Subheading Paragraph (Explicit High-Contrast Bright Slate) */}
        <p className="lead mb-5 mx-auto font-medium landing-text-slate" style={{ maxWidth: 780, fontSize: '1.15rem', color: '#cbd5e1' }}>
          All-in-one assessment platform featuring WebRTC camera proctoring, 4-warning anti-cheat auto-submission, 5-language sandboxed code judge, student retake rules, and QR-verified credentials.
        </p>

        {/* CTA Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
          <Link
            to="/login"
            className="btn btn-lg px-5 py-3 rounded-pill fw-extrabold d-flex align-items-center gap-2 shadow-lg border-0 transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', color: '#ffffff' }}
          >
            Enter Student Portal <ArrowRight size={20} />
          </Link>
          <Link
            to="/register"
            className="btn btn-lg px-5 py-3 rounded-pill fw-extrabold transition-all landing-btn-white"
          >
            Faculty & Admin Access
          </Link>
        </div>

        {/* Live Interactive Code Assessment Mock Preview */}
        <div className="my-5 rounded-4 border border-secondary border-opacity-60 shadow-lg p-3 text-start mx-auto" style={{ maxWidth: 980, background: 'linear-gradient(135deg, #0f172a 0%, #070b14 100%)' }}>
          {/* Mock Window Header */}
          <div className="px-3 py-2 border-bottom border-secondary border-opacity-40 d-flex align-items-center justify-content-between bg-black bg-opacity-40 rounded-top-3">
            <div className="d-flex align-items-center gap-2">
              <span className="rounded-circle bg-danger d-inline-block" style={{ width: 10, height: 10 }} />
              <span className="rounded-circle bg-warning d-inline-block" style={{ width: 10, height: 10 }} />
              <span className="rounded-circle bg-success d-inline-block" style={{ width: 10, height: 10 }} />
              <span className="extra-small font-monospace ms-2 landing-text-muted">ExamiQ Sandboxed Coding Workspace — Problem #102</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge px-2.5 py-1 font-monospace extra-small d-flex align-items-center gap-1" style={{ backgroundColor: 'rgba(22, 163, 74, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.4)' }}>
                <CheckCircle2 size={12} /> AI Proctoring Active
              </span>
              <span className="badge font-monospace extra-small" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>Time: 24:18 Mins</span>
            </div>
          </div>

          {/* Mock IDE Layout */}
          <div className="row g-0">
            {/* Left Mock Problem Spec */}
            <div className="col-12 col-md-5 p-3 border-end border-secondary border-opacity-40 bg-dark bg-opacity-30 font-monospace">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge px-2 py-0.5 extra-small" style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>EASY</span>
                <span className="extra-small fw-bold" style={{ color: '#38bdf8' }}>Marks: 20 pts</span>
              </div>
              <h6 className="fw-bold mb-2 landing-text-bright">Two Sum — Pair Search</h6>
              <p className="extra-small mb-3 landing-text-slate">
                Given an array of integers <code style={{ color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>nums</code> and an integer <code style={{ color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>target</code>, return indices of the two numbers such that they add up to target.
              </p>
              <div className="p-2 rounded border border-secondary extra-small mb-2" style={{ backgroundColor: '#000000' }}>
                <div landing-text-muted>Input: nums = [2,7,11,15], target = 9</div>
                <div className="fw-bold" style={{ color: '#4ade80' }}>Output: [0,1]</div>
              </div>
            </div>

            {/* Right Mock Code Editor */}
            <div className="col-12 col-md-7 p-3 font-monospace extra-small" style={{ backgroundColor: '#000000' }}>
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ color: '#94a3b8' }}>
                <span>Language: <strong style={{ color: '#38bdf8' }}>Python 3</strong></span>
                <span className="fw-bold" style={{ color: '#4ade80' }}>Status: Passed (10/10 Test Cases)</span>
              </div>
              <pre className="m-0 leading-relaxed landing-text-bright" style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#60a5fa' }}>def</span> <span style={{ color: '#fbbf24' }}>twoSum</span>(nums, target):{'\n'}
                {'    '}hashmap = &#123;&#125;{'\n'}
                {'    '}<span style={{ color: '#60a5fa' }}>for</span> i, n <span style={{ color: '#60a5fa' }}>in</span> <span style={{ color: '#38bdf8' }}>enumerate</span>(nums):{'\n'}
                {'        '}diff = target - n{'\n'}
                {'        '}<span style={{ color: '#60a5fa' }}>if</span> diff <span style={{ color: '#60a5fa' }}>in</span> hashmap:{'\n'}
                {'            '}<span style={{ color: '#60a5fa' }}>return</span> [hashmap[diff], i]{'\n'}
                {'        '}hashmap[n] = i{'\n'}
                {'    '}<span style={{ color: '#60a5fa' }}>return</span> []
              </pre>
            </div>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="row g-3 w-100 my-5">
          <div className="col-6 col-md-3">
            <div className="p-3.5 rounded-4 border border-secondary text-center shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="fw-extrabold m-0" style={{ color: '#3b82f6' }}>99.9%</h2>
              <div className="font-monospace mt-1 small landing-text-slate">Judge Accuracy</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3.5 rounded-4 border border-secondary text-center shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="fw-extrabold m-0" style={{ color: '#38bdf8' }}>5+</h2>
              <div className="font-monospace mt-1 small landing-text-slate">Compiler Engines</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3.5 rounded-4 border border-secondary text-center shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="fw-extrabold m-0" style={{ color: '#fbbf24' }}>4 Max</h2>
              <div className="font-monospace mt-1 small landing-text-slate">Violation Auto-Submit</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3.5 rounded-4 border border-secondary text-center shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="fw-extrabold m-0" style={{ color: '#4ade80' }}>Instant</h2>
              <div className="font-monospace mt-1 small landing-text-slate">QR Verified Credentials</div>
            </div>
          </div>
        </div>

        {/* Core Capabilities Grid */}
        <div className="my-5 pt-3 text-start">
          <div className="text-center mb-5">
            <h2 className="fw-extrabold landing-text-bright">Built for High-Stakes Assessments</h2>
            <p className="small landing-text-slate">Comprehensive tools engineered for academic excellence and technical evaluation.</p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6' }}>
                  <Code2 size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">Isolated Code Judge</h5>
                <p className="small m-0 landing-text-slate">
                  Sandboxed execution for C, C++, Java, Python, and JavaScript with custom test cases, memory limits, and diagnostic logs.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#f87171' }}>
                  <ShieldAlert size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">Anti-Cheat & Proctoring</h5>
                <p className="small m-0 landing-text-slate">
                  Fullscreen lockout, focus loss detection, WebRTC webcam monitoring, and 4-warning automatic exam submission engine.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(22, 163, 74, 0.2)', color: '#4ade80' }}>
                  <Award size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">QR Verified Credentials</h5>
                <p className="small m-0 landing-text-slate">
                  Generate high-resolution course completion certificates with unique ID verification badges and scannable QR verification.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24' }}>
                  <Layers size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">Multi-Attempt Score Matrix</h5>
                <p className="small m-0 landing-text-slate">
                  Configurable retake rules (allowRetake & maxAttempts). View Best Score vs Latest Score for every student with Excel exports.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8' }}>
                  <Users size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">Student Batch Governance</h5>
                <p className="small m-0 landing-text-slate">
                  Effortlessly divide candidates into structured batches and manage user roles (Admin, Faculty, Student) with roll number governance.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 h-100 rounded-4 border border-secondary transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="p-3 rounded-3 d-inline-block mb-3" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                  <Brain size={26} />
                </div>
                <h5 className="fw-bold mb-2 landing-text-bright">AI Code Review & Analytics</h5>
                <p className="small m-0 landing-text-slate">
                  Instant AI time/space complexity analysis ($O(N)$), edge cases breakdown, and personalized study roadmaps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-100 my-5 pt-4 text-start mx-auto" style={{ maxWidth: 880 }}>
          <h3 className="fw-extrabold text-center mb-4 landing-text-bright">Frequently Asked Questions</h3>
          <div className="d-flex flex-column gap-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-4 border border-secondary p-4 transition-all" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
                <div
                  className="d-flex justify-content-between align-items-center cursor-pointer fw-bold fs-6 landing-text-bright"
                  onClick={() => toggleFaq(idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={20} style={{ color: '#38bdf8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
                </div>
                {openFaq === idx && (
                  <p className="small mt-3 m-0 pt-3 border-top border-secondary border-opacity-40 leading-relaxed font-medium landing-text-slate">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-top border-secondary border-opacity-40 text-center small mt-auto" style={{ backgroundColor: '#000000', color: '#94a3b8' }}>
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <Terminal size={18} style={{ color: '#38bdf8' }} />
            <span className="fw-bold landing-text-bright">ExamiQ Educational Assessment System</span>
          </div>
          <div>© 2026 ExamiQ Platform. All Rights Reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

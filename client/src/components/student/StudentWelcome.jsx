import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code2, GraduationCap, Mic, Sparkles, Trophy } from 'lucide-react';

const shortcuts = [
  { to: '/student/problem-solving', icon: Code2, title: 'Solve a problem', detail: 'Sharpen your coding skills', tone: 'indigo' },
  { to: '/student/ai-interview', icon: Sparkles, title: 'Ace your interview', detail: 'Practice with AI feedback', tone: 'mint' },
  { to: '/student/versant', icon: Mic, title: 'Find your voice', detail: 'Build communication skills', tone: 'peach' },
];

export default function StudentWelcome({ greeting, name }) {
  return (
    <>
      <header className="student-welcome-hero">
        <div className="student-welcome-copy">
          <span className="student-hero-label"><span /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>{greeting}, <span>{name}.</span></h1>
          <p>Small steps. Big possibilities.<br />Build your skills and get ready for what comes next.</p>
          <div className="student-hero-actions">
            <Link className="btn btn-light" to="/student/exams">My assessments <ArrowRight size={17} /></Link>
            <Link className="student-hero-secondary" to="/student/problem-solving">Explore practice <ArrowRight size={16} /></Link>
          </div>
          <span className="student-hero-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}</span>
        </div>
        <div className="student-hero-art" aria-hidden="true">
          <div className="student-orbit student-orbit-outer" />
          <div className="student-orbit student-orbit-inner" />
          <div className="student-art-core"><GraduationCap size={70} strokeWidth={1.35} /><span>Learn. Grow. Shine.</span></div>
          <div className="student-art-badge student-art-code"><Code2 size={25} /><span>Keep building</span></div>
          <div className="student-art-badge student-art-trophy"><Trophy size={24} /><span>Aim higher</span></div>
          <div className="student-art-book"><BookOpen size={26} /></div>
          <span className="student-art-star"><Sparkles size={25} /></span>
        </div>
      </header>
      <nav className="student-quick-start" aria-label="Start learning">
        {shortcuts.map(({ to, icon: Icon, title, detail, tone }) => (
          <Link key={to} to={to} className={`student-shortcut is-${tone}`}>
            <span className="student-shortcut-icon"><Icon size={22} strokeWidth={1.8} /></span>
            <span><strong>{title}</strong><small>{detail}</small></span>
            <ArrowRight size={17} className="student-shortcut-arrow" />
          </Link>
        ))}
      </nav>
    </>
  );
}

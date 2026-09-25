import React, { useContext, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Building,
  Building2,
  Camera,
  CheckSquare,
  ClipboardList,
  Code2,
  Cpu,
  FileCheck,
  FileQuestion,
  Layers,
  LayoutDashboard,
  PlusCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Brand from '../components/common/Brand';

const studentSections = [
  {
    title: 'Learn',
    items: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Problem Solving', path: '/student/problem-solving', icon: Brain },
      { label: 'Practice', path: '/student/practice', icon: Cpu },
      { label: 'AI Interview Prep', path: '/student/ai-interview', icon: Bot },
      { label: 'Versant', path: '/student/versant', icon: Sparkles },
    ],
  },
  {
    title: 'Assessments',
    items: [
      { label: 'Assessments', path: '/student/exams', icon: CheckSquare },
      { label: 'Results', path: '/student/results', icon: FileCheck },
      { label: 'Certificates', path: '/student/certificates', icon: Award },
      { label: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
    ],
  },
];

const facultySections = [
  {
    title: 'Assessment Ops',
    items: [
      { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard, end: true },
      { label: 'Create Exam', path: '/faculty/exams/create', icon: PlusCircle, end: true },
      { label: 'Manage Exams', path: '/faculty/exams', icon: BookOpen, end: true },
      { label: 'Assign Exam', path: '/faculty/exam-assignments', icon: ClipboardList, end: true },
      { label: 'Groups & Batches', path: '/faculty/groups', icon: Layers, end: true },
      { label: 'Results', path: '/faculty/results', icon: FileCheck, end: true },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Question Bank', path: '/faculty/questions', icon: FileQuestion, end: true },
      { label: 'Coding Questions', path: '/faculty/coding', icon: Code2, end: true },
      { label: 'AI Question Gen', path: '/faculty/ai-generator', icon: Sparkles, end: true },
      { label: 'Plagiarism Detector', path: '/faculty/plagiarism', icon: ShieldAlert, end: true },
      { label: 'Live Monitoring', path: '/faculty/live-monitor', icon: Camera, end: true },
      { label: 'Live Proctor Center', path: '/faculty/proctor', icon: ShieldAlert, end: false },
      { label: 'Analytics', path: '/faculty/analytics', icon: BarChart3, end: true },
    ],
  },
];

const adminSections = [
  {
    title: 'Administration',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Colleges', path: '/admin/colleges', icon: Building },
      { label: 'Users & Forms', path: '/admin/users', icon: Users },
      { label: 'Groups & Batches', path: '/admin/groups', icon: Layers },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
      { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
      { label: 'Live Monitoring', path: '/faculty/live-monitor', icon: Camera },
    ],
  },
];

const collegeAdminSections = [
  {
    title: 'College Management',
    items: [
      { label: 'Dashboard', path: '/college-admin/dashboard', icon: LayoutDashboard },
      { label: 'Faculty & Students', path: '/college-admin/users', icon: Users },
      { label: 'Groups & Batches', path: '/college-admin/groups', icon: Layers },
      { label: 'Courses & Categories', path: '/college-admin/categories', icon: Settings },
      { label: 'Analytics', path: '/college-admin/analytics', icon: BarChart3 },
      { label: 'Live Monitoring', path: '/faculty/live-monitor', icon: Camera },
    ],
  },
];

const recruiterSections = [
  {
    title: 'Talent Operations',
    items: [
      { label: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
      { label: 'Hiring Drives', path: '/recruiter/drives', icon: Building2 },
      { label: 'Talent Pool', path: '/recruiter/talent', icon: Users },
      { label: 'Cutoff Rules', path: '/recruiter/rules', icon: ShieldCheck },
      { label: 'Reports', path: '/recruiter/reports', icon: BarChart3 },
    ],
  },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const { role, user, activeCollege } = useContext(AuthContext);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const getFocusable = () => Array.from(drawerRef.current?.querySelectorAll('a[href], button:not([disabled]), select, [tabindex="0"]') || []);
    getFocusable()[0]?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && onClose) onClose();
      if (event.key === 'Tab') {
        const elements = getFocusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen && onClose) return null;

  const currentRole = (role || user?.role || 'student').toLowerCase();
  const roleRoutePrefix = currentRole === 'college_admin' ? 'college-admin' : currentRole;
  const sections = currentRole === 'student'
    ? studentSections
    : currentRole === 'admin'
      ? adminSections
      : currentRole === 'college_admin'
        ? collegeAdminSections
        : currentRole === 'recruiter'
          ? recruiterSections
          : facultySections;

  const navLinkClass = ({ isActive }) =>
    `nav-link sidebar-nav-link d-flex align-items-center gap-2 px-3 py-2 fw-semibold ${isActive ? 'active' : ''}`;

  const content = (
    <aside className="app-sidebar d-flex flex-column w-100">
      <div className="sidebar-brand-row">
        <Link to={`/${roleRoutePrefix}/dashboard`} onClick={onClose} className="text-decoration-none" aria-label="ExamiQ dashboard"><Brand /></Link>
        {isOpen && <button type="button" className="theme-toggle" onClick={onClose} aria-label="Close navigation"><X size={19} /></button>}
      </div>
      <div className="sidebar-workspace d-flex align-items-center justify-content-between gap-2">
        <div className="min-width-0 w-100">
          <div className="d-flex align-items-center gap-2">
            <span className="icon-box flex-shrink-0" style={{ width: 38, height: 38 }}>
              <Building2 size={18} />
            </span>
            <div className="min-width-0">
              <div className="sidebar-label">{currentRole.replace('_', ' ')} workspace</div>
              <div className="fw-bold text-truncate">{activeCollege?.name || 'ExamIQ Workspace'}</div>
            </div>
          </div>
        </div>

      </div>

      <nav className="sidebar-nav flex-grow-1 overflow-y-auto" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-label px-3 mb-2">{section.title}</div>
            <div className="nav nav-pills flex-column gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end ?? true}
                    onClick={onClose}
                    className={navLinkClass}
                  >
                    <Icon size={19} strokeWidth={1.75} />
                    <span className="text-truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="profile-avatar" aria-hidden="true">{(user?.name || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
        <div className="min-width-0">
          <strong className="d-block text-truncate">{user?.name || 'Your workspace'}</strong>
          <small>{currentRole.replace('_', ' ')} account</small>
        </div>
      </div>
    </aside>
  );

  if (!isOpen) return content;

  return (
    <div className="d-lg-none">
      <div
        className="mobile-sidebar-backdrop position-fixed top-0 start-0 w-100 h-100"
        onMouseDown={onClose}
      />
      <div
        id="mobile-navigation"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
        className="mobile-sidebar-drawer"
      >
        {content}
      </div>
    </div>
  );
};

export default Sidebar;

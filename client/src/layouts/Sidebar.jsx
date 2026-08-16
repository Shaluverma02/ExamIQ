import React, { useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  PlusCircle,
  FileQuestion,
  BarChart3,
  Settings,
  ShieldCheck,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  CheckSquare,
  FileCheck,
  Bot,
  Brain,
  X,
  LogOut,
  ClipboardList,
  Code2,
  Camera,
} from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { role, user, logout } = useContext(AuthContext);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const studentSections = [
    {
      title: 'UP SKILL',
      items: [
        { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={17} /> },
        { label: 'Problem Solving', path: '/student/problem-solving', icon: <Brain size={17} /> },
        { label: 'Results', path: '/student/results', icon: <FileCheck size={17} /> },
        { label: 'Practice', path: '/student/practice', icon: <Cpu size={17} /> },
        { label: 'AI Interview Prep', path: '/student/ai-interview', icon: <Bot size={17} /> },
      ],
    },
    {
      title: 'ASSESSMENTS',
      items: [
        { label: 'Assessments', path: '/student/exams', icon: <CheckSquare size={17} /> },
        { label: 'Assigned Exams', path: '/student/assigned-exams', icon: <ClipboardList size={17} /> },
      ],
    },
    {
      title: 'VERSANT',
      items: [{ label: 'Versant', path: '/student/versant', icon: <Sparkles size={17} /> }],
    },
    {
      title: 'PLACEMENT',
      items: [{ label: 'Prep & Leaderboard', path: '/student/leaderboard', icon: <Trophy size={17} /> }],
    },
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={18} />, end: true },
    { label: 'Create Exam', path: '/faculty/exams/create', icon: <PlusCircle size={18} />, end: true },
    { label: 'Manage Exams', path: '/faculty/exams', icon: <BookOpen size={18} />, end: true },
    { label: 'Assign Exam', path: '/faculty/exam-assignments', icon: <ClipboardList size={18} />, end: true },
    { label: 'Assessment Results', path: '/faculty/results', icon: <FileCheck size={18} />, end: true },
    { label: 'AI Question Gen', path: '/faculty/ai-generator', icon: <Sparkles size={18} />, end: true },
    { label: 'Plagiarism Detector', path: '/faculty/plagiarism', icon: <ShieldAlert size={18} />, end: true },
    { label: 'Live Monitoring Room', path: '/faculty/live-monitor', icon: <Camera size={18} />, end: true },
    { label: 'Group Management', path: '/admin/groups', icon: <Layers size={18} />, end: false },
    { label: 'Question Bank', path: '/faculty/questions', icon: <FileQuestion size={18} />, end: true },
    { label: 'Live Proctor Center', path: '/faculty/proctor', icon: <ShieldAlert size={18} />, end: false },
    { label: 'Analytics', path: '/faculty/analytics', icon: <BarChart3 size={18} />, end: true },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'User Directory & Forms', path: '/admin/users', icon: <Users size={18} /> },
    { label: 'Live Proctor Center', path: '/faculty/proctor', icon: <ShieldAlert size={18} /> },
    { label: 'Group Management', path: '/admin/groups', icon: <Layers size={18} /> },
    { label: 'Courses & Categories', path: '/admin/categories', icon: <Settings size={18} /> },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldCheck size={18} /> },
    { label: 'System Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const navLinkClass = ({ isActive }) => {
    if (isActive) {
      return 'nav-link active d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-primary text-white fw-semibold shadow-sm';
    }
    return 'nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-body-secondary';
  };

  return (
    <>
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          bg-body border rounded-4 shadow-sm
          d-flex flex-column h-100
          ${isOpen ? 'position-fixed top-0 start-0 vh-100 shadow-lg' : 'w-100'}
        `}
        style={{
          width: isOpen ? '260px' : '100%',
          maxWidth: '260px',
          zIndex: isOpen ? 1050 : 1,
        }}
      >
        {/* Header (Fixed at top inside sidebar) */}
        <div className="p-3 border-bottom flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="min-width-0">
              <div
                className="text-uppercase text-body-secondary fw-bold"
                style={{ fontSize: '0.68rem', letterSpacing: '1px' }}
              >
                {role || 'User'} Workspace
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary text-uppercase">
                {role || 'User'}
              </span>

              {isOpen && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-md-none p-1"
                  onClick={onClose}
                  title="Close Menu"
                  aria-label="Close Menu"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Items (Scrollable Body) */}
        <div className="flex-grow-1 overflow-y-auto p-3">
          {role === 'student' ? (
            <div className="d-flex flex-column gap-4">
              {studentSections.map((section) => (
                <div key={section.title}>
                  <div
                    className="text-uppercase text-body-secondary fw-bold px-3 mb-2"
                    style={{ fontSize: '0.68rem', letterSpacing: '1px' }}
                  >
                    {section.title}
                  </div>

                  <div className="nav nav-pills flex-column gap-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={navLinkClass}
                      >
                        <span className="d-flex align-items-center flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                          {item.label}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="nav nav-pills flex-column gap-1">
              {(role === 'admin' ? adminNav : facultyNav).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end !== undefined ? item.end : true}
                  onClick={handleNavClick}
                  className={navLinkClass}
                >
                  <span className="d-flex align-items-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* User Footer (Fixed at bottom inside sidebar) */}
        <div className="p-3 border-top flex-shrink-0">
          <div className="bg-body-tertiary border rounded-3 p-2">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="min-width-0 flex-grow-1">
                <div className="fw-semibold small text-truncate">
                  {user?.name || 'Portal User'}
                </div>
                <div className="text-body-secondary small text-truncate">
                  {user?.email || 'No email available'}
                </div>
              </div>


            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Award, Building2, ChevronDown, ChevronRight, LogOut, Menu, Shield, Terminal, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Brand from '../components/common/Brand';
import ThemeToggle from '../components/common/ThemeToggle';

const routeTitles = [
  ['/student/dashboard', 'Student Dashboard'],
  ['/student/exams', 'Assessments'],
  ['/student/results', 'Results'],
  ['/student/leaderboard', 'Leaderboard'],
  ['/student/certificates', 'Certificates'],
  ['/student/practice', 'Practice Arena'],
  ['/student/problem-solving', 'Problem Solving'],
  ['/student/ai-interview', 'AI Interview Prep'],
  ['/student/versant', 'Versant Assessment'],
  ['/faculty/dashboard', 'Faculty Dashboard'],
  ['/faculty/exams/create', 'Create Exam'],
  ['/faculty/exams', 'Manage Exams'],
  ['/faculty/questions', 'Question Bank'],
  ['/faculty/coding', 'Coding Questions'],
  ['/faculty/exam-assignments', 'Exam Assignments'],
  ['/faculty/results', 'Assessment Results'],
  ['/faculty/ai-generator', 'AI Question Generator'],
  ['/faculty/plagiarism', 'Plagiarism Detector'],
  ['/faculty/live-monitor', 'Live Monitoring Room'],
  ['/faculty/proctor', 'Live Proctor Center'],
  ['/faculty/analytics', 'Faculty Analytics'],
  ['/admin/dashboard', 'Admin Dashboard'],
  ['/admin/colleges', 'College Management'],
  ['/admin/users', 'User Directory'],
  ['/admin/audit-logs', 'Audit Logs'],
  ['/admin/analytics', 'System Analytics'],
  ['/recruiter/dashboard', 'Recruiter Dashboard'],
  ['/recruiter/drives', 'Hiring Drives'],
  ['/recruiter/talent', 'Talent Pool'],
  ['/recruiter/rules', 'Cutoff Rules'],
  ['/recruiter/reports', 'Hiring Reports'],
  ['/college-admin/dashboard', 'College Admin Dashboard'],
  ['/college-admin/users', 'Faculty & Students'],
  ['/college-admin/groups', 'College Groups'],
  ['/college-admin/categories', 'Courses & Categories'],
  ['/college-admin/analytics', 'College Analytics'],
];

// One accent per role so people can tell workspaces apart at a glance
const roleStyles = {
  admin: { icon: Shield, label: 'System Admin', color: 'var(--app-blue)' },
  college_admin: { icon: Building2, label: 'College Admin', color: 'var(--app-blue)' },
  faculty: { icon: Terminal, label: 'Faculty', color: 'var(--app-blue)' },
  student: { icon: Award, label: 'Student', color: 'var(--app-blue)' },
  recruiter: { icon: Building2, label: 'Recruiter', color: 'var(--app-blue)' },
};

const Navbar = ({ onToggleMobileSidebar, mobileSidebarOpen }) => {
  const { user, logout, activeCollege, memberships, switchCollege } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const pageTitle = useMemo(() => {
    const match = [...routeTitles]
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => location.pathname.startsWith(path));
    return match?.[1] || 'Workspace';
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${pageTitle} · ExamiQ`;
    setShowProfileMenu(false);
  }, [pageTitle, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roleInfo = roleStyles[user?.role] || roleStyles.student;
  const RoleIcon = roleInfo.icon;
  // Deleted colleges populate as null and cannot be selected as workspaces.
  const collegeMemberships = (memberships || []).filter((membership) => membership?.collegeId?._id);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'college_admin'
        ? '/college-admin/dashboard'
        : user?.role === 'faculty'
          ? '/faculty/dashboard'
          : user?.role === 'recruiter'
            ? '/recruiter/dashboard'
            : '/student/dashboard';

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="app-navbar navbar sticky-top" aria-label="Workspace toolbar">
      <div className="container-fluid px-3 px-lg-4">
        <div className="d-flex align-items-center gap-3 min-width-0">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-lg-none"
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-navigation"
          >
            <Menu size={18} />
          </button>

          <Link to={dashboardPath} className="navbar-brand d-lg-none m-0" aria-label="ExamiQ dashboard">
            <Brand compact />
          </Link>

          <div className="navbar-breadcrumb min-width-0 d-none d-md-flex align-items-center gap-2">
            <Link to={dashboardPath} className="text-capitalize">{user?.role?.replace('_', ' ') || 'Your'} workspace</Link>
            <ChevronRight size={14} className="text-muted opacity-50" />
            <span className="fw-semibold text-truncate" aria-current="page">{pageTitle}</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ThemeToggle />
          <span className="navbar-divider" aria-hidden="true" />

          {user && (
            <div className="position-relative" ref={profileMenuRef}>
              <button
                type="button"
                className="navbar-profile-button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                aria-expanded={showProfileMenu}
                aria-label={`Account options for ${user.name || 'Portal User'}`}
                aria-controls="account-options"
              >
                <span
                  className="profile-avatar"
                  aria-hidden="true"
                  style={{ boxShadow: `0 0 0 2px ${roleInfo.color}` }}
                >
                  {initials}
                </span>
                <span className="d-none d-md-block text-start lh-sm">
                  <span className="d-block fw-semibold text-truncate" style={{ maxWidth: 150 }}>
                    {user.name || 'Portal User'}
                  </span>
                  <span
                    className="small d-flex align-items-center gap-1"
                    style={{ color: roleInfo.color }}
                  >
                    <RoleIcon size={12} />
                    {activeCollege?.name || roleInfo.label}
                  </span>
                </span>
                <ChevronDown
                  size={15}
                  className="d-none d-md-block text-muted"
                  style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                />
              </button>

              {showProfileMenu && (
                <div
                  id="account-options"
                  className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg p-0 overflow-hidden"
                  style={{ minWidth: 270 }}
                >
                  <div className="px-3 py-3 border-bottom d-flex align-items-center gap-3">
                    <span
                      className="profile-avatar"
                      aria-hidden="true"
                      style={{ boxShadow: `0 0 0 2px ${roleInfo.color}` }}
                    >
                      {initials}
                    </span>
                    <div className="min-width-0">
                      <div className="fw-semibold text-truncate">{user.name || 'Portal User'}</div>
                      <div className="small text-muted text-truncate">{user.email || 'No email available'}</div>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-bottom d-flex align-items-center gap-2 small" style={{ color: roleInfo.color }}>
                    <RoleIcon size={13} />
                    <span>{roleInfo.label}</span>
                    {activeCollege && (
                      <>
                        <span className="text-muted opacity-50">·</span>
                        <span className="text-muted text-truncate">{activeCollege.name}</span>
                      </>
                    )}
                  </div>

                  {collegeMemberships.length > 1 && (
                    <div className="px-3 py-2 border-bottom">
                      <label htmlFor="college-workspace" className="form-label small text-muted mb-1">
                        Switch college workspace
                      </label>
                      <select
                        id="college-workspace"
                        className="form-select form-select-sm"
                        value={activeCollege?._id || ''}
                        onChange={(event) => switchCollege(event.target.value)}
                      >
                        {collegeMemberships.map((membership) => (
                          <option key={membership._id || membership.collegeId._id} value={membership.collegeId._id}>
                            {membership.collegeId?.name || 'College'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="py-1">
                    <Link
                      to={dashboardPath}
                      className="dropdown-item d-flex align-items-center gap-2"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} className="text-muted" />
                    My dashboard
                    </Link>

                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

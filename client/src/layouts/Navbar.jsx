import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';

import {
  LogOut,
  User,
  Bell,
  Shield,
  Award,
  Terminal,
  Search,
  Key,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';

const Navbar = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Refs for click outside handling
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge bg-danger d-inline-flex align-items-center gap-1 text-uppercase">
            <Shield size={10} />
            Admin
          </span>
        );

      case 'faculty':
        return (
          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1 text-uppercase">
            <Terminal size={10} />
            Faculty
          </span>
        );

      default:
        return (
          <span className="badge bg-primary d-inline-flex align-items-center gap-1 text-uppercase">
            <Award size={10} />
            Student
          </span>
        );
    }
  };

  return (
    <nav className="navbar sticky-top bg-body border-bottom shadow-sm">
      <div className="container-fluid px-3 px-md-4 py-2">

        {/* LEFT SIDE */}
        <div className="d-flex align-items-center">

          {/* Mobile Menu */}
          <button
            type="button"
            className="btn btn-outline-secondary d-md-none me-2 d-flex align-items-center justify-content-center"
            onClick={onToggleMobileSidebar}
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>

          {/* Brand */}
          <Link
            to="/"
            className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 mb-0 text-body"
          >
            <span
              className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '38px',
                height: '38px',
              }}
            >
              <Terminal size={20} />
            </span>

            <span>
              Exami<span className="text-primary">Q</span>
            </span>
          </Link>
        </div>

        {/* CENTER SEARCH */}
        <div
          className="d-none d-md-flex mx-auto position-relative"
          style={{ width: '280px' }}
        >
          <Search
            size={17}
            className="position-absolute top-50 translate-middle-y ms-3 text-secondary"
          />

          <input
            type="search"
            className="form-control rounded-pill ps-5 bg-body-tertiary"
            placeholder="Search exams, questions..."
            aria-label="Search"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="d-flex align-items-center gap-2">

          {/* THEME TOGGLE */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
            }}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-warning" style={{ color: '#fbbf24' }} />
            ) : (
              <Moon size={20} className="text-primary" style={{ color: '#2563eb' }} />
            )}
          </button>

          {/* NOTIFICATION */}
          <div className="position-relative" ref={notificationRef}>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary p-0 rounded-circle d-flex align-items-center justify-content-center position-relative"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
              }}
              onClick={() => setShowNotifications((prev) => !prev)}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-body-secondary" />
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: 8, height: 8 }}>
                <span className="visually-hidden">New alerts</span>
              </span>
            </button>

            {showNotifications && (
              <div
                className="position-absolute end-0 mt-2 shadow-lg rounded-3 border bg-body"
                style={{
                  width: '320px',
                  maxWidth: '90vw',
                  zIndex: 1050,
                }}
              >
                {/* Header */}
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold text-body">Notifications</h6>
                  <span className="badge bg-primary">New</span>
                </div>

                {/* Notification Content */}
                <div className="p-3">
                  <div className="d-flex gap-2">
                    <div
                      className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                      }}
                    >
                      <Bell size={16} className="text-white" />
                    </div>

                    <div>
                      <p className="mb-1 fw-semibold text-body">Assessment Portal Active</p>
                      <p className="mb-0 small text-secondary">
                        Proctored assessment portal active with real-time AI security checks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* USER PROFILE */}
          {user && (
            <div className="position-relative" ref={profileMenuRef}>
              <button
                type="button"
                className="btn d-flex align-items-center gap-2 rounded-pill border bg-body-tertiary text-body px-3 py-1 shadow-sm"
                onClick={() => setShowProfileMenu((prev) => !prev)}
              >
                {/* Avatar */}
                <span
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                  }}
                >
                  <User size={16} />
                </span>

                {/* User Information */}
                <span className="d-none d-md-block text-start">
                  <span className="d-block fw-bold small text-truncate">
                    {user.name}
                  </span>
                  <span className="d-block mt-1">
                    {getRoleBadge(user.role)}
                  </span>
                </span>
              </button>

              {/* PROFILE DROPDOWN */}
              {showProfileMenu && (
                <div
                  className="position-absolute end-0 mt-2 shadow-lg rounded-3 border overflow-hidden bg-body"
                  style={{
                    width: '240px',
                    zIndex: 1050,
                  }}
                >
                  {/* Profile Header */}
                  <div className="p-3 border-bottom">
                    <div className="fw-bold text-truncate text-body">{user.name}</div>
                    <div className="small text-truncate text-secondary">
                      {user.email}
                    </div>
                  </div>

                  {/* Profile Link */}
                  <Link
                    to={
                      user.role === 'student'
                        ? '/student/dashboard'
                        : user.role === 'admin'
                          ? '/admin/dashboard'
                          : '/faculty/dashboard'
                    }
                    className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-body"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={16} className="text-primary" />
                    <span>My Profile</span>
                  </Link>

                  {/* Change Password */}
                  <Link
                    to="/forgot-password"
                    className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-body"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Key size={16} className="text-warning" />
                    <span>Change Password</span>
                  </Link>

                  {/* Logout */}
                  <button
                    type="button"
                    className="btn btn-link text-danger text-decoration-none w-100 d-flex align-items-center gap-2 px-3 py-2 rounded-0"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
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
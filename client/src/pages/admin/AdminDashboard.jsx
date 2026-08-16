import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { Users, Shield, BookOpen, Settings, ShieldCheck, Activity, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      const [uRes, aRes] = await Promise.all([API.get('/admin/users'), API.get('/admin/analytics')]);
      setUsers(uRes.data.users || []);
      setAnalytics(aRes.data.analytics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold m-0 d-flex align-items-center gap-2 text-body">
            <Shield className="text-danger" size={26} /> System Administrator Console
          </h3>
          <p className="text-secondary small mt-1 mb-0">
            Platform governance, user activation management, courses, and security audit logs.
          </p>
        </div>
      </div>

      {/* Analytics Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body-tertiary">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-primary bg-opacity-15 rounded-3 text-primary d-flex align-items-center justify-content-center">
                <Users size={22} />
              </div>
              <div>
                <h4 className="fw-bold m-0 text-body">{analytics?.totalStudents || 0}</h4>
                <span className="text-secondary small">Registered Students</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body-tertiary">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-warning bg-opacity-15 rounded-3 text-warning d-flex align-items-center justify-content-center">
                <Shield size={22} />
              </div>
              <div>
                <h4 className="fw-bold m-0 text-body">{analytics?.totalFaculty || 0}</h4>
                <span className="text-secondary small">Faculty Members</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body-tertiary">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-info bg-opacity-15 rounded-3 text-info d-flex align-items-center justify-content-center">
                <BookOpen size={22} />
              </div>
              <div>
                <h4 className="fw-bold m-0 text-body">{analytics?.totalExams || 0}</h4>
                <span className="text-secondary small">System Exams</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-body-tertiary">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-success bg-opacity-15 rounded-3 text-success d-flex align-items-center justify-content-center">
                <Activity size={22} />
              </div>
              <div>
                <h4 className="fw-bold m-0 text-body">{analytics?.totalAttempts || 0}</h4>
                <span className="text-secondary small">Evaluated Submissions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h5 className="fw-bold mb-3 text-body">Quick Actions</h5>
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold mb-2 text-body">User Management</h6>
              <p className="text-secondary small mb-3">Activate, deactivate, or inspect student and faculty user profiles.</p>
            </div>
            <div>
              <Link to="/admin/users" className="btn btn-outline-primary btn-sm fw-semibold rounded-pill d-inline-flex align-items-center gap-1">
                Manage Users <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold mb-2 text-body">Courses & Categories</h6>
              <p className="text-secondary small mb-3">Add and structure subject domains and academic course codes.</p>
            </div>
            <div>
              <Link to="/admin/categories" className="btn btn-outline-warning btn-sm fw-semibold rounded-pill d-inline-flex align-items-center gap-1">
                Manage Courses <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold mb-2 text-body">Security Audit Logs</h6>
              <p className="text-secondary small mb-3">Review security actions, administrative modifications, and logins.</p>
            </div>
            <div>
              <Link to="/admin/audit-logs" className="btn btn-outline-danger btn-sm fw-semibold rounded-pill d-inline-flex align-items-center gap-1">
                View Audit Trail <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold mb-2 text-body">Platform Analytics</h6>
              <p className="text-secondary small mb-3">View exam performance, pass/fail trends, user growth, and plagiarism reports.</p>
            </div>
            <div>
              <Link to="/admin/analytics" className="btn btn-outline-info btn-sm fw-semibold rounded-pill d-inline-flex align-items-center gap-1">
                View Analytics <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, FileQuestion, Code2, Users, Layers, ArrowRight, Eye, CheckSquare, BarChart3, Mail } from 'lucide-react';
import SendEmailModal from '../../components/SendEmailModal';

const FacultyDashboard = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    fetchFacultyOverview();
  }, []);

  const fetchFacultyOverview = async () => {
    try {
      setLoading(true);
      const [exRes, qRes, pRes, anaRes, grpRes] = await Promise.all([
        API.get('/exams'),
        API.get('/questions'),
        API.get('/coding'),
        API.get('/admin/analytics'),
        API.get('/groups'),
      ]);
      setExams(exRes.data.exams || []);
      setQuestions(qRes.data.questions || []);
      setProblems(pRes.data.problems || []);
      setAnalytics(anaRes.data.analytics);
      setGroups(grpRes.data.groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0">Faculty Control Dashboard</h3>
          <p className="text-muted small m-0">Manage question banks, group assignments, objective & coding exams</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-info fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1"
            onClick={() => setShowEmailModal(true)}
          >
            <Mail size={16} /> Send Email
          </button>
          <Link to="/faculty/exam-assignments" className="btn btn-outline-primary fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1">
            <CheckSquare size={16} /> Assign Exam
          </Link>
          <Link to="/faculty/exams/create" className="btn btn-primary fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2">
            <PlusCircle size={18} /> Create New Exam
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-20 rounded-3 text-primary">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{exams.length}</h3>
              <span className="text-muted small">Exams Created</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-info bg-opacity-20 rounded-3 text-info">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{groups.length}</h3>
              <span className="text-muted small">My Groups</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-warning bg-opacity-20 rounded-3 text-warning">
              <FileQuestion size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{questions.length}</h3>
              <span className="text-muted small">MCQ Question Bank</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-20 rounded-3 text-success">
              <Users size={24} />
            </div>
            <div>
              <h3 className="fw-extrabold m-0 text-light">{analytics?.totalAttempts || 0}</h3>
              <span className="text-muted small">Candidate Attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* MY GROUPS SECTION */}
      <div className="glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-light m-0 d-flex align-items-center gap-2">
              <Layers size={20} className="text-primary" /> My Managed Groups
            </h5>
            <p className="text-muted small m-0">Student groups authorized for exam assignment & progress tracking</p>
          </div>
          <Link to="/admin/groups" className="text-primary text-decoration-none small fw-semibold">Manage All Groups</Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-4 text-muted">No active student groups created yet. Create a group in Group Management.</div>
        ) : (
          <div className="row g-3">
            {groups.slice(0, 6).map((group) => (
              <div key={group._id} className="col-12 col-md-6 col-lg-4">
                <div className="border border-secondary rounded-4 p-3 bg-dark h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary font-monospace">{group.code}</span>
                      <span className="badge bg-secondary small">{group.college}</span>
                    </div>

                    <h6 className="fw-bold text-light mb-1">{group.name}</h6>

                    <div className="small text-muted mb-2">
                      <span>{group.course}</span> · <span>Dept: {group.department}</span> · <span>Sem {group.semester}</span>
                    </div>

                    <div className="p-2 rounded-3 bg-body-tertiary border border-secondary mb-3 small d-flex justify-content-between">
                      <span className="text-muted">Total Students:</span>
                      <strong className="text-success">{group.students?.length || 0} Students</strong>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Link
                      to={`/admin/groups/${group._id}`}
                      className="btn btn-outline-info btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                      title="View Enrolled Students"
                    >
                      <Eye size={13} /> Students
                    </Link>

                    <Link
                      to="/faculty/exam-assignments"
                      className="btn btn-primary btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                      title="Assign Exam To Group"
                    >
                      <CheckSquare size={13} /> Assign
                    </Link>

                    <Link
                      to={`/admin/groups/${group._id}`}
                      className="btn btn-outline-light btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                      title="View Group Results"
                    >
                      <BarChart3 size={13} /> Results
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Managed Exams List */}
      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-light m-0">Recent Managed Exams</h5>
          <Link to="/faculty/exams" className="text-primary text-decoration-none small fw-semibold">View All</Link>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-4 text-muted">No exams created yet. Click "Create New Exam" to publish your first test.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle m-0">
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th>Exam Title</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.slice(0, 5).map((ex) => (
                  <tr key={ex._id}>
                    <td><strong className="text-light">{ex.title}</strong></td>
                    <td><span className="badge bg-secondary">{ex.category}</span></td>
                    <td>{ex.duration} mins</td>
                    <td>{ex.questions?.length || 0} MCQ / {ex.codingProblems?.length || 0} Code</td>
                    <td>
                      <span className={`badge ${ex.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/faculty/exams/edit/${ex._id}`} className="btn btn-outline-light btn-sm me-2">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Email Announcement Modal */}
      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
};

export default FacultyDashboard;

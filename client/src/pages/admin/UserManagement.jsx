import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Search, User, Edit2, FormInput, Users } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';
import DynamicFormBuilder from '../../components/DynamicFormBuilder';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'form_builder'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Student Profile Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    rollNumber: '',
    college: '',
    course: '',
    branch: '',
    semester: '',
    groupId: '',
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchGroups();
    }
  }, [roleFilter, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = roleFilter ? `/admin/users?role=${roleFilter}` : '/admin/users';
      const res = await API.get(url);
      setUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await API.get('/groups');
      setGroups(res.data.groups || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/toggle-status`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(res.data.message);
      fetchUsers();
    } catch (e) {
      toast.error('Failed to update role');
    }
  };

  const handleOpenEditStudent = (u) => {
    setEditingStudent(u);
    setStudentForm({
      rollNumber: u.studentProfile?.rollNumber || '',
      college: u.studentProfile?.college || '',
      course: u.studentProfile?.course || '',
      branch: u.studentProfile?.branch || '',
      semester: u.studentProfile?.semester || '',
      groupId: u.studentProfile?.groupId?._id || u.studentProfile?.groupId || '',
    });
  };

  const handleSaveStudentProfile = async () => {
    if (!editingStudent) return;
    try {
      await API.put(`/admin/users/${editingStudent._id}/student-profile`, studentForm);
      toast.success('Student profile & group assignment updated!');
      setEditingStudent(null);
      fetchUsers();
    } catch (e) {
      toast.error('Failed to update student profile');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentProfile?.college || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.studentProfile?.groupId?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="workspace-page management-page">
      <PageHeader
        eyebrow="People"
        title="People & access"
        description="Manage user accounts, student roll numbers, academic profiles, and assigned groups."
        actions={(<div className="nav nav-pills gap-2 bg-body-tertiary p-1 rounded-pill border">
          <button
            className={`nav-link fw-semibold px-4 py-2 rounded-pill small ${
              activeTab === 'users' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            onClick={() => setActiveTab('users')}
            aria-pressed={activeTab === 'users'}
          >
            User Directory
          </button>
          <button
            className={`nav-link fw-semibold px-4 py-2 rounded-pill small d-flex align-items-center gap-2 ${
              activeTab === 'form_builder' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-transparent'
            }`}
            onClick={() => setActiveTab('form_builder')}
            aria-pressed={activeTab === 'form_builder'}
          >
            <FormInput size={16} /> Dynamic Form Builder
          </button>
        </div>)}
      />

      {activeTab === 'form_builder' ? (
        <DynamicFormBuilder />
      ) : (
        <div>
          <div className="card"><div className="card-body p-3"><div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex flex-column flex-sm-row gap-2 w-100" style={{ maxWidth: 500 }}>
              <select
                aria-label="Filter users by role"
                className="form-select fw-semibold"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>

              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <Search size={16} className="text-secondary" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by name, email, college or group..."
                  aria-label="Search people by name, email, college or group"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div></div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading user directory...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="table-responsive m-0">
                <table className="table table-hover align-middle m-0" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr className="text-secondary text-uppercase fs-7 border-bottom">
                      <th className="py-3 ps-4">Student / User</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">College</th>
                      <th className="py-3">Course</th>
                      <th className="py-3">Group</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-secondary">
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const grp = u.studentProfile?.groupId;

                        return (
                          <tr key={u._id}>
                            <td className="ps-4 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle bg-primary bg-opacity-15 text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{ width: 32, height: 32 }}
                                >
                                  <User size={16} />
                                </div>
                                <div>
                                  <div className="fw-bold text-body">{u.name}</div>
                                  {u.role === 'student' && u.studentProfile?.rollNumber && (
                                    <span className="badge bg-secondary bg-opacity-25 text-body font-monospace micro-badge">
                                      {u.studentProfile.rollNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 text-secondary">{u.email}</td>

                            <td className="py-3">
                              {u.role === 'student' ? (
                                <span className="small text-body fw-medium">{u.studentProfile?.college || 'â€”'}</span>
                              ) : (
                                <span className="text-secondary small">N/A</span>
                              )}
                            </td>

                            <td className="py-3">
                              {u.role === 'student' ? (
                                <span className="small text-body">{u.studentProfile?.course || 'â€”'}</span>
                              ) : (
                                <span className="text-secondary small">N/A</span>
                              )}
                            </td>

                            <td className="py-3">
                              {u.role === 'student' ? (
                                grp ? (
                                  <span className="badge bg-primary font-monospace px-2 py-1">
                                    {grp.name || grp.code || 'Assigned'}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark px-2 py-1">Unassigned</span>
                                )
                              ) : (
                                <span className="text-secondary small">N/A</span>
                              )}
                            </td>

                            <td className="py-3">
                              <select
                                className="form-select form-select-sm fw-semibold"
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                style={{ width: '110px' }}
                              >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            <td className="py-3">
                              <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            <td className="pe-4 text-end py-3">
                              <div className="d-flex justify-content-end align-items-center gap-1">
                                {u.role === 'student' && (
                                  <button
                                    className="btn btn-sm btn-outline-primary fw-semibold px-2 py-1"
                                    title="Edit Student Group & Profile"
                                    onClick={() => handleOpenEditStudent(u)}
                                  >
                                    <Edit2 size={13} /> Edit Group
                                  </button>
                                )}

                                <button
                                  className={`btn btn-sm ${
                                    u.isActive ? 'btn-outline-danger' : 'btn-outline-success'
                                  } fw-semibold px-2 py-1`}
                                  onClick={() => handleToggleStatus(u._id)}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Edit Student Profile & Group Modal */}
      {editingStudent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg rounded-3 bg-body">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-body">Edit Student Profile & Group</h5>
                <button type="button" className="btn-close" onClick={() => setEditingStudent(null)} />
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label small text-secondary">Student Name</label>
                  <input type="text" className="form-control fw-bold" value={editingStudent.name} disabled />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">Assigned Group / Batch *</label>
                  <select
                    className="form-select fw-semibold"
                    value={studentForm.groupId}
                    onChange={(e) => setStudentForm({ ...studentForm, groupId: e.target.value })}
                  >
                    <option value="">-- No Group (Unassigned) --</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} [{g.code}] â€” {g.college} ({g.course})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">Roll Number</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">College</label>
                  <input
                    type="text"
                    className="form-control"
                    value={studentForm.college}
                    onChange={(e) => setStudentForm({ ...studentForm, college: e.target.value })}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-secondary fw-semibold">Course</label>
                    <input
                      type="text"
                      className="form-control"
                      value={studentForm.course}
                      onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary fw-semibold">Semester</label>
                    <input
                      type="text"
                      className="form-control"
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-semibold px-4 rounded-pill"
                  onClick={handleSaveStudentProfile}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;



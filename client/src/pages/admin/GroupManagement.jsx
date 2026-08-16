import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  UserPlus,
  Search,
  Trash2,
  BookOpen,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Filter,
  Building,
} from 'lucide-react';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Group Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    college: 'Engineering College',
    course: 'B.Tech',
    department: 'Computer Science',
    semester: '1st',
    section: 'A',
    academicYear: '2025-2026',
    description: '',
    isActive: true,
  });

  // Assign Student Modal State
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [collegeFilter, courseFilter, semesterFilter, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (collegeFilter) queryParams.append('college', collegeFilter);
      if (courseFilter) queryParams.append('course', courseFilter);
      if (semesterFilter) queryParams.append('semester', semesterFilter);
      if (statusFilter) queryParams.append('isActive', statusFilter);

      const [gRes, cRes, sRes] = await Promise.all([
        API.get(`/groups?${queryParams.toString()}`),
        API.get('/admin/courses'),
        API.get('/admin/users?role=student'),
      ]);

      setGroups(gRes.data.groups || []);
      setCourses(cRes.data.courses || []);
      setAllStudents(sRes.data.users || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingGroupId(null);
    setGroupForm({
      name: '',
      code: '',
      college: 'Engineering College',
      course: 'B.Tech',
      department: 'Computer Science',
      semester: '1st',
      section: 'A',
      academicYear: '2025-2026',
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (group) => {
    setEditingGroupId(group._id);
    setGroupForm({
      name: group.name || '',
      code: group.code || '',
      college: group.college || 'Engineering College',
      course: group.course || 'B.Tech',
      department: group.department || 'Computer Science',
      semester: group.semester || '1st',
      section: group.section || 'A',
      academicYear: group.academicYear || '2025-2026',
      description: group.description || '',
      isActive: group.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.code || !groupForm.college) {
      toast.warning('Group Name, Code, and College are required');
      return;
    }

    try {
      if (editingGroupId) {
        await API.put(`/groups/${editingGroupId}`, groupForm);
        toast.success('Group updated successfully!');
      } else {
        await API.post('/groups', groupForm);
        toast.success('Group created successfully!');
      }
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group');
    }
  };

  const handleToggleStatus = async (groupId) => {
    try {
      const res = await API.put(`/groups/${groupId}/toggle-status`);
      toast.success(res.data.message);
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await API.delete(`/groups/${groupId}`);
      toast.info('Group deleted');
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to delete group');
    }
  };

  const handleOpenAssignModal = (group) => {
    setSelectedGroup(group);
    const existingIds = (group.students || []).map((s) => (typeof s === 'object' ? s._id : s));
    setSelectedStudentIds(existingIds);
  };

  const handleToggleStudentSelection = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedGroup) return;
    try {
      await API.post(`/groups/${selectedGroup._id}/students`, {
        studentIds: selectedStudentIds,
      });
      toast.success('Group roster updated successfully!');
      setSelectedGroup(null);
      fetchInitialData();
    } catch (e) {
      toast.error('Failed to update roster');
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      g.college.toLowerCase().includes(search.toLowerCase()) ||
      g.course.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = allStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <Users size={28} className="text-primary" /> Group Management Console
          </h3>
          <p className="text-muted small m-0">Organize students into structured college & departmental groups</p>
        </div>

        <button
          className="btn btn-primary fw-bold btn-sm px-4 rounded-pill d-flex align-items-center gap-2 shadow-sm"
          onClick={handleOpenCreateModal}
        >
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-light"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <input
              type="text"
              className="form-control form-control-sm bg-dark border-secondary text-light"
              placeholder="Filter College..."
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <input
              type="text"
              className="form-control form-control-sm bg-dark border-secondary text-light"
              placeholder="Filter Course..."
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm bg-dark border-secondary text-light"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="1st">1st Sem</option>
              <option value="2nd">2nd Sem</option>
              <option value="3rd">3rd Sem</option>
              <option value="4th">4th Sem</option>
              <option value="5th">5th Sem</option>
              <option value="6th">6th Sem</option>
              <option value="7th">7th Sem</option>
              <option value="8th">8th Sem</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm bg-dark border-secondary text-light"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-card text-center py-5 text-muted">
          No groups found. Click "+ Create Group" to create the first group.
        </div>
      ) : (
        <div className="row g-4">
          {filteredGroups.map((group) => (
            <div key={group._id} className="col-12 col-md-6 col-lg-4">
              <div className="glass-card p-4 rounded-4 h-100 d-flex flex-column justify-content-between border border-secondary">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary font-monospace px-3 py-1 fw-bold">{group.code}</span>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className={`badge border-0 ${group.isActive ? 'bg-success' : 'bg-secondary'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleStatus(group._id)}
                        title="Toggle Active Status"
                      >
                        {group.isActive ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        className="btn btn-sm text-info p-0 border-0 ms-1"
                        title="Edit Group"
                        onClick={() => handleOpenEditModal(group)}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        className="btn btn-sm text-danger p-0 border-0 ms-1"
                        title="Delete Group"
                        onClick={() => handleDeleteGroup(group._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h5 className="fw-bold text-light mb-1">{group.name}</h5>

                  <div className="text-muted small mb-2 d-flex align-items-center gap-1">
                    <Building size={13} className="text-primary" />
                    <span>{group.college}</span>
                  </div>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge bg-dark border border-secondary text-info">{group.course}</span>
                    <span className="badge bg-dark border border-secondary text-light">Dept: {group.department}</span>
                    <span className="badge bg-dark border border-secondary text-warning">Sem: {group.semester}</span>
                    <span className="badge bg-dark border border-secondary text-secondary">Sec: {group.section}</span>
                  </div>

                  <p className="text-secondary small mb-3">{group.description || 'No description provided.'}</p>

                  <div className="p-3 rounded-3 bg-dark border border-secondary mb-3">
                    <div className="d-flex justify-content-between align-items-center small">
                      <span className="text-muted fw-semibold">Enrolled Students:</span>
                      <span className="fw-bold text-success fs-6">{(group.students || []).length} Students</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Link
                    to={`/admin/groups/${group._id}`}
                    className="btn btn-outline-info btn-sm w-50 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-1"
                  >
                    <Eye size={14} /> Details
                  </Link>

                  <button
                    className="btn btn-outline-primary btn-sm w-50 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-1"
                    onClick={() => handleOpenAssignModal(group)}
                  >
                    <UserPlus size={14} /> Roster
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Group Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card text-light">
              <form onSubmit={handleSaveGroup}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title fw-bold">{editingGroupId ? 'Edit Group' : 'Create Group'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Group Name *</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. BCA-1A"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Group Code *</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0 uppercase font-monospace"
                        placeholder="e.g. BCA-1A"
                        value={groupForm.code}
                        onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">College / Institution *</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. Lucknow College"
                        value={groupForm.college}
                        onChange={(e) => setGroupForm({ ...groupForm, college: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Course</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. BCA"
                        value={groupForm.course}
                        onChange={(e) => setGroupForm({ ...groupForm, course: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small text-muted">Department</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. Computer Science"
                        value={groupForm.department}
                        onChange={(e) => setGroupForm({ ...groupForm, department: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small text-muted">Semester</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. 1st"
                        value={groupForm.semester}
                        onChange={(e) => setGroupForm({ ...groupForm, semester: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small text-muted">Section</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. A"
                        value={groupForm.section}
                        onChange={(e) => setGroupForm({ ...groupForm, section: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Academic Year</label>
                      <input
                        type="text"
                        className="form-control bg-secondary text-light border-0"
                        placeholder="e.g. 2025-2026"
                        value={groupForm.academicYear}
                        onChange={(e) => setGroupForm({ ...groupForm, academicYear: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small text-muted">Status</label>
                      <select
                        className="form-select bg-secondary text-light border-0"
                        value={groupForm.isActive}
                        onChange={(e) => setGroupForm({ ...groupForm, isActive: e.target.value === 'true' })}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small text-muted">Description</label>
                      <textarea
                        className="form-control bg-secondary text-light border-0"
                        rows={2}
                        placeholder="Brief notes about this group..."
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold px-4">
                    {editingGroupId ? 'Update Group' : 'Save Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Roster Assignment Modal */}
      {selectedGroup && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card text-light">
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold">Group Roster — {selectedGroup.name}</h5>
                  <span className="badge bg-primary font-monospace small">{selectedGroup.code} ({selectedGroup.college})</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedGroup(null)} />
              </div>

              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input
                    type="text"
                    className="form-control bg-secondary text-light border-0"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <span className="badge bg-success ms-3 font-monospace px-3 py-2">
                    {selectedStudentIds.length} Selected
                  </span>
                </div>

                <div className="table-responsive" style={{ maxHeight: 340, overflowY: 'auto' }}>
                  <table className="table table-dark table-hover align-middle m-0">
                    <thead>
                      <tr className="text-muted small">
                        <th style={{ width: 40 }}>Select</th>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        const isSelected = selectedStudentIds.includes(student._id);
                        return (
                          <tr
                            key={student._id}
                            onClick={() => handleToggleStudentSelection(student._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input bg-secondary border-0"
                                checked={isSelected}
                                onChange={() => {}}
                              />
                            </td>
                            <td className="fw-bold text-light">{student.name}</td>
                            <td>
                              <span className="badge bg-dark text-info font-monospace">
                                {student.studentProfile?.rollNumber || 'Unassigned'}
                              </span>
                            </td>
                            <td className="text-secondary small">{student.email}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedGroup(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success btn-sm fw-bold px-4" onClick={handleSaveAssignments}>
                  Save Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;

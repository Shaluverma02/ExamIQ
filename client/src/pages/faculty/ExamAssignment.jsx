import React, { useEffect, useState } from 'react';
import API, { examAssignmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  ClipboardList,
  PlusCircle,
  Users,
  Calendar,
  Clock,
  Send,
  Trash2,
  Edit3,
  Search,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import ExamScheduleCalendarModal from '../../components/ExamScheduleCalendarModal';

const ExamAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const [form, setForm] = useState({
    examId: '',
    groupIds: [],
    studentIds: [],
    startDate: '',
    endDate: '',
    duration: '',
    attemptsAllowed: 1,
    title: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.groupIds.length > 0 || form.studentIds.length > 0) {
      fetchEligibleCount();
    } else {
      setEligibleCount(0);
    }
  }, [form.groupIds, form.studentIds]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, examRes, groupRes, studentRes] = await Promise.all([
        examAssignmentAPI.getFacultyAssignments(),
        API.get('/exams?status=published'),
        API.get('/groups'),
        API.get('/admin/users?role=student'),
      ]);
      setAssignments(assignRes.data.assignments || []);
      setExams(examRes.data.exams || []);
      setGroups(groupRes.data.groups || []);
      setStudents(studentRes.data.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleCount = async () => {
    try {
      const res = await examAssignmentAPI.getEligibleCount({
        groupIds: form.groupIds.join(','),
        studentIds: form.studentIds.join(','),
      });
      setEligibleCount(res.data.count || 0);
    } catch {
      setEligibleCount(0);
    }
  };

  const resetForm = () => {
    setForm({
      examId: '',
      groupIds: [],
      studentIds: [],
      startDate: '',
      endDate: '',
      duration: '',
      attemptsAllowed: 1,
      title: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
    setStudentSearch('');
  };

  const handleEdit = (assignment) => {
    setForm({
      examId: assignment.examId?._id || assignment.examId,
      groupIds: (assignment.groupIds || []).map((g) => g._id || g),
      studentIds: (assignment.studentIds || []).map((s) => s._id || s),
      startDate: assignment.startDate ? assignment.startDate.slice(0, 16) : '',
      endDate: assignment.endDate ? assignment.endDate.slice(0, 16) : '',
      duration: assignment.duration || '',
      attemptsAllowed: assignment.attemptsAllowed || 1,
      title: assignment.title || '',
      notes: assignment.notes || '',
    });
    setEditingId(assignment._id);
    setShowForm(true);
  };

  const toggleGroup = (groupId) => {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const toggleStudent = (studentId) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.examId || !form.startDate || !form.endDate) {
      toast.warning('Please select an exam and set start/end dates');
      return;
    }

    if (form.groupIds.length === 0 && form.studentIds.length === 0) {
      toast.warning('Select at least one group or student');
      return;
    }

    const payload = {
      examId: form.examId,
      groupIds: form.groupIds,
      studentIds: form.studentIds,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      duration: form.duration ? Number(form.duration) : undefined,
      attemptsAllowed: Number(form.attemptsAllowed) || 1,
      title: form.title,
      notes: form.notes,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await examAssignmentAPI.update(editingId, payload);
        toast.success('Assignment updated');
      } else {
        await examAssignmentAPI.create(payload);
        toast.success('Assignment created as draft');
      }
      resetForm();
      fetchData();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Failed to save assignment';
      if (status === 409) {
        toast.error('Duplicate assignment: this exam is already assigned to overlapping groups/students');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await examAssignmentAPI.publish(id);
      toast.success('Assignment published — students can now see it');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await examAssignmentAPI.delete(id);
      toast.info('Assignment deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const statusBadge = (status) => {
    const map = {
      draft: 'bg-secondary',
      published: 'bg-success',
      archived: 'bg-dark',
    };
    return map[status] || 'bg-secondary';
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <ClipboardList size={26} className="text-primary" />
            Assign Exam to Class/Group
          </h3>
          <p className="text-muted small m-0">
            Link published exams to student batches or individual students
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-info fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1"
            onClick={() => setShowCalendarModal(true)}
          >
            <Calendar size={18} /> View Schedule Calendar
          </button>
          <button
            type="button"
            className="btn btn-primary fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <PlusCircle size={18} /> New Assignment
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-4 mb-4 border border-secondary">
          <h5 className="fw-bold text-light mb-3">
            {editingId ? 'Edit Assignment' : 'Create New Assignment'}
          </h5>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted small">Select Exam *</label>
                <select
                  className="form-select bg-secondary text-light border-0"
                  value={form.examId}
                  onChange={(e) => setForm({ ...form, examId: e.target.value })}
                  required
                >
                  <option value="">Choose a published exam...</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title} ({exam.duration} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small">Assignment Title (optional)</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-light border-0"
                  placeholder="Defaults to exam title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small">Start Date *</label>
                <input
                  type="datetime-local"
                  className="form-control bg-secondary text-light border-0"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small">End Date *</label>
                <input
                  type="datetime-local"
                  className="form-control bg-secondary text-light border-0"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted small">Duration Override (mins)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control bg-secondary text-light border-0"
                  placeholder="Uses exam default"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted small">Attempts Allowed</label>
                <input
                  type="number"
                  min="1"
                  className="form-control bg-secondary text-light border-0"
                  value={form.attemptsAllowed}
                  onChange={(e) => setForm({ ...form, attemptsAllowed: e.target.value })}
                />
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <div className="border rounded-3 p-2 w-100 text-center">
                  <div className="text-muted small">Eligible Students</div>
                  <div className="fw-bold text-primary fs-4">{eligibleCount}</div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <label className="form-label text-muted small d-flex align-items-center gap-1">
                  <Layers size={14} /> Select Groups
                </label>
                <div className="border border-secondary rounded-3 p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {groups.length === 0 ? (
                    <div className="text-muted small p-2">No groups found. Create batches first.</div>
                  ) : (
                    groups.map((group) => (
                      <label key={group._id} className="d-flex align-items-center gap-2 p-2 rounded hover-bg-secondary">
                        <input
                          type="checkbox"
                          checked={form.groupIds.includes(group._id)}
                          onChange={() => toggleGroup(group._id)}
                        />
                        <span className="text-light small">
                          {group.name} <span className="text-muted">({group.code})</span>
                          <span className="badge bg-primary ms-1">{group.students?.length || 0}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small d-flex align-items-center gap-1">
                  <Users size={14} /> Select Individual Students
                </label>
                <div className="position-relative mb-2">
                  <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-sm bg-secondary text-light border-0 ps-4"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="border border-secondary rounded-3 p-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                  {filteredStudents.slice(0, 50).map((student) => (
                    <label key={student._id} className="d-flex align-items-center gap-2 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={form.studentIds.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                      />
                      <span className="text-light small">
                        {student.name} <span className="text-muted">({student.email})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label text-muted small">Notes (optional)</label>
              <textarea
                className="form-control bg-secondary text-light border-0"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Draft'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-5 text-center text-muted">
          <AlertCircle size={36} className="mb-3 opacity-50" />
          <p>No exam assignments yet. Create one to assign exams to your batches.</p>
        </div>
      ) : (
        <div className="row g-3">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="col-12">
              <div className="glass-card p-4 border border-secondary">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className={`badge ${statusBadge(assignment.status)} text-uppercase`}>
                        {assignment.status}
                      </span>
                      <span className="badge bg-primary bg-opacity-20 text-primary">
                        {assignment.assignmentType}
                      </span>
                    </div>
                    <h5 className="fw-bold text-light mb-1">
                      {assignment.title || assignment.examId?.title || 'Untitled'}
                    </h5>
                    <p className="text-muted small mb-2">
                      Exam: {assignment.examId?.title || '—'} · {assignment.examId?.category}
                    </p>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span className="d-flex align-items-center gap-1">
                        <Calendar size={14} />
                        {new Date(assignment.startDate).toLocaleString()} —{' '}
                        {new Date(assignment.endDate).toLocaleString()}
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={14} />
                        {assignment.duration || assignment.examId?.duration} mins
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Users size={14} />
                        {assignment.groupIds?.length || 0} groups, {assignment.studentIds?.length || 0} individuals
                      </span>
                    </div>
                    {assignment.groupIds?.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        {assignment.groupIds.map((g) => (
                          <span key={g._id} className="badge bg-secondary">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    {assignment.status === 'draft' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-flex align-items-center gap-1"
                        onClick={() => handlePublish(assignment._id)}
                      >
                        <Send size={14} /> Publish
                      </button>
                    )}
                    {assignment.status !== 'archived' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                      onClick={() => handleDelete(assignment._id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 glass-card p-3 border border-secondary">
        <div className="d-flex align-items-center gap-2 text-muted small">
          <CheckCircle2 size={16} className="text-success" />
          Published assignments control which students can start an exam. Unassigned students receive a 403 error.
        </div>
      </div>

      {/* Exam Schedule Calendar Modal */}
      <ExamScheduleCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        assignments={assignments}
      />
    </div>
  );
};

export default ExamAssignment;

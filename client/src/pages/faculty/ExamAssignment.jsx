import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import ExamScheduleCalendarModal from '../../components/ExamScheduleCalendarModal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import '../../styles/faculty.css';

const FACULTY_ACCENT = 'var(--app-primary)';

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Archived' },
];

const statusStyles = {
  draft: { bg: 'var(--app-warning-soft)', color: 'var(--app-warning)' },
  published: { bg: 'var(--app-success-soft)', color: 'var(--app-success)' },
  archived: { bg: 'var(--app-subtle)', color: 'var(--app-muted)' },
};

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
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [listSearch, setListSearch] = useState('');

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
      setEligibleLoading(true);
      const res = await examAssignmentAPI.getEligibleCount({
        groupIds: form.groupIds.join(','),
        studentIds: form.studentIds.join(','),
      });
      setEligibleCount(res.data.count || 0);
    } catch {
      setEligibleCount(0);
    } finally {
      setEligibleLoading(false);
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

  const endBeforeStart =
    form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate);

  const hasSelection = form.groupIds.length > 0 || form.studentIds.length > 0;
  const zeroEligible = hasSelection && !eligibleLoading && eligibleCount === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.examId || !form.startDate || !form.endDate) {
      toast.warning('Please select an exam and set start/end dates');
      return;
    }

    if (endBeforeStart) {
      toast.warning('End date must be after the start date');
      return;
    }

    if (!hasSelection) {
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

  // Guarded against students with missing name/email so one bad record can't crash the page.
  const filteredStudents = students.filter((s) => {
    const query = studentSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(query) || (s.email || '').toLowerCase().includes(query);
  });
  const visibleStudents = filteredStudents.slice(0, 50);

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesStatus = listFilter === 'all' || assignment.status === listFilter;
      const haystack = `${assignment.title || ''} ${assignment.examId?.title || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(listSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assignments, listFilter, listSearch]);

  const statusCounts = useMemo(() => {
    const counts = { all: assignments.length, draft: 0, published: 0, archived: 0 };
    assignments.forEach((a) => {
      if (counts[a.status] != null) counts[a.status] += 1;
    });
    return counts;
  }, [assignments]);

  return (
    <div className="workspace-page faculty-workspace">
      <PageHeader eyebrow="Assessment delivery" title="Exam assignments" icon={ClipboardList}
        description="Connect the right assessment with the right students. Manage access, schedules, and publishing in one place."
        actions={<>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowCalendarModal(true)}
          >
            <Calendar size={16} /> View calendar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <PlusCircle size={16} /> New assignment
          </button>
        </>}
      />

      <div className="row g-3">
        <div className="col-6 col-xl-3"><StatCard icon={ClipboardList} label="Total assignments" value={loading ? '—' : statusCounts.all} trend="Across student groups" /></div>
        <div className="col-6 col-xl-3"><StatCard icon={CheckCircle2} label="Published" value={loading ? '—' : statusCounts.published} trend="Available to assigned students" trendType="positive" /></div>
        <div className="col-6 col-xl-3"><StatCard icon={Edit3} label="Drafts" value={loading ? '—' : statusCounts.draft} trend="Ready for your review" /></div>
        <div className="col-6 col-xl-3"><StatCard icon={Layers} label="Available groups" value={loading ? '—' : groups.length} trend={`${students.length} students in the directory`} /></div>
      </div>

      {showForm && (
        <section className="card faculty-form-panel" aria-labelledby="assignment-heading">
          <div className="faculty-panel-header">
            <div><div className="section-label mb-2">Assignment setup</div><h2 id="assignment-heading">{editingId ? 'Edit assignment' : 'Plan your next assessment'}</h2><p>Choose an exam, set the schedule, and select your students.</p></div>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="faculty-form-section">
            <div className="faculty-section-heading"><span className="faculty-step">01</span><div><h3>Assessment & schedule</h3><p>Choose a published exam and define when students can access it.</p></div></div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Select exam *</label>
                <select
                  className="form-select"
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
                <label className="form-label text-muted small fw-semibold">Assignment title (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Defaults to exam title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Start date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">End date *</label>
                <input
                  type="datetime-local"
                  className={`form-control ${endBeforeStart ? 'is-invalid' : ''}`}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
                {endBeforeStart && <div className="invalid-feedback d-block">Must be after the start date</div>}
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted small fw-semibold">Duration override (mins)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Uses exam default"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted small fw-semibold">Attempts allowed</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={form.attemptsAllowed}
                  onChange={(e) => setForm({ ...form, attemptsAllowed: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <div
                  className="rounded-3 p-2 w-100 text-center"
                  style={{ backgroundColor: zeroEligible ? 'var(--app-warning-soft)' : 'var(--app-primary-soft)' }}
                >
                  <div className="text-muted small">Eligible students</div>
                  <div className="fw-bold fs-4" style={{ color: zeroEligible ? 'var(--app-warning)' : FACULTY_ACCENT }}>
                    {eligibleLoading ? '…' : eligibleCount}
                  </div>
                </div>
              </div>
            </div>

            {zeroEligible && (
              <div className="faculty-note is-danger mt-3" role="status">
                <AlertTriangle size={15} className="flex-shrink-0" />
                No eligible students found for this selection — they may already have an active attempt, or the group may be empty.
              </div>
            )}

            </div>
            <div className="faculty-form-section">
            <div className="faculty-section-heading"><span className="faculty-step">02</span><div><h3>Students & groups</h3><p>Select a whole batch, individual students, or both.</p></div></div>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                  <Layers size={14} /> Select groups
                </label>
                <div className="faculty-selection-list">
                  {groups.length === 0 ? (
                    <div className="text-muted small p-2">No groups found. Create batches first.</div>
                  ) : (
                    groups.map((group) => (
                      <label key={group._id} className={`faculty-choice ${form.groupIds.includes(group._id) ? 'is-selected' : ''}`}>
                        <input type="checkbox" checked={form.groupIds.includes(group._id)} onChange={() => toggleGroup(group._id)} />
                        <span className="text-body small">
                          {group.name} <span className="text-muted">({group.code})</span>
                          <span className="badge ms-1" style={{ backgroundColor: FACULTY_ACCENT }}>{group.students?.length || 0}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                  <Users size={14} /> Select individual students
                </label>
                <div className="position-relative mb-2">
                  <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-4"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="faculty-selection-list">
                  {visibleStudents.length === 0 ? (
                    <div className="text-muted small p-2 text-center">No matching students</div>
                  ) : (
                    visibleStudents.map((student) => (
                      <label key={student._id} className={`faculty-choice ${form.studentIds.includes(student._id) ? 'is-selected' : ''}`}>
                        <input type="checkbox" checked={form.studentIds.includes(student._id)} onChange={() => toggleStudent(student._id)} />
                        <span className="text-body small">
                          {student.name || 'Unnamed student'} <span className="text-muted">({student.email || 'no email'})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {filteredStudents.length > 50 && (
                  <div className="small text-muted mt-1">
                    Showing 50 of {filteredStudents.length} matches — refine your search to see more.
                  </div>
                )}
              </div>
            </div>

            </div>
            <div className="faculty-form-section">
              <div className="faculty-section-heading"><span className="faculty-step">03</span><div><h3>Additional instructions</h3><p>Include context or notes for this assignment.</p></div></div>
              <label className="form-label text-muted small fw-semibold">Notes (optional)</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="faculty-form-footer justify-content-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingId ? 'Update assignment' : 'Create draft'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="faculty-toolbar">
        <div className="faculty-tabs" role="group" aria-label="Filter assignments by status">
          {statusFilters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`faculty-tab ${listFilter === key ? 'is-active' : ''}`}
              aria-pressed={listFilter === key}
              onClick={() => setListFilter(key)}
            >
              {label} <span>{statusCounts[key]}</span>
            </button>
          ))}
        </div>
        <div className="faculty-search">
          <Search size={17} />
          <input
            type="text"
            className="form-control"
            aria-label="Search assignments"
            placeholder="Search assignments..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-panel" role="status"><div className="spinner-border text-primary mb-3" /><p className="text-muted mb-0">Loading assignments...</p></div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Your first assignment starts here" description="Schedule a published exam for a student group or individual students." actionLabel="New assignment" onAction={() => { resetForm(); setShowForm(true); }} />
      ) : visibleAssignments.length === 0 ? (
        <EmptyState icon={Search} title="No matching assignments" description="Try another search or clear your filters to see all assignments." actionLabel="Clear filters" onAction={() => { setListSearch(''); setListFilter('all'); }} />
      ) : (
        <div className="row g-3">
          {visibleAssignments.map((assignment) => {
            const style = statusStyles[assignment.status] || statusStyles.draft;
            return (
              <div key={assignment._id} className="col-12">
                <div className="card faculty-record">
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span
                          className="badge text-uppercase"
                          style={{ backgroundColor: style.bg, color: style.color, fontWeight: 600 }}
                        >
                          {assignment.status}
                        </span>
                        <span className="badge" style={{ backgroundColor: 'var(--app-subtle)', color: 'var(--app-muted)' }}>
                          {assignment.assignmentType}
                        </span>
                      </div>
                      <h5 className="fw-bold text-body mb-1">{assignment.title || assignment.examId?.title || 'Untitled'}</h5>
                      <p className="text-muted small mb-2">
                        Exam: {assignment.examId?.title || '—'} · {assignment.examId?.category}
                      </p>
                      <div className="d-flex flex-wrap gap-3 small text-muted">
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={14} />
                          {new Date(assignment.startDate).toLocaleString()} — {new Date(assignment.endDate).toLocaleString()}
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
                            <span key={g._id} className="badge" style={{ backgroundColor: 'var(--app-subtle)', color: 'var(--app-muted)' }}>
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
                          className="btn btn-sm text-white d-flex align-items-center gap-1"
                          style={{ backgroundColor: FACULTY_ACCENT, borderColor: FACULTY_ACCENT }}
                          onClick={() => handlePublish(assignment._id)}
                        >
                          <Send size={14} /> Publish
                        </button>
                      )}
                      {assignment.status !== 'archived' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
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
            );
          })}
        </div>
      )}

      <div className="faculty-note">
          <CheckCircle2 size={16} style={{ color: FACULTY_ACCENT }} />
          Publish an assignment when it is ready. Only assigned students can access the exam during its scheduled window.
      </div>

      <ExamScheduleCalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} assignments={assignments} />
    </div>
  );
};

export default ExamAssignment;

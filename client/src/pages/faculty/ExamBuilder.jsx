import '../../styles/faculty.css';
import React, { useEffect, useMemo, useState } from 'react';
import { inferSection, SECTION_LABELS } from '../../utils/examSections';
import ResultReleaseControls from '../../components/ResultReleaseControls';
import API, { questionAPI } from '../../services/api';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, Calendar, CheckSquare, ChevronDown, Clock, Code2, FileText, Save, Search, Send, Settings2 } from 'lucide-react';

const FACULTY_ACCENT = 'var(--app-primary)';

const categoryOptions = [
  'Data Structures & Algorithms',
  'Programming Fundamentals',
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Aptitude',
  'Verbal Ability',
  'Custom',
];

const toLocalInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const ExamBuilder = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const examBasePath = pathname.startsWith('/admin/') ? '/admin/exams' : '/faculty/exams';
  const { id: examId } = useParams();
  const isEditing = Boolean(examId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    testInstructions: '',
    testInstructionsEnabled: false,
    category: 'Data Structures & Algorithms',
    customCategory: '',
    duration: 60,
    allowRetake: true,
    maxAttempts: 3,
    resultReleaseMode: 'manual',
    resultReleaseDelayHours: 24,
    startDate: toLocalInput(new Date()),
    endDate: toLocalInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: true,
    status: 'published',
    questions: [],
    codingProblems: [],
    sectionAssignments: [],
  });

  const [mcqBank, setMcqBank] = useState([]);
  const [codingBank, setCodingBank] = useState([]);
  const [mcqSearch, setMcqSearch] = useState('');
  const [codingSearch, setCodingSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(isEditing);
  const [showPublishPreview, setShowPublishPreview] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (!examId) return;
    let active = true;
    const fetchExam = async () => {
      try {
        setExamLoading(true);
        const response = await API.get(`/exams/${examId}`);
        const exam = response.data.exam;
        if (!active) return;
        setFormData((current) => ({
          ...current,
          ...exam,
          customCategory: categoryOptions.includes(exam.category) ? '' : exam.category,
          testInstructionsEnabled: Boolean(exam.testInstructions),
          startDate: toLocalInput(new Date(exam.startDate)),
          endDate: toLocalInput(new Date(exam.endDate)),
          questions: (exam.questions || []).map((question) => question._id || question),
          codingProblems: (exam.codingProblems || []).map((problem) => problem._id || problem),
        }));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load assessment for editing.');
        navigate(examBasePath);
      } finally {
        if (active) setExamLoading(false);
      }
    };
    fetchExam();
    return () => { active = false; };
  }, [examId, navigate]);

  const fetchBanks = async () => {
    try {
      const [qRes, cRes] = await Promise.all([questionAPI.getAll(), API.get('/coding')]);
      setMcqBank(qRes.data.questions || []);
      setCodingBank(cRes.data.problems || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMcq = (qId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.includes(qId)
        ? prev.questions.filter((id) => id !== qId)
        : [...prev.questions, qId],
    }));
  };

  const handleToggleCoding = (pId) => {
    setFormData((prev) => ({
      ...prev,
      codingProblems: prev.codingProblems.includes(pId)
        ? prev.codingProblems.filter((id) => id !== pId)
        : [...prev.codingProblems, pId],
    }));
  };

  const filteredMcq = useMemo(
    () => mcqBank.filter((q) => q.questionText?.toLowerCase().includes(mcqSearch.toLowerCase())),
    [mcqBank, mcqSearch]
  );
  const filteredCoding = useMemo(
    () => codingBank.filter((p) => p.title?.toLowerCase().includes(codingSearch.toLowerCase())),
    [codingBank, codingSearch]
  );

  const selectedMarks = useMemo(() => {
    const mcqMarks = mcqBank
      .filter((q) => formData.questions.includes(q._id))
      .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    const codingMarks = codingBank
      .filter((p) => formData.codingProblems.includes(p._id))
      .reduce((sum, p) => sum + (Number(p.marks) || 0), 0);
    return mcqMarks + codingMarks;
  }, [formData.questions, formData.codingProblems, mcqBank, codingBank]);

  const marksMismatch = formData.totalMarks > 0 && selectedMarks !== Number(formData.totalMarks);
  const passingExceedsTotal = Number(formData.passingMarks) > Number(formData.totalMarks);
  const endBeforeStart = new Date(formData.endDate) <= new Date(formData.startDate);

  const handleSubmit = (e, statusOverride) => {
    e.preventDefault();
    const status = statusOverride || formData.status;

    if (!formData.title) return toast.error('Please enter exam title');
    if (formData.category === 'Custom' && !formData.customCategory?.trim()) return toast.error('Please enter a custom category');
    if (!Number(formData.duration) || Number(formData.duration) < 1) return toast.error('Duration must be at least 1 minute');
    if (!Number(formData.totalMarks) || Number(formData.totalMarks) <= 0) return toast.error('Total marks must be greater than 0');
    if (Number(formData.passingMarks) < 0 || Number(formData.passingMarks) > Number(formData.totalMarks)) return toast.error('Passing marks must be between 0 and total marks');
    if (formData.questions.length === 0 && formData.codingProblems.length === 0) {
      return toast.error('Please select at least one MCQ or Coding problem for the exam');
    }
    if (endBeforeStart) return toast.error('End date must be after the start date');

    if (status === 'published') {
      setShowPublishPreview(true);
      return;
    }

    saveExam(status);
  };

  const saveExam = async (status) => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description,
      testInstructions: formData.testInstructionsEnabled ? formData.testInstructions.trim() : '',
      category: formData.category === 'Custom' ? formData.customCategory || 'Custom' : formData.category,
      duration: Number(formData.duration),
      allowRetake: formData.allowRetake,
      maxAttempts: Number(formData.maxAttempts),
      resultReleaseMode: formData.resultReleaseMode,
      resultReleaseDelayHours: Number(formData.resultReleaseDelayHours),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      totalMarks: Number(formData.totalMarks),
      passingMarks: Number(formData.passingMarks),
      negativeMarking: formData.negativeMarking,
      questions: formData.questions,
      codingProblems: formData.codingProblems,
      sectionAssignments: formData.questions.map(questionId => ({ questionId, section: formData.sectionAssignments?.find(a => String(a.questionId) === String(questionId))?.section || inferSection(mcqBank.find(q => q._id === questionId) || {}) })),
      status,
    };

    try {
      setLoading(true);
      if (isEditing) {
        await API.put(`/exams/${examId}`, payload);
      } else {
        await API.post('/exams', payload);
      }
      toast.success(status === 'published'
        ? `Exam ${isEditing ? 'updated and published' : 'created and published'} successfully!`
        : 'Exam saved as draft.');
      navigate(examBasePath);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} exam`);
    } finally {
      setLoading(false);
      setShowPublishPreview(false);
    }
  };

  if (examLoading) {
    return <div className="loading-panel" role="status"><div className="spinner-border text-primary mb-3" /><p className="text-muted mb-0">Loading assessment…</p></div>;
  }

  return (
    <div className="workspace-page faculty-workspace pb-5">
      <div className="mb-4">
        <h1 className="page-title fw-bold text-body m-0">{isEditing ? 'Edit assessment' : 'Exam Builder'}</h1>
        <p className="text-muted small m-0">Configure timing, scoring, and questions, then preview before publishing.</p>
      </div>

      {isEditing && formData.status === 'published' && (
        <div className="alert alert-info mb-0" role="status">
          Published assessment. If any student has attempted it, content, scoring, and schedule changes are locked to protect existing results.
        </div>
      )}

      <form>
        <div className="row g-4">
          {/* General Details */}
          <div className="col-12 col-lg-6">
            <div className="card p-4 h-100">
              <h5 className="fw-bold text-body mb-3 d-flex align-items-center gap-2">
                <FileText size={18} style={{ color: FACULTY_ACCENT }} /> General settings
              </h5>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Exam title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mid-Term Coding & Algorithms Assessment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Instructions for candidates..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="testInstructionsEnabled"
                  checked={formData.testInstructionsEnabled}
                  onChange={(e) => setFormData({ ...formData, testInstructionsEnabled: e.target.checked })}
                />
                <label className="form-check-label text-body small" htmlFor="testInstructionsEnabled">
                  Add optional test-specific instructions
                </label>
              </div>
              {formData.testInstructionsEnabled && (
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold" htmlFor="testInstructions">
                    Instructions shown to students before this test
                  </label>
                  <textarea
                    id="testInstructions"
                    className="form-control"
                    rows="3"
                    maxLength={3000}
                    placeholder="Add any instructions specific to this assessment..."
                    value={formData.testInstructions}
                    onChange={(e) => setFormData({ ...formData, testInstructions: e.target.value })}
                  />
                  <div className="form-text text-end">{formData.testInstructions.length}/3000</div>
                </div>
              )}

              <div className="mb-1">
                <label className="form-label text-muted small fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {!categoryOptions.includes(formData.category) && formData.category && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
                  {categoryOptions.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {formData.category === 'Custom' && (
                <div className="mb-3 mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter custom category name"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    required
                  />
                </div>
              )}

              <hr className="my-3" />

              <h6 className="fw-semibold text-body small mb-3 d-flex align-items-center gap-2">
                <Calendar size={16} style={{ color: FACULTY_ACCENT }} /> Schedule
              </h6>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Opens</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Closes</label>
                  <input
                    type="datetime-local"
                    className={`form-control ${endBeforeStart ? 'is-invalid' : ''}`}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                  {endBeforeStart && <div className="invalid-feedback d-block">Must be after the opening time</div>}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                  <Clock size={14} /> Duration (minutes)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.duration}
                  min={1}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  required
                />
              </div>

              <hr className="my-3" />

              <h6 className="fw-semibold text-body small mb-3 d-flex align-items-center gap-2">
                <Settings2 size={16} style={{ color: FACULTY_ACCENT }} /> Scoring
              </h6>
              <div className="row g-3 mb-2">
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Total marks</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.totalMarks}
                    min={0}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Passing marks</label>
                  <input
                    type="number"
                    className={`form-control ${passingExceedsTotal ? 'is-invalid' : ''}`}
                    value={formData.passingMarks}
                    min={0}
                    onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                    required
                  />
                  {passingExceedsTotal && <div className="invalid-feedback d-block">Cannot exceed total marks</div>}
                </div>
              </div>

              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="negMark"
                  checked={formData.negativeMarking}
                  onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                />
                <label className="form-check-label text-body small" htmlFor="negMark">
                  Enable negative marking for wrong MCQs (0.25 penalty)
                </label>
              </div>
            </div>
          </div>

          {/* Question & Coding Selection */}
          <div className="col-12 col-lg-6">
            <div className="card p-4 h-100 d-flex flex-column">
              <h5 className="fw-bold text-body mb-3">Build from question bank</h5>

              <div
                className="rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between"
                style={{ backgroundColor: marksMismatch ? 'var(--app-warning-soft)' : `${FACULTY_ACCENT}14` }}
              >
                <span className="small fw-semibold" style={{ color: marksMismatch ? 'var(--app-danger)' : FACULTY_ACCENT }}>
                  {marksMismatch && <AlertTriangle size={14} className="me-1" style={{ marginTop: -2 }} />}
                  Marks selected: {selectedMarks} / {formData.totalMarks || 0}
                </span>
                {marksMismatch && (
                  <span className="small" style={{ color: 'var(--app-danger)' }}>
                    {selectedMarks > formData.totalMarks ? 'Over target' : 'Under target'}
                  </span>
                )}
              </div>

              {/* MCQ Selection */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-semibold small mb-0 d-flex align-items-center gap-1" style={{ color: 'var(--app-warning)' }}>
                  <CheckSquare size={16} /> MCQs selected ({formData.questions.length})
                </h6>
              </div>
              <div className="position-relative mb-2">
                <Search size={14} className="position-absolute text-muted" style={{ top: 10, left: 10 }} />
                <input
                  type="text"
                  className="form-control form-control-sm ps-4"
                  placeholder="Search MCQs..."
                  value={mcqSearch}
                  onChange={(e) => setMcqSearch(e.target.value)}
                />
              </div>
              <div className="bg-body-tertiary p-2 rounded-3 mb-4 overflow-auto" style={{ maxHeight: 170 }}>
                {filteredMcq.length === 0 ? (
                  <div className="text-muted small text-center py-3">
                    {mcqBank.length === 0 ? 'No MCQs available in question bank' : 'No matches for your search'}
                  </div>
                ) : (
                  filteredMcq.map((q) => {
                    const selected = formData.questions.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => handleToggleMcq(q._id)}
                        role="checkbox"
                        aria-checked={selected}
                        tabIndex={0}
                        className="p-2 rounded mb-1 small d-flex justify-content-between align-items-center"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selected ? 'var(--app-warning)' : 'transparent',
                          color: selected ? '#fff' : 'inherit',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        <span className="text-truncate">{q.questionText}</span>
                        <span className={`badge ms-2 ${selected ? 'bg-white text-dark' : 'bg-secondary'}`}>{q.marks}m</span>
                      </div>
                    );
                  })
                )}
              </div>

              <section className="border rounded-3 p-3 mt-3" aria-label="Test section mapping">
                <h6 className="fw-bold mb-2">Test sections</h6>
                <p className="small text-muted">Assign selected MCQs to their live exam section. Coding problems appear under Coding Test automatically.</p>
                {formData.questions.length === 0 && <p className="small text-muted mb-0">Select MCQs to configure their sections.</p>}
                {formData.questions.map((questionId, index) => {
                  const question = mcqBank.find(q => q._id === questionId);
                  const section = formData.sectionAssignments?.find(a => String(a.questionId) === String(questionId))?.section || inferSection(question || {});
                  return <div key={questionId} className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <label htmlFor={'section-' + questionId} className="small flex-grow-1" style={{ flexBasis: '55%' }}>{index + 1}. {question?.questionText || 'Selected question'}</label>
                    <select id={'section-' + questionId} className="form-select form-select-sm" style={{ width: 160 }} value={section} onChange={event => setFormData(prev => ({ ...prev, sectionAssignments: [...(prev.sectionAssignments || []).filter(a => String(a.questionId) !== String(questionId)), { questionId, section: event.target.value }] }))}>
                      {Object.entries(SECTION_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>;
                })}
              </section>

              <ResultReleaseControls mode={formData.resultReleaseMode} delayHours={formData.resultReleaseDelayHours} onChange={changes => setFormData(prev => ({ ...prev, ...changes }))} />
              <section className="border rounded-3 p-3 mt-3 mb-3"><h6 className="fw-bold">Retake settings</h6><label className="form-check mb-2"><input type="checkbox" className="form-check-input" checked={formData.allowRetake} onChange={event => setFormData(prev => ({ ...prev, allowRetake: event.target.checked }))} /><span className="form-check-label">Allow retakes for direct group exams</span></label><label className="form-label small" htmlFor="exam-max-attempts">Maximum attempts (0 = unlimited)</label><input id="exam-max-attempts" type="number" min="0" step="1" className="form-control" value={formData.maxAttempts} onChange={event => setFormData(prev => ({ ...prev, maxAttempts: Math.max(0, Math.floor(Number(event.target.value) || 0)) }))} /><p className="small text-muted mt-2 mb-0">For assigned exams, Attempts Allowed in the assignment controls student retakes.</p></section>
              {/* Coding Selection */}
              <h6 className="fw-semibold small mb-2 d-flex align-items-center gap-1" style={{ color: 'var(--app-primary)' }}>
                <Code2 size={16} /> Coding problems selected ({formData.codingProblems.length})
              </h6>
              <div className="position-relative mb-2">
                <Search size={14} className="position-absolute text-muted" style={{ top: 10, left: 10 }} />
                <input
                  type="text"
                  className="form-control form-control-sm ps-4"
                  placeholder="Search coding problems..."
                  value={codingSearch}
                  onChange={(e) => setCodingSearch(e.target.value)}
                />
              </div>
              <div className="bg-body-tertiary p-2 rounded-3 overflow-auto flex-grow-1" style={{ maxHeight: 170 }}>
                {filteredCoding.length === 0 ? (
                  <div className="text-muted small text-center py-3">
                    {codingBank.length === 0 ? 'No coding problems available' : 'No matches for your search'}
                  </div>
                ) : (
                  filteredCoding.map((p) => {
                    const selected = formData.codingProblems.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        onClick={() => handleToggleCoding(p._id)}
                        role="checkbox"
                        aria-checked={selected}
                        tabIndex={0}
                        className="p-2 rounded mb-1 small d-flex justify-content-between align-items-center"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selected ? 'var(--app-primary)' : 'transparent',
                          color: selected ? '#fff' : 'inherit',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        <span className="text-truncate">{p.title}</span>
                        <span className={`badge ms-2 ${selected ? 'bg-white text-dark' : 'bg-secondary'}`}>{p.marks}m</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div
          className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mt-4 p-3 rounded-3 border"
          style={{ position: 'sticky', bottom: 16, backgroundColor: 'var(--bs-body-bg, #fff)', zIndex: 5 }}
        >
          <div className="small text-muted">
            {formData.questions.length + formData.codingProblems.length} question{formData.questions.length + formData.codingProblems.length === 1 ? '' : 's'} selected
            {marksMismatch && <span style={{ color: 'var(--app-danger)' }}> · marks don't match total</span>}
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary fw-semibold"
              disabled={loading}
              onClick={(e) => handleSubmit(e, formData.status === 'published' ? 'published' : 'draft')}
            >
              <Save size={16} /> {isEditing ? 'Save changes' : 'Save as draft'}
            </button>
            <button
              type="button"
              className="btn fw-semibold text-white"
              style={{ backgroundColor: FACULTY_ACCENT, borderColor: FACULTY_ACCENT }}
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'published')}
            >
              <Send size={16} /> {loading ? 'Saving...' : isEditing ? 'Preview & update' : 'Preview & publish'}
            </button>
          </div>
        </div>
      </form>

      {showPublishPreview && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1080, background: 'rgba(10, 15, 30, .65)' }}>
          <section className="card shadow-lg w-100" role="dialog" aria-modal="true" aria-labelledby="exam-publish-preview-title" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 id="exam-publish-preview-title" className="h5 mb-0">Review before publishing</h2>
              <button type="button" className="btn-close" aria-label="Close preview" onClick={() => setShowPublishPreview(false)} />
            </div>
            <div className="card-body">
              <p className="text-muted">Check these details before candidates can see this assessment.</p>
              <dl className="row mb-0 small">
                <dt className="col-5">Title</dt><dd className="col-7">{formData.title}</dd>
                <dt className="col-5">Availability</dt><dd className="col-7">{new Date(formData.startDate).toLocaleString()} – {new Date(formData.endDate).toLocaleString()}</dd>
                <dt className="col-5">Duration</dt><dd className="col-7">{formData.duration} minutes</dd>
                <dt className="col-5">Questions</dt><dd className="col-7">{formData.questions.length} MCQ, {formData.codingProblems.length} coding</dd>
                <dt className="col-5">Marks</dt><dd className="col-7">{selectedMarks} selected / {formData.totalMarks} total · pass at {formData.passingMarks}</dd>
              </dl>
              {marksMismatch && <div className="alert alert-warning mt-3 mb-0">Selected question marks do not equal the configured total. Confirm this is intentional.</div>}
              {isEditing && <div className="alert alert-info mt-3 mb-0">Existing student attempts and results are preserved. Content, scoring, or schedule changes are rejected once an attempt exists.</div>}
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" disabled={loading} onClick={() => setShowPublishPreview(false)}>Back to edit</button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={() => saveExam('published')}>
                <Send size={16} /> {loading ? 'Publishing…' : isEditing ? 'Confirm update' : 'Confirm publish'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ExamBuilder;
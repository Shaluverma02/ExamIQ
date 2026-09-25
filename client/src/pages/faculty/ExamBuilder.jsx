import '../../styles/faculty.css';
import React, { useEffect, useMemo, useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
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

const toLocalInput = (date) => date.toISOString().slice(0, 16);

const ExamBuilder = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Data Structures & Algorithms',
    customCategory: '',
    duration: 60,
    startDate: toLocalInput(new Date()),
    endDate: toLocalInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: true,
    status: 'published',
    questions: [],
    codingProblems: [],
  });

  const [mcqBank, setMcqBank] = useState([]);
  const [codingBank, setCodingBank] = useState([]);
  const [mcqSearch, setMcqSearch] = useState('');
  const [codingSearch, setCodingSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const [qRes, cRes] = await Promise.all([API.get('/questions'), API.get('/coding')]);
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

  const handleSubmit = async (e, statusOverride) => {
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

    const payload = {
      ...formData,
      category: formData.category === 'Custom' ? formData.customCategory || 'Custom' : formData.category,
      status,
    };
    delete payload.customCategory;

    try {
      setLoading(true);
      await API.post('/exams', payload);
      toast.success(status === 'published' ? 'Exam created and published successfully!' : 'Exam saved as draft.');
      navigate('/faculty/dashboard');
    } catch (err) {
      toast.error('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-5">
      <div className="mb-4">
        <h3 className="fw-bold text-body m-0">Exam Builder</h3>
        <p className="text-muted small m-0">Configure timing, scoring, and questions, then publish or save as a draft.</p>
      </div>

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

              <div className="mb-1">
                <label className="form-label text-muted small fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
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
              onClick={(e) => handleSubmit(e, 'draft')}
            >
              <Save size={16} /> Save as draft
            </button>
            <button
              type="button"
              className="btn fw-semibold text-white"
              style={{ backgroundColor: FACULTY_ACCENT, borderColor: FACULTY_ACCENT }}
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'published')}
            >
              <Send size={16} /> {loading ? 'Publishing...' : 'Publish exam'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExamBuilder;
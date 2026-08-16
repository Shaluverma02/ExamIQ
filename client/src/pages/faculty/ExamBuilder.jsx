import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, PlusCircle, CheckSquare, Code2 } from 'lucide-react';

const ExamBuilder = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Data Structures & Algorithms',
    duration: 60,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: true,
    status: 'published',
    questions: [],
    codingProblems: [],
  });

  const [mcqBank, setMcqBank] = useState([]);
  const [codingBank, setCodingBank] = useState([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Please enter exam title');
    if (formData.questions.length === 0 && formData.codingProblems.length === 0) {
      return toast.error('Please select at least one MCQ or Coding problem for the exam');
    }

    try {
      setLoading(true);
      await API.post('/exams', formData);
      toast.success('Exam created and published successfully!');
      navigate('/faculty/dashboard');
    } catch (err) {
      toast.error('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-extrabold text-light m-0">Exam Builder Portal</h3>
        <p className="text-muted small m-0">Configure parameters, timing windows, negative marks, and questions</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* General Details */}
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold text-light mb-3">1. General Exam Settings</h5>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Exam Title *</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-light border-0"
                  placeholder="e.g. Mid-Term Coding & Algorithms Assessment 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Description</label>
                <textarea
                  className="form-control bg-secondary text-light border-0"
                  rows="2"
                  placeholder="Instructions for candidates..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Duration (Minutes)</label>
                  <input
                    type="number"
                    className="form-control bg-secondary text-light border-0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Category</label>
                  <input
                    type="text"
                    className="form-control bg-secondary text-light border-0"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Total Marks</label>
                  <input
                    type="number"
                    className="form-control bg-secondary text-light border-0"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Passing Marks</label>
                  <input
                    type="number"
                    className="form-control bg-secondary text-light border-0"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="negMark"
                  checked={formData.negativeMarking}
                  onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                />
                <label className="form-check-label text-light small" htmlFor="negMark">
                  Enable Negative Marking for Wrong MCQs (0.25 penalty)
                </label>
              </div>
            </div>
          </div>

          {/* Question & Coding Selection */}
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold text-light mb-3">2. Select Questions from Bank</h5>

              {/* MCQ Selection */}
              <h6 className="fw-semibold text-warning mb-2 small d-flex align-items-center gap-1">
                <CheckSquare size={16} /> MCQs Selected ({formData.questions.length})
              </h6>
              <div className="bg-dark p-2 rounded-3 mb-4 overflow-auto" style={{ maxHeight: 180 }}>
                {mcqBank.length === 0 ? (
                  <div className="text-muted small text-center py-2">No MCQs available in Question Bank</div>
                ) : (
                  mcqBank.map((q) => (
                    <div
                      key={q._id}
                      onClick={() => handleToggleMcq(q._id)}
                      className={`p-2 rounded mb-1 cursor-pointer small d-flex justify-content-between ${
                        formData.questions.includes(q._id) ? 'bg-primary text-white fw-semibold' : 'text-secondary hover-bg-secondary'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="text-truncate">{q.questionText}</span>
                      <span className="badge bg-secondary ms-2">{q.marks}m</span>
                    </div>
                  ))
                )}
              </div>

              {/* Coding Selection */}
              <h6 className="fw-semibold text-info mb-2 small d-flex align-items-center gap-1">
                <Code2 size={16} /> Coding Problems Selected ({formData.codingProblems.length})
              </h6>
              <div className="bg-dark p-2 rounded-3 overflow-auto" style={{ maxHeight: 180 }}>
                {codingBank.length === 0 ? (
                  <div className="text-muted small text-center py-2">No Coding Problems available</div>
                ) : (
                  codingBank.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleToggleCoding(p._id)}
                      className={`p-2 rounded mb-1 cursor-pointer small d-flex justify-content-between ${
                        formData.codingProblems.includes(p._id) ? 'bg-info text-dark fw-bold' : 'text-secondary hover-bg-secondary'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="text-truncate">{p.title}</span>
                      <span className="badge bg-secondary ms-2">{p.marks}m</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-success btn-lg w-100 mt-4 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
          disabled={loading}
        >
          <Save size={20} /> {loading ? 'Publishing Exam...' : 'Publish Exam Now'}
        </button>
      </form>
    </div>
  );
};

export default ExamBuilder;

import '../../styles/faculty.css';
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import {
  Trash2,
  Edit3,
  Sparkles,
  Code2,
  Plus,
  X,
  FileJson,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
} from 'lucide-react';
import { toast } from 'react-toastify';
import AIQuestionGeneratorModal from '../../components/AIQuestionGeneratorModal';
import JsonImportModal from '../../components/JsonImportModal';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'C', value: 'c' },
];

const DEFAULT_STARTER_CODE = {
  javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\n// Write your solution here\n`,
  python: `import sys\ninput_data = sys.stdin.read().strip()\n\n# Write your solution here\n`,
  java: `import java.util.*;\n\npublic class Main {\n public static void main(String[] args) {\n Scanner sc = new Scanner(System.in);\n // Write your solution here\n }\n}`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n // Write your solution here\n return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n // Write your solution here\n return 0;\n}`,
};

const createEmptyTestCase = (isHidden = false) => ({
  input: '',
  expectedOutput: '',
  isHidden,
  weight: 1,
});

const createDefaultStarterCode = () =>
  LANGUAGES.map((lang) => ({
    language: lang.value,
    code: DEFAULT_STARTER_CODE[lang.value],
  }));

const QuestionBank = ({ defaultTab = 'mcq' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [questions, setQuestions] = useState([]);
  const [problems, setProblems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals State
  const [showAiModal, setShowAiModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [editingMcqId, setEditingMcqId] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null); // Preview Drawer

  // MCQ Form State
  const [mcqForm, setMcqForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 2,
    negativeMarks: 0,
    difficulty: 'easy',
    category: 'General',
    topic: 'General',
    explanation: '',
  });

  // Coding Form State
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [editingCodingId, setEditingCodingId] = useState(null);
  const [codingForm, setCodingForm] = useState({
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    difficulty: 'easy',
    category: 'Data Structures',
    topic: 'Arrays',
    tags: '',
    marks: 10,
    timeLimit: 2,
    memoryLimit: 128,
    allowedLanguages: ['javascript', 'python', 'java', 'cpp', 'c'],
    starterCode: createDefaultStarterCode(),
    testCases: [createEmptyTestCase(false), createEmptyTestCase(true)],
  });

  useEffect(() => {
    fetchBankData();
  }, []);

  const fetchBankData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        API.get('/questions'),
        API.get('/coding'),
      ]);
      setQuestions(qRes.data.questions || []);
      setProblems(cRes.data.problems || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  const resetMcqForm = () => {
    setMcqForm({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      marks: 2,
      negativeMarks: 0,
      difficulty: 'easy',
      category: 'General',
      topic: 'General',
      explanation: '',
    });
    setEditingMcqId(null);
  };

  const resetCodingForm = () => {
    setCodingForm({
      title: '',
      description: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      difficulty: 'easy',
      category: 'Data Structures',
      topic: 'Arrays',
      tags: '',
      marks: 10,
      timeLimit: 2,
      memoryLimit: 128,
      allowedLanguages: ['javascript', 'python', 'java', 'cpp', 'c'],
      starterCode: createDefaultStarterCode(),
      testCases: [createEmptyTestCase(false), createEmptyTestCase(true)],
    });
    setEditingCodingId(null);
  };

  // MCQ CREATE / UPDATE
  const handleSaveMcq = async (e) => {
    e.preventDefault();
    if (!mcqForm.questionText.trim()) {
      toast.warning('Question text is required');
      return;
    }

    try {
      setSaving(true);
      const options = [
        { optionText: mcqForm.optionA, isCorrect: mcqForm.correctAnswer === 'A' },
        { optionText: mcqForm.optionB, isCorrect: mcqForm.correctAnswer === 'B' },
        { optionText: mcqForm.optionC, isCorrect: mcqForm.correctAnswer === 'C' },
        { optionText: mcqForm.optionD, isCorrect: mcqForm.correctAnswer === 'D' },
      ];

      const payload = {
        questionText: mcqForm.questionText,
        options,
        marks: Number(mcqForm.marks),
        negativeMarks: Number(mcqForm.negativeMarks),
        difficulty: mcqForm.difficulty,
        category: mcqForm.category || 'General',
        topic: mcqForm.topic || 'General',
        explanation: mcqForm.explanation,
      };

      if (editingMcqId) {
        await API.put(`/questions/${editingMcqId}`, payload);
        toast.success('MCQ Question updated successfully');
      } else {
        await API.post('/questions', payload);
        toast.success('MCQ Question added to bank');
      }

      setShowMcqModal(false);
      resetMcqForm();
      fetchBankData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save MCQ');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditMcq = (q) => {
    setEditingMcqId(q._id);
    const optA = q.options?.[0]?.optionText || '';
    const optB = q.options?.[1]?.optionText || '';
    const optC = q.options?.[2]?.optionText || '';
    const optD = q.options?.[3]?.optionText || '';

    let correctLetter = 'A';
    if (q.options?.[1]?.isCorrect) correctLetter = 'B';
    else if (q.options?.[2]?.isCorrect) correctLetter = 'C';
    else if (q.options?.[3]?.isCorrect) correctLetter = 'D';

    setMcqForm({
      questionText: q.questionText || '',
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: correctLetter,
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0,
      difficulty: q.difficulty || 'easy',
      category: q.category || 'General',
      topic: q.topic || 'General',
      explanation: q.explanation || '',
    });
    setShowMcqModal(true);
  };

  // CODING - CREATE / UPDATE
  const handleSaveCoding = async (e) => {
    e.preventDefault();
    if (!codingForm.title.trim()) {
      toast.warning('Problem title is required');
      return;
    }
    if (!codingForm.description.trim()) {
      toast.warning('Problem description is required');
      return;
    }

    try {
      setSaving(true);
      const validTestCases = codingForm.testCases.filter(
        (tc) => (tc.input && tc.input.trim() !== '') || (tc.expectedOutput && tc.expectedOutput.trim() !== '')
      );

      const payload = {
        title: codingForm.title,
        description: codingForm.description,
        inputFormat: codingForm.inputFormat,
        outputFormat: codingForm.outputFormat,
        constraints: codingForm.constraints,
        difficulty: codingForm.difficulty,
        category: codingForm.category,
        topic: codingForm.topic,
        tags: codingForm.tags ? codingForm.tags.split(',').map((t) => t.trim()) : [],
        marks: Number(codingForm.marks),
        timeLimit: Number(codingForm.timeLimit),
        memoryLimit: Number(codingForm.memoryLimit),
        allowedLanguages: codingForm.allowedLanguages,
        starterCode: codingForm.starterCode,
        testCases: validTestCases,
      };

      if (editingCodingId) {
        await API.put(`/coding/${editingCodingId}`, payload);
        toast.success('Coding problem updated');
      } else {
        await API.post('/coding', payload);
        toast.success('Coding problem added to bank');
      }

      setShowCodingModal(false);
      resetCodingForm();
      fetchBankData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save coding problem');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCoding = async (id) => {
    try {
      const res = await API.get(`/coding/${id}`);
      const problem = res.data.problem;
      const testCases = res.data.testCases || [];

      setEditingCodingId(problem._id);
      setCodingForm({
        title: problem.title || '',
        description: problem.description || '',
        inputFormat: problem.inputFormat || '',
        outputFormat: problem.outputFormat || '',
        constraints: problem.constraints || '',
        difficulty: problem.difficulty || 'easy',
        category: problem.category || 'Data Structures',
        topic: problem.topic || 'Arrays',
        tags: Array.isArray(problem.tags) ? problem.tags.join(', ') : '',
        marks: problem.marks ?? 10,
        timeLimit: problem.timeLimit ?? 2,
        memoryLimit: problem.memoryLimit ?? 128,
        allowedLanguages: Array.isArray(problem.allowedLanguages) ? problem.allowedLanguages : ['javascript', 'python', 'java', 'cpp', 'c'],
        starterCode: Array.isArray(problem.starterCode) && problem.starterCode.length > 0 ? problem.starterCode : createDefaultStarterCode(),
        testCases: testCases.length > 0 ? testCases.map((tc) => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || '', isHidden: !!tc.isHidden, weight: tc.weight || 1 })) : [createEmptyTestCase(false), createEmptyTestCase(true)],
      });
      setShowCodingModal(true);
    } catch (err) {
      toast.error('Failed to load coding problem');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await API.delete(`/questions/${id}`);
      toast.info('Question deleted');
      fetchBankData();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const handleDeleteCoding = async (id) => {
    if (!window.confirm('Delete this coding problem? Associated test cases will also be deleted.')) return;
    try {
      await API.delete(`/coding/${id}`);
      toast.info('Coding problem deleted');
      fetchBankData();
    } catch (err) {
      toast.error('Failed to delete coding problem');
    }
  };

  // Filtered lists
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = (q.questionText || '').toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
    const matchesType = !typeFilter || (q.questionType || 'single') === typeFilter;
    const matchesCategory = !categoryFilter || (q.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesDifficulty && matchesType && matchesCategory;
  });

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = (p.title || '').toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || p.difficulty === difficultyFilter;
    const matchesCategory = !categoryFilter || (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  return (
    <div>
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <BookOpen size={28} className="text-primary" /> Question Bank
          </h3>
          <p className="text-muted small m-0">Manage and organize your assessment questions</p>
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            type="button"
            className="btn btn-info fw-bold btn-sm rounded-pill px-3 text-dark d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowImportModal(true)}
            title="Import questions from JSON file"
          >
            <FileJson size={16} /> Import JSON File
          </button>

          <button
            className="btn btn-primary fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={16} /> Generate with AI
          </button>

          <button
            className="btn btn-warning fw-bold btn-sm rounded-pill px-3 text-dark d-flex align-items-center gap-1"
            onClick={() => {
              resetMcqForm();
              setShowMcqModal(true);
            }}
          >
            <Plus size={16} /> Add Question
          </button>

          <button
            className="btn btn-info fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 text-dark"
            onClick={() => {
              resetCodingForm();
              setShowCodingModal(true);
            }}
          >
            <Code2 size={16} /> Add Coding Problem
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <ul className="nav nav-tabs border mb-4">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'mcq' ? 'active bg-body-tertiary text-body border' : 'text-muted'}`}
            onClick={() => setActiveTab('mcq')}
          >
            MCQ & Objective ({questions.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'coding' ? 'active bg-body-tertiary text-body border' : 'text-muted'}`}
            onClick={() => setActiveTab('coding')}
          >
            Coding Problems ({problems.length})
          </button>
        </li>
      </ul>

      {/* Filter & Search Bar */}
      <div className="card p-3 mb-4 rounded-3 border">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-body-tertiary border text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control bg-body-tertiary border text-body"
                placeholder="Search questions by text or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm bg-body-tertiary border text-body"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm bg-body-tertiary border text-body"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="single">Single Choice (MCQ)</option>
              <option value="multiple">Multiple Choice</option>
              <option value="boolean">True / False</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <input
              type="text"
              className="form-control form-control-sm bg-body-tertiary border text-body"
              placeholder="Filter Category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <button
              className="btn btn-outline-secondary btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
              onClick={() => {
                setSearch('');
                setDifficultyFilter('');
                setTypeFilter('');
                setCategoryFilter('');
              }}
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading question bank...</span>
          </div>
          <p className="text-muted small mt-2">Loading question bank repository...</p>
        </div>
      )}

      {/* TAB 1: MCQ & OBJECTIVE QUESTIONS */}
      {!loading && activeTab === 'mcq' && (
        <>
          {filteredQuestions.length === 0 ? (
            <div className="card text-center py-5 text-muted rounded-3 border">
              <FileQuestion size={48} className="text-secondary mb-3 opacity-50" />
              <h5 className="fw-bold text-body mb-1">No Questions Found</h5>
              <p className="small text-muted mb-4">No assessment questions match your search or filter criteria.</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-warning btn-sm rounded-pill fw-bold px-3 text-dark d-flex align-items-center gap-1"
                  onClick={() => {
                    resetMcqForm();
                    setShowMcqModal(true);
                  }}
                >
                  <Plus size={16} /> Add Question
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill fw-bold px-3 d-flex align-items-center gap-2"
                  onClick={() => setShowImportModal(true)}
                >
                  <FileJson size={16} /> Import JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm rounded-3 bg-body-tertiary overflow-hidden border">
              <div className="table-responsive m-0">
                <table className="table table-hover align-middle m-0" style={{ fontSize: '0.88rem' }}>
                  <thead>
                    <tr className="text-muted text-uppercase fs-7 border-bottom border">
                      <th className="py-3 ps-4" style={{ width: 50 }}>#</th>
                      <th className="py-3">Question Text</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">Difficulty</th>
                      <th className="py-3">Category / Topic</th>
                      <th className="py-3">Marks</th>
                      <th className="py-3 pe-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((q, idx) => (
                      <tr key={q._id}>
                        <td className="ps-4 text-muted fw-bold">{idx + 1}</td>
                        <td className="py-3">
                          <div className="fw-semibold text-body text-truncate" style={{ maxWidth: 380 }}>
                            {q.questionText}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary font-monospace text-uppercase">
                            {q.questionType || 'single'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${q.difficulty === 'easy' ? 'bg-success' : q.difficulty === 'hard' ? 'bg-danger' : 'bg-warning'}`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td>
                          <span className="small text-muted">{q.category || 'General'} / {q.topic || 'General'}</span>
                        </td>
                        <td>
                          <span className="fw-bold text-info">{q.marks} pts</span>
                          {q.negativeMarks > 0 && <span className="text-danger small ms-1">(-{q.negativeMarks})</span>}
                        </td>
                        <td className="pe-4 text-end py-3">
                          <div className="d-flex justify-content-end align-items-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-info p-1 px-2 border-0"
                              title="View Details"
                               aria-label="View Details" onClick={() => setSelectedQuestion(q)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary p-1 px-2 border-0"
                              title="Edit Question"
                               aria-label="Edit Question" onClick={() => handleOpenEditMcq(q)}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger p-1 px-2 border-0"
                              title="Delete Question"
                               aria-label="Delete Question" onClick={() => handleDeleteQuestion(q._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CODING PROBLEMS */}
      {!loading && activeTab === 'coding' && (
        <>
          {filteredProblems.length === 0 ? (
            <div className="card text-center py-5 text-muted rounded-3 border">
              <Code2 size={48} className="text-secondary mb-3 opacity-50" />
              <h5 className="fw-bold text-body mb-1">No Coding Problems Found</h5>
              <p className="small text-muted mb-4">No coding challenges match your search or filter criteria.</p>
              <button
                className="btn btn-info btn-sm rounded-pill fw-bold px-4 text-dark d-inline-flex align-items-center gap-2"
                onClick={() => {
                  resetCodingForm();
                  setShowCodingModal(true);
                }}
              >
                <Code2 size={16} /> Add Coding Problem
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {filteredProblems.map((p) => (
                <div key={p._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card p-4 rounded-3 border h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={`badge ${p.difficulty === 'easy' ? 'bg-success' : p.difficulty === 'hard' ? 'bg-danger' : 'bg-warning'}`}>
                          {p.difficulty}
                        </span>
                        <span className="badge bg-info text-dark font-monospace">{p.marks || 10} Marks</span>
                      </div>

                      <h5 className="fw-bold text-body mb-1">{p.title}</h5>

                      <div className="text-muted small mb-3">
                        <span>{p.category}</span> · <span>Topic: {p.topic}</span>
                      </div>

                      <p className="text-secondary small mb-3 text-truncate-2" style={{ maxHeight: 42, overflow: 'hidden' }}>
                        {p.description}
                      </p>
                    </div>

                    <div className="d-flex gap-2 border-top border pt-3 mt-2">
                      <button
                        className="btn btn-outline-primary btn-sm flex-fill fw-bold rounded-pill d-flex align-items-center justify-content-center gap-1"
                        onClick={() => handleEditCoding(p._id)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm rounded-circle p-2"
                        title="Delete Problem"
                         aria-label="Delete Problem" onClick={() => handleDeleteCoding(p._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* QUESTION PREVIEW MODAL */}
      {selectedQuestion && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content card text-body border ">
              <div className="modal-header border">
                <div className="d-flex align-items-center gap-2">
                  <FileQuestion size={22} className="text-primary" />
                  <h5 className="modal-title fw-bold">Question Preview</h5>
                </div>
                <button
                  type="button"
                  className="btn-close" aria-label="Close dialog"
                  onClick={() => setSelectedQuestion(null)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge bg-primary font-monospace">{selectedQuestion.questionType || 'single'}</span>
                  <span className={`badge ${selectedQuestion.difficulty === 'easy' ? 'bg-success' : selectedQuestion.difficulty === 'hard' ? 'bg-danger' : 'bg-warning'}`}>
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="badge bg-body-tertiary border text-info">{selectedQuestion.category || 'General'}</span>
                  <span className="badge bg-body-tertiary border text-body">Topic: {selectedQuestion.topic || 'General'}</span>
                  <span className="badge bg-info text-dark font-monospace">{selectedQuestion.marks} Marks</span>
                </div>

                <h5 className="fw-bold text-body mb-4">{selectedQuestion.questionText}</h5>

                <h6 className="fw-bold text-muted small text-uppercase mb-2">Options</h6>
                <div className="d-flex flex-column gap-2 mb-4">
                  {selectedQuestion.options?.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-3 border d-flex justify-content-between align-items-center ${
                        opt.isCorrect
                          ? 'border-success bg-success bg-opacity-10 text-success'
                          : 'border bg-body-tertiary text-body'
                      }`}
                    >
                      <span><strong>{String.fromCharCode(65 + i)}.</strong> {opt.optionText}</span>
                      {opt.isCorrect && <span className="badge bg-success"><CheckCircle2 size={12} className="me-1" /> Correct</span>}
                    </div>
                  ))}
                </div>

                {selectedQuestion.explanation && (
                  <div className="p-3 rounded-3 bg-body-tertiary border mb-3">
                    <h6 className="fw-bold text-info small mb-1">Explanation:</h6>
                    <p className="text-secondary small m-0">{selectedQuestion.explanation}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer border">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm rounded-pill px-3"
                  onClick={() => {
                    const q = selectedQuestion;
                    setSelectedQuestion(null);
                    handleOpenEditMcq(q);
                  }}
                >
                  <Edit3 size={14} className="me-1" /> Edit Question
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm rounded-pill px-4"
                  onClick={() => setSelectedQuestion(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MCQ MODAL */}
      {showMcqModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content card text-body border ">
              <form onSubmit={handleSaveMcq}>
                <div className="modal-header border">
                  <h5 className="modal-title fw-bold">
                    {editingMcqId ? 'Edit MCQ Question' : 'Add MCQ Question'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close" aria-label="Close dialog"
                    onClick={() => {
                      setShowMcqModal(false);
                      resetMcqForm();
                    }}
                  />
                </div>

                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Question Text *</label>
                    <textarea
                      className="form-control bg-body-tertiary border text-body"
                      rows={3}
                      placeholder="e.g. What is the time complexity of Binary Search?"
                      value={mcqForm.questionText}
                      onChange={(e) => setMcqForm({ ...mcqForm, questionText: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Option A *</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="Option A string"
                        value={mcqForm.optionA}
                        onChange={(e) => setMcqForm({ ...mcqForm, optionA: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Option B *</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="Option B string"
                        value={mcqForm.optionB}
                        onChange={(e) => setMcqForm({ ...mcqForm, optionB: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Option C *</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="Option C string"
                        value={mcqForm.optionC}
                        onChange={(e) => setMcqForm({ ...mcqForm, optionC: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Option D *</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="Option D string"
                        value={mcqForm.optionD}
                        onChange={(e) => setMcqForm({ ...mcqForm, optionD: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted fw-semibold">Correct Answer *</label>
                      <select
                        className="form-select bg-body-tertiary border text-body fw-bold"
                        value={mcqForm.correctAnswer}
                        onChange={(e) => setMcqForm({ ...mcqForm, correctAnswer: e.target.value })}
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted fw-semibold">Difficulty</label>
                      <select
                        className="form-select bg-body-tertiary border text-body"
                        value={mcqForm.difficulty}
                        onChange={(e) => setMcqForm({ ...mcqForm, difficulty: e.target.value })}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted fw-semibold">Marks</label>
                      <input
                        type="number"
                        className="form-control bg-body-tertiary border text-body"
                        value={mcqForm.marks}
                        onChange={(e) => setMcqForm({ ...mcqForm, marks: e.target.value })}
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small text-muted fw-semibold">Negative Marks</label>
                      <input
                        type="number"
                        step="0.25"
                        className="form-control bg-body-tertiary border text-body"
                        value={mcqForm.negativeMarks}
                        onChange={(e) => setMcqForm({ ...mcqForm, negativeMarks: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Category</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="e.g. Data Structures"
                        value={mcqForm.category}
                        onChange={(e) => setMcqForm({ ...mcqForm, category: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-semibold">Topic</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        placeholder="e.g. Algorithms"
                        value={mcqForm.topic}
                        onChange={(e) => setMcqForm({ ...mcqForm, topic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small text-muted fw-semibold">Explanation (Optional)</label>
                    <textarea
                      className="form-control bg-body-tertiary border text-body"
                      rows={2}
                      placeholder="Brief notes explaining why the correct option is right..."
                      value={mcqForm.explanation}
                      onChange={(e) => setMcqForm({ ...mcqForm, explanation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMcqModal(false);
                      resetMcqForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning btn-sm fw-bold px-4 text-dark" disabled={saving}>
                    {saving ? 'Saving...' : editingMcqId ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CODING MODAL */}
      {showCodingModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content card text-body border ">
              <form onSubmit={handleSaveCoding}>
                <div className="modal-header border">
                  <div>
                    <h5 className="modal-title fw-bold">
                      {editingCodingId ? 'Edit Coding Problem' : 'Add Coding Problem'}
                    </h5>
                    <small className="text-muted">Configure problem specifications, starter code and test cases</small>
                  </div>
                  <button
                    type="button"
                    className="btn-close" aria-label="Close dialog"
                    onClick={() => {
                      setShowCodingModal(false);
                      resetCodingForm();
                    }}
                  />
                </div>

                <div className="modal-body p-4">
                  <h6 className="text-info fw-bold mb-3">Problem Information</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-md-8">
                      <label className="form-label small text-muted">Title *</label>
                      <input
                        type="text"
                        className="form-control bg-body-tertiary border text-body"
                        value={codingForm.title}
                        onChange={(e) => setCodingForm({ ...codingForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small text-muted">Difficulty</label>
                      <select
                        className="form-select bg-body-tertiary border text-body"
                        value={codingForm.difficulty}
                        onChange={(e) => setCodingForm({ ...codingForm, difficulty: e.target.value })}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small text-muted">Description *</label>
                      <textarea
                        className="form-control bg-body-tertiary border text-body"
                        rows="4"
                        value={codingForm.description}
                        onChange={(e) => setCodingForm({ ...codingForm, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted">Input Format</label>
                      <textarea
                        className="form-control bg-body-tertiary border text-body"
                        rows="2"
                        value={codingForm.inputFormat}
                        onChange={(e) => setCodingForm({ ...codingForm, inputFormat: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-muted">Output Format</label>
                      <textarea
                        className="form-control bg-body-tertiary border text-body"
                        rows="2"
                        value={codingForm.outputFormat}
                        onChange={(e) => setCodingForm({ ...codingForm, outputFormat: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowCodingModal(false);
                      resetCodingForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-info btn-sm fw-bold text-dark px-4" disabled={saving}>
                    {saving ? 'Saving...' : editingCodingId ? 'Update Problem' : 'Save Coding Problem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      <AIQuestionGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onSuccess={() => fetchBankData()}
      />

      {/* JSON BULK IMPORT MODAL */}
      <JsonImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => fetchBankData()}
      />
    </div>
  );
};

export default QuestionBank;
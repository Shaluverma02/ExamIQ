import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

const AIQuestionGeneratorModal = ({ isOpen, onClose, onSuccess }) => {
  const [topic, setTopic] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('easy');
  const [type, setType] = useState('mcq');
  const [count, setCount] = useState(3);
  const [autoSave, setAutoSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.warning('Please enter a topic name for AI generation');
      return;
    }

    setLoading(true);
    setGeneratedItems([]);
    try {
      const response = await aiAPI.generateQuestions({
        topic,
        category,
        difficulty,
        type,
        count: Number(count),
        autoSave,
      });

      if (response.data.success) {
        setGeneratedItems(response.data.items || []);
        toast.success(`✨ Generated ${response.data.count} items using AI!`);
        if (autoSave && onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions using AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(11, 17, 32, 0.75)', zIndex: 2050, backdropFilter: 'blur(6px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border shadow-lg">
          {/* Header */}
          <div className="modal-header px-4 py-3 d-flex align-items-center justify-content-between">
            <h5 className="modal-title d-flex align-items-center gap-2 text-primary fw-bold">
              <Sparkles className="text-warning animate-pulse" size={24} />
              <span>AI Question & Challenge Generator</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <form onSubmit={handleGenerate} className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Topic / Subject</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. React Hooks, Binary Search Trees, SQL Queries"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science, Web Development"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-secondary small fw-bold">Optionally Paste Course Notes / Syllabus Text:</label>
                <textarea
                  rows={3}
                  className="form-control text-body bg-body-tertiary border"
                  placeholder="Paste lecture notes, syllabus text, or topic summary here to auto-extract questions..."
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label text-secondary small fw-bold">Question Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={loading}
                >
                  <option value="mcq">Objective MCQs</option>
                  <option value="coding">Sandboxed Coding Problems</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label text-secondary small fw-bold">Difficulty</label>
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label text-secondary small fw-bold">Number of Items</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="col-12 mt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoSaveSwitch"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label small ms-2 text-secondary" htmlFor="autoSaveSwitch">
                    Automatically save generated items directly to database question bank
                  </label>
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2 fw-bold" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spinner-border spinner-border-sm" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Questions</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* AI Generated Preview List */}
            {generatedItems.length > 0 && (
              <div className="mt-4 pt-4 border-top">
                <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                  <CheckCircle className="text-success" size={18} />
                  <span>Generated Preview ({generatedItems.length} items)</span>
                </h6>
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {generatedItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded border bg-secondary">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-primary text-uppercase">{item.questionType || type}</span>
                        <span className="badge bg-info text-capitalize">{item.difficulty}</span>
                      </div>
                      <p className="fw-semibold mb-2 text-body">{item.questionText || item.title}</p>
                      {item.options && (
                        <ul className="list-unstyled mb-0 ms-2 small">
                          {item.options.map((opt, oIdx) => (
                            <li key={oIdx} className={opt.isCorrect ? 'text-success fw-bold' : 'text-secondary'}>
                              {opt.isCorrect ? '✓ ' : '• '} {opt.optionText}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.testCases && (
                        <p className="small text-muted mb-0 mt-2">
                          ⚡ Includes {item.testCases.length} Sandboxed Test Cases & Starter Code
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuestionGeneratorModal;
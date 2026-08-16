import React, { useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { Sparkles, Bot, CheckCircle2, Code2, Plus, Save, Layers, HelpCircle, FileCode } from 'lucide-react';

const AiQuestionGenerator = () => {
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [type, setType] = useState('mcq'); // 'mcq' or 'coding'
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [generatedItems, setGeneratedItems] = useState([]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await API.post('/ai/generate-questions', {
        topic,
        type,
        difficulty,
        count,
      });

      setGeneratedItems(res.data.items || []);
      toast.success(`🎉 Generated ${res.data.count} AI ${type.toUpperCase()}s on "${topic}"!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (generatedItems.length === 0) return;
    try {
      setSaving(true);
      const payload = {
        questions: type === 'mcq' ? generatedItems : [],
        codingProblems: type === 'coding' ? generatedItems : [],
      };

      const res = await API.post('/ai/save-generated-questions', payload);
      toast.success(`✅ ${res.data.message}`);
      setGeneratedItems([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save generated items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <Sparkles className="text-warning animate-pulse" size={26} /> AI Question & Test Case Generator
          </h3>
          <p className="text-secondary small m-0">Generate MCQs and Sandboxed Coding Problems with automated hidden test cases via AI.</p>
        </div>
      </div>

      {/* Generator Control Card */}
      <div className="glass-card p-4 rounded-4 border border-secondary mb-4 shadow-lg">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label text-light fw-semibold small">Topic / Keyword</label>
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary"
              placeholder="e.g. Python Loops, React Hooks, Binary Trees"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-light fw-semibold small">Question Type</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mcq">Objective MCQ</option>
              <option value="coding">Coding Problem</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-light fw-semibold small">Difficulty</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-light fw-semibold small">Count</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-control bg-dark text-light border-secondary"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <button
              type="button"
              className="btn btn-primary w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm" /> Generating...
                </>
              ) : (
                <>
                  <Bot size={18} /> Generate AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Items Preview List */}
      {generatedItems.length > 0 && (
        <div className="glass-card p-4 rounded-4 border border-info mb-4 shadow-lg">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-info m-0 d-flex align-items-center gap-2">
              <CheckCircle2 size={20} /> Generated {type.toUpperCase()}s ({generatedItems.length})
            </h5>
            <button
              type="button"
              className="btn btn-success btn-sm px-4 fw-bold rounded-pill shadow-sm d-flex align-items-center gap-2"
              onClick={handleSaveToDatabase}
              disabled={saving}
            >
              {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={16} />} Save All to Question Bank
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {generatedItems.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-dark border border-secondary rounded-3">
                {type === 'mcq' ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary">Question #{idx + 1}</span>
                      <span className="badge bg-secondary">{item.marks} Marks</span>
                    </div>
                    <h6 className="fw-bold text-light mb-3">{item.questionText}</h6>
                    <div className="row g-2 mb-2">
                      {item.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="col-12 col-md-6">
                          <div className={`p-2.5 rounded border extra-small ${opt.isCorrect ? 'border-success bg-success bg-opacity-20 text-success fw-bold' : 'border-secondary bg-black bg-opacity-40 text-light'}`}>
                            {opt.isCorrect ? '✓ ' : ''}{opt.optionText}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="extra-small text-muted italic">Explanation: {item.explanation}</div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-info text-dark font-monospace fw-bold">{item.title}</span>
                      <span className="badge bg-primary">{item.marks} Marks</span>
                    </div>
                    <p className="small text-secondary mb-2">{item.description}</p>
                    <div className="p-2 bg-black rounded border border-secondary extra-small font-monospace text-success">
                      Sample Input: {item.examples?.[0]?.input} | Sample Output: {item.examples?.[0]?.output}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiQuestionGenerator;

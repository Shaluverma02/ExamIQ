import '../../styles/faculty.css';
﻿import React, { useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { Sparkles, Bot, CheckCircle2, Code2, Plus, Save, Layers, HelpCircle, FileCode } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';

const AiQuestionGenerator = () => {
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [type, setType] = useState('mcq'); // 'mcq' or 'coding'
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [generatedItems, setGeneratedItems] = useState([]);

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.warning('Enter a topic before generating questions');
    if (Number(count) < 1 || Number(count) > 10) return toast.warning('Choose between 1 and 10 questions');
    try {
      setGenerating(true);
      const res = await API.post('/ai/generate-questions', {
        topic,
        type,
        difficulty,
        count,
      });

      setGeneratedItems(res.data.items || []);
      toast.success(`ðŸŽ‰ Generated ${res.data.count} AI ${type.toUpperCase()}s on "${topic}"!`);
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
      toast.success(`âœ… ${res.data.message}`);
      setGeneratedItems([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save generated items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-page faculty-workspace">
      <PageHeader eyebrow="Question creation" title="AI question studio" icon={Sparkles}
        description="Turn a topic into a starting point for your next assessment. Generate, review, and add questions to your bank." />

      {/* Generator Control Card */}
      <div className="card p-4">
        <div className="faculty-section-heading"><span className="faculty-step">01</span><div><h3>Define your questions</h3><p>Give the generator a specific topic and choose the level of challenge.</p></div></div>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label text-body fw-semibold small">Topic / Keyword</label>
            <input
              type="text"
              className="form-control bg-body-tertiary text-body border"
              placeholder="e.g. Python Loops, React Hooks, Binary Trees"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-body fw-semibold small">Question Type</label>
            <select
              className="form-select bg-body-tertiary text-body border"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mcq">Objective MCQ</option>
              <option value="coding">Coding Problem</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-body fw-semibold small">Difficulty</label>
            <select
              className="form-select bg-body-tertiary text-body border"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label text-body fw-semibold small">Count</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-control bg-body-tertiary text-body border"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <button
              type="button"
              className="btn btn-primary w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm" /> Generating...
                </>
              ) : (
                <>
                  <Bot size={18} /> Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4"><div className="faculty-guide h-100"><Layers size={20} /><div><h3>Start with a topic</h3><p>Be specific about the concept or skill you want students to demonstrate.</p></div></div></div>
        <div className="col-md-4"><div className="faculty-guide h-100"><CheckCircle2 size={20} /><div><h3>Review each question</h3><p>Check the wording, correct answers, explanations, and coding examples.</p></div></div></div>
        <div className="col-md-4"><div className="faculty-guide h-100"><Save size={20} /><div><h3>Add to your bank</h3><p>Save the reviewed set, then include it in any assessment you create.</p></div></div></div>
      </div>

      {generatedItems.length === 0 && <EmptyState icon={Bot} title={generating ? 'Creating your questions' : 'Your questions will appear here'} description={generating ? 'The generator is preparing your question set. This may take a moment.' : 'Choose a topic above to generate your first question set.'} />}

      {/* Generated Items Preview List */}
      {generatedItems.length > 0 && (
        <div className="card p-4">
          <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
            <h5 className="fw-bold text-info m-0 d-flex align-items-center gap-2">
              <CheckCircle2 size={20} /> Review {generatedItems.length} generated questions
            </h5>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveToDatabase}
              disabled={saving}
            >
              {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={16} />} Save All to Question Bank
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {generatedItems.map((item, idx) => (
              <div key={idx} className="faculty-question-preview">
                {type === 'mcq' ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary">Question #{idx + 1}</span>
                      <span className="badge bg-secondary">{item.marks} Marks</span>
                    </div>
                    <h6 className="fw-bold text-body mb-3">{item.questionText}</h6>
                    <div className="row g-2 mb-2">
                      {item.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="col-12 col-md-6">
                          <div className={`faculty-answer ${opt.isCorrect ? 'is-correct' : ''}`}>
                            {opt.isCorrect ? 'âœ“ ' : ''}{opt.optionText}
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
                    <div className="p-2 bg-body-tertiary rounded border extra-small font-monospace text-success">
                      Public Example Input: {item.examples?.[0]?.input} | Public Example Output: {item.examples?.[0]?.output}
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


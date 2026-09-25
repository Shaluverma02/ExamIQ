import '../../styles/student.css';
import PageHeader from '../../components/common/PageHeader';
﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronRight, Loader2, Mic, RefreshCw, Send, Sparkles, Volume2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import Button from '../../components/common/Button';

const AIInterviewPrep = () => {
  const recognitionRef = useRef(null);
  const [topics, setTopics] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) || topics[0],
    [topics, selectedTopicId]
  );

  const activeQuestion = selectedTopic?.questions?.[currentQIndex];

  useEffect(() => {
    fetchTopics();

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/ai/interview/topics');
      const loadedTopics = res.data?.topics || [];
      setTopics(loadedTopics);
      setRecentAttempts(res.data?.recentAttempts || []);
      setSelectedTopicId(loadedTopics[0]?.id || '');
      setCurrentQIndex(0);
      setFeedback(null);
      setAnswer('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load interview topics');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (topicId) => {
    setSelectedTopicId(topicId);
    setCurrentQIndex(0);
    setAnswer('');
    setFeedback(null);
  };

  const handleSpeakQuestion = () => {
    if (!activeQuestion?.text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeQuestion.text);
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceAnswer = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ');
      setAnswer(transcript.trim());
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice capture stopped. Please try again.');
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleEvaluateAnswer = async () => {
    if (!activeQuestion || !answer.trim()) {
      toast.warning('Write or record an answer before evaluation');
      return;
    }

    try {
      setEvaluating(true);
      const res = await API.post('/ai/interview/evaluate', {
        categoryId: selectedTopic.id,
        categoryTitle: selectedTopic.title,
        question: activeQuestion.text,
        answer,
        sourceType: activeQuestion.sourceType,
        sourceId: activeQuestion.sourceId,
        inputMode: isListening ? 'voice' : 'text',
      });
      setFeedback(res.data?.feedback || null);
      toast.success('Interview answer evaluated');
      fetchTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to evaluate answer');
    } finally {
      setEvaluating(false);
    }
  };

  const goToQuestion = (offset) => {
    if (!selectedTopic?.questions?.length) return;
    const nextIndex = Math.max(0, Math.min(selectedTopic.questions.length - 1, currentQIndex + offset));
    setCurrentQIndex(nextIndex);
    setAnswer('');
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="card p-5 text-center">
        <Loader2 className="text-primary mx-auto mb-3 spin" size={34} />
        <h5 className="fw-bold">Loading interview practice...</h5>
        <p className="text-secondary mb-0">Preparing questions from your current question bank.</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="card p-5 text-center">
        <Bot className="text-primary mx-auto mb-3" size={42} />
        <h4 className="fw-bold">No interview content available</h4>
        <p className="text-secondary mb-4">
          Interview topics will appear when your faculty makes practice content available.
        </p>
        <Button variant="primary" onClick={fetchTopics} icon={RefreshCw}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="student-page">
      <PageHeader eyebrow="Career readiness" title="Interview practice" description="Build a clear, confident answer. Practice a topic, record your response, and review your feedback." actions={<Button variant="outline-secondary" onClick={fetchTopics} icon={RefreshCw}>Refresh topics</Button>} />
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card p-3 h-100">
            <div className="section-label mb-3">Topics</div>
            <div className="d-flex flex-column gap-2 student-topic-list">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={selectedTopic?.id === topic.id}
                  className={`btn text-start border rounded-3 p-3 ${selectedTopic?.id === topic.id ? 'btn-primary text-white' : 'btn-light'}`}
                  onClick={() => handleTopicChange(topic.id)}
                >
                  <div className="fw-bold">{topic.title}</div>
                  <div className={`small ${selectedTopic?.id === topic.id ? 'text-white-50' : 'text-secondary'}`}>
                    {topic.count} prompt{topic.count === 1 ? '' : 's'} from platform content
                  </div>
                </button>
              ))}
            </div>

            {recentAttempts.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <div className="section-label mb-2">Recent attempts</div>
                <div className="d-flex flex-column gap-2">
                  {recentAttempts.slice(0, 4).map((attempt) => (
                    <div key={attempt._id} className="surface-muted border rounded-3 p-2 small">
                      <div className="fw-semibold text-truncate">{attempt.categoryTitle || 'Interview practice'}</div>
                      <div className="text-secondary">Score: {attempt.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center gap-3 border-bottom pb-3 mb-3">
              <div>
                <div className="section-label">Question {currentQIndex + 1} of {selectedTopic.questions.length}</div>
                <h5 className="fw-bold mb-0">{selectedTopic.title}</h5>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={handleSpeakQuestion} icon={Volume2}>Read aloud</Button>
            </div>

            <div className="student-prompt border rounded-3 mb-4">
              <p className="fw-semibold mb-0">{activeQuestion?.text}</p>
            </div>

            <div className="mb-3">
              <label htmlFor="interview-answer" className="ui-label mb-2">Your answer</label>
              <textarea
                id="interview-answer"
                className="form-control"
                rows={8}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain your answer with reasoning, examples, edge cases, and complexity where relevant."
              />
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <Button variant={isListening ? 'danger' : 'outline-primary'} onClick={handleVoiceAnswer} icon={Mic}>
                {isListening ? 'Stop recording' : 'Record answer'}
              </Button>
              <Button variant="primary" onClick={handleEvaluateAnswer} loading={evaluating} icon={Send}>
                Evaluate answer
              </Button>
            </div>

            {feedback && (
              <div className="student-feedback p-4 mb-4" aria-live="polite">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2"><Sparkles size={18} className="text-warning" /> Evaluation</h5>
                  <span className="badge bg-primary fs-6">{feedback.score}%</span>
                </div>

                <div className="row g-2 mb-3">
                  {[
                    ['Clarity', feedback.clarity],
                    ['Relevance', feedback.relevance],
                    ['Structure', feedback.structure],
                    ['Specificity', feedback.specificity],
                  ].map(([label, value]) => (
                    <div className="col-6 col-md-3" key={label}>
                      <div className="surface-muted border rounded-3 p-2 text-center">
                        <div className="small text-secondary">{label}</div>
                        <div className="fw-bold text-primary">{value}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="fw-semibold mb-2">Strengths</div>
                    <ul className="small text-secondary mb-0">
                      {feedback.strengths?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <div className="fw-semibold mb-2">Improve next</div>
                    <ul className="small text-secondary mb-0">
                      {feedback.improvementTips?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>

                {feedback.keyTerms?.length > 0 && (
                  <div className="mt-3 pt-3 border-top small">
                    <span className="text-secondary me-2">Matched prompt terms:</span>
                    {feedback.keyTerms.map((term) => <span key={term} className="badge bg-light text-dark border me-1">{term}</span>)}
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center border-top pt-3">
              <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => goToQuestion(-1)} disabled={currentQIndex === 0}>
                Previous Question
              </button>
              <span className="text-secondary small font-monospace">{currentQIndex + 1} / {selectedTopic.questions.length}</span>
              <button className="btn btn-info btn-sm rounded-pill px-3" onClick={() => goToQuestion(1)} disabled={currentQIndex === selectedTopic.questions.length - 1}>
                Next Question <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewPrep;

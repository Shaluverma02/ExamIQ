import '../../styles/student.css';
import PageHeader from '../../components/common/PageHeader';
﻿import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Headphones, Loader2, Mic, Play, RefreshCw, Send, Sparkles, Volume2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import Button from '../../components/common/Button';

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  speaking: Mic,
  writing: Volume2,
};

const VersantAssessment = () => {
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [response, setResponse] = useState('');
  const [sectionResult, setSectionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0],
    [sections, activeSectionId]
  );

  useEffect(() => {
    fetchAssessment();
    return () => window.speechSynthesis?.cancel?.();
  }, []);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const res = await API.get('/ai/versant/assessment');
      const loadedSections = res.data?.sections || [];
      setSections(loadedSections);
      setActiveSectionId(loadedSections[0]?.id || '');
      setResponse('');
      setSectionResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load communication assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (sectionId) => {
    setActiveSectionId(sectionId);
    setResponse('');
    setSectionResult(null);
    window.speechSynthesis?.cancel?.();
    setIsPlayingAudio(false);
  };

  const handlePlayAudio = () => {
    if (!activeSection?.prompt || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeSection.prompt);
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitSection = async () => {
    if (!activeSection || !response.trim()) {
      toast.warning('Write your response before submitting this section');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/ai/versant/submit', {
        sectionId: activeSection.id,
        sectionLabel: activeSection.label,
        prompt: activeSection.prompt,
        response,
      });
      setSectionResult(res.data);
      toast.success('Section evaluated and saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit section');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-5 text-center">
        <Loader2 className="text-primary mx-auto mb-3" size={34} />
        <h5 className="fw-bold">Loading communication assessment...</h5>
        <p className="text-secondary mb-0">Preparing sections from current platform content.</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="card p-5 text-center">
        <Sparkles className="text-primary mx-auto mb-3" size={42} />
        <h4 className="fw-bold">No communication prompts available</h4>
        <p className="text-secondary mb-4">
          Communication prompts will appear when your faculty makes practice content available.
        </p>
        <Button variant="primary" onClick={fetchAssessment} icon={RefreshCw}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="student-page">
      <PageHeader eyebrow="Communication skills" title="Speak, listen, and grow" description="Choose a skill, work through the prompt, and get feedback on your communication." actions={<Button variant="outline-secondary" onClick={fetchAssessment} icon={RefreshCw}>Refresh prompts</Button>} />
      <div className="row g-3 mb-4 student-section-tabs">
        {sections.map((section) => {
          const Icon = sectionIcons[section.id] || BookOpen;
          const isActive = activeSection?.id === section.id;
          return (
            <div key={section.id} className="col-12 col-md-6 col-lg-3">
              <button
                type="button"
                className={`card p-3 border w-100 h-100 text-start ${isActive ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                aria-pressed={isActive}
                onClick={() => handleSelectSection(section.id)}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Icon size={20} className={isActive ? 'text-primary' : 'text-secondary'} />
                  <h6 className="fw-bold text-body m-0 small">{section.label}</h6>
                </div>
                <p className="text-secondary small m-0" style={{ fontSize: '0.75rem' }}>
                  {section.skill} practice from {section.sourceType === 'coding' ? 'coding library' : 'question bank'}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      <div className="card p-4 border">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
          <h5 className="fw-bold text-body m-0">{activeSection.label}</h5>
          <span className="badge bg-primary">Duration: {activeSection.duration || 15} mins</span>
        </div>

        <div className="student-prompt rounded-3 border mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h6 className="fw-bold text-body mb-2">Prompt</h6>
              <p className="text-secondary small mb-0">{activeSection.prompt}</p>
            </div>
            <Button
              variant={isPlayingAudio ? 'warning' : 'primary'}
              size="sm"
              onClick={handlePlayAudio}
              icon={isPlayingAudio ? Volume2 : Play}
            >
              {isPlayingAudio ? 'Playing' : 'Listen'}
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="communication-response" className="ui-label mb-2">Your response <span className="text-muted">(required)</span></label>
          <textarea
            id="communication-response"
            required
            className="form-control bg-body-tertiary text-body border"
            rows={6}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here. Use complete sentences and refer to the prompt clearly."
          />
        </div>

        <div className="d-flex justify-content-end mb-4">
          <Button variant="success" size="md" onClick={handleSubmitSection} loading={submitting} icon={Send}>
            Submit section
          </Button>
        </div>

        {sectionResult && (
          <div className="student-feedback p-4 text-center" aria-live="polite">
            <CheckCircle2 size={42} className="text-success mb-2" />
            <h4 className="fw-bold text-body mb-1">Section evaluated</h4>
            <p className="text-secondary small mb-4">Your response has been scored and stored in your assessment history.</p>

            <div className="row g-3" style={{ maxWidth: 720, margin: '0 auto' }}>
              {Object.entries(sectionResult.scores || {}).map(([label, value]) => (
                <div className="col-6 col-md-3" key={label}>
                  <div className="p-3 bg-body rounded border">
                    <div className="text-secondary small text-capitalize">{label}</div>
                    <div className="fw-bold text-primary fs-5">{value}%</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <span className="badge bg-success fs-6">Overall: {sectionResult.overallScore}%</span>
            </div>

            {sectionResult.feedback?.length > 0 && (
              <ul className="small text-secondary text-start mt-3 mb-0 mx-auto" style={{ maxWidth: 620 }}>
                {sectionResult.feedback.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersantAssessment;

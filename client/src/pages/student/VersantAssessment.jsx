import React, { useState } from 'react';
import { Sparkles, Headphones, Mic, BookOpen, Volume2, CheckCircle2, Play } from 'lucide-react';
import Button from '../../components/common/Button';

const VERSANT_SECTIONS = [
  { id: 'listening', label: 'Part A: Listening Comprehension', icon: Headphones, desc: 'Listen to short audio clips and answer comprehension questions.' },
  { id: 'reading', label: 'Part B: Reading & Passage Aloud', icon: BookOpen, desc: 'Read passages aloud into the microphone to test pronunciation and fluency.' },
  { id: 'speaking', label: 'Part C: Sentence Repeat & Speaking', icon: Mic, desc: 'Repeat spoken sentences accurately and answer prompt questions.' },
  { id: 'writing', label: 'Part D: Dictation & Writing', icon: Volume2, desc: 'Type out dictation passages accurately under time constraints.' },
];

const VersantAssessment = () => {
  const [activeSection, setActiveSection] = useState(VERSANT_SECTIONS[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  const handleSubmitSection = () => {
    setIsTestSubmitted(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-20 text-primary rounded-3">
              <Sparkles size={26} />
            </div>
            Versant LSRW Skill Assessment
          </h3>
          <p className="text-muted small m-0 mt-1">Listening, Speaking, Reading & Writing Communication Skill Evaluation</p>
        </div>
      </div>

      {/* Versant Sections Navigation Tabs */}
      <div className="row g-3 mb-4">
        {VERSANT_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection.id === sec.id;
          return (
            <div key={sec.id} className="col-12 col-md-6 col-lg-3">
              <div
                className={`glass-card p-3 border cursor-pointer ${
                  isActive ? 'border-primary bg-primary bg-opacity-15' : 'border-secondary'
                }`}
                onClick={() => {
                  setActiveSection(sec);
                  setIsTestSubmitted(false);
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Icon size={20} className={isActive ? 'text-primary' : 'text-muted'} />
                  <h6 className="fw-bold text-light m-0 small">{sec.label}</h6>
                </div>
                <p className="text-muted small m-0" style={{ fontSize: '0.75rem' }}>
                  {sec.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Versant Test Suite Container */}
      <div className="glass-card p-4 border border-secondary">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3">
          <h5 className="fw-bold text-light m-0">{activeSection.label}</h5>
          <span className="badge bg-primary">Duration: 15 Mins</span>
        </div>

        {!isTestSubmitted ? (
          <div>
            {/* Audio Prompt Player */}
            <div className="p-4 rounded-4 bg-dark border border-secondary mb-4 text-center">
              <h6 className="fw-bold text-light mb-2">Prompt 1: Audio Passage Demonstration</h6>
              <p className="text-muted small mb-3">Click below to listen to the audio stream prompt.</p>

              <Button
                variant={isPlayingAudio ? 'warning' : 'primary'}
                size="md"
                onClick={handlePlayAudio}
                icon={isPlayingAudio ? Volume2 : Play}
              >
                {isPlayingAudio ? '🔊 Playing Audio Clip...' : '▶ Listen to Audio Prompt'}
              </Button>
            </div>

            {/* Candidate Response Area */}
            <div className="mb-4">
              <label className="ui-label mb-2">Your Passage Transcription / Response *</label>
              <textarea
                className="form-control bg-dark text-light border-secondary"
                rows={5}
                placeholder="Listen to the prompt above and type your response or transcription here..."
              />
            </div>

            <div className="d-flex justify-content-end">
              <Button variant="success" size="md" onClick={handleSubmitSection}>
                Submit Versant Section
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-4 bg-black border border-success text-center animate-fade-in">
            <CheckCircle2 size={42} className="text-success mb-2" />
            <h4 className="fw-extrabold text-light mb-1">Versant Section Submitted!</h4>
            <p className="text-muted small mb-4">Your LSRW audio and text responses have been logged for faculty review.</p>

            <div className="row g-3" style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className="col-6 col-md-3">
                <div className="p-3 bg-dark rounded border border-secondary">
                  <div className="text-muted small">Fluency</div>
                  <div className="fw-bold text-success fs-5">90%</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3 bg-dark rounded border border-secondary">
                  <div className="text-muted small">Accuracy</div>
                  <div className="fw-bold text-info fs-5">94%</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3 bg-dark rounded border border-secondary">
                  <div className="text-muted small">Grammar</div>
                  <div className="fw-bold text-warning fs-5">88%</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-3 bg-dark rounded border border-secondary">
                  <div className="text-muted small">Vocabulary</div>
                  <div className="fw-bold text-primary fs-5">92%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersantAssessment;

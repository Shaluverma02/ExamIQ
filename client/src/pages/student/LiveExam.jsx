import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import AntiCheatModal from '../../components/AntiCheatModal';
import CodeEditor from '../../components/CodeEditor';
import WebcamProctor from '../../components/WebcamProctor';
import AudioProctor from '../../components/AudioProctor';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileCode,
  HelpCircle,
  Maximize2,
  Bookmark,
  Copy,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Code2,
  Camera,
  AlertOctagon,
  Check,
  FileText,
  AlertTriangle,
  Play,
  XCircle,
} from 'lucide-react';

const LiveExam = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);

  // Pre-Exam Instruction & Camera Verification State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle', 'granted', 'denied', 'checking'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' or 'coding'
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [currentCodingIdx, setCurrentCodingIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [copiedInputIdx, setCopiedInputIdx] = useState(null);

  // Submission Confirm Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // Fullscreen enforcement state
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    fetchExamMetadata();

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      stopCameraStream();
    };
  }, [examId]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const verifyCameraAccess = async () => {
    setCameraStatus('checking');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('denied');
        toast.error('Webcam access is not supported by your browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('granted');
      toast.success('Webcam verified and active!');
    } catch (err) {
      console.error('Camera verification failed:', err);
      setCameraStatus('denied');
      toast.error('Camera permission denied! Webcam is mandatory for proctored exams.');
    }
  };

  const fetchExamMetadata = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/exams/${examId}`);
      setExam(res.data.exam);

      // Pre-fetch active attempt metadata if available (without bypassing instructions screen)
      try {
        const attemptRes = await API.post(`/exams/${examId}/start`);
        if (attemptRes.data.attempt) {
          setAttempt(attemptRes.data.attempt);
          initExamWorkspace(res.data.exam, attemptRes.data.attempt);
        }
      } catch (e) {
        // First time starting attempt
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load exam information');
      navigate('/student/assigned-exams');
    } finally {
      setLoading(false);
    }
  };

  const initExamWorkspace = (examData, attemptData) => {
    if ((!examData.questions || examData.questions.length === 0) && examData.codingProblems && examData.codingProblems.length > 0) {
      setActiveTab('coding');
    } else {
      setActiveTab('mcq');
    }

    if (examData.questions && examData.questions.length > 0) {
      const firstQId = examData.questions[0]._id;
      const savedAns = attemptData.answers?.find(
        (a) => a.questionId.toString() === firstQId.toString()
      );
      setSelectedOptions(savedAns ? savedAns.selectedOptions || [] : []);
    }
  };

  const requestFullScreen = () => {
    try {
      const elem = document.documentElement;
      if (elem && elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const handleStartExamClick = async () => {
    if (cameraStatus !== 'granted') {
      toast.error('Camera verification is required before starting the exam.');
      return;
    }
    if (!agreedToTerms) {
      toast.warning('Please agree to the exam terms & anti-cheat guidelines.');
      return;
    }

    try {
      setLoading(true);
      requestFullScreen();

      const res = await API.post(`/exams/${examId}/start`);
      setExam(res.data.exam);
      setAttempt(res.data.attempt);
      setIsExamStarted(true);
      initExamWorkspace(res.data.exam, res.data.attempt);
      toast.success('Exam started! Good luck!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start exam attempt';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (optionText) => {
    if (!exam || !exam.questions[currentMcqIdx]) return;
    const currentQ = exam.questions[currentMcqIdx];
    let newSelection = [];

    if (currentQ.questionType === 'multiple') {
      newSelection = selectedOptions.includes(optionText)
        ? selectedOptions.filter((o) => o !== optionText)
        : [...selectedOptions, optionText];
    } else {
      newSelection = [optionText];
    }

    setSelectedOptions(newSelection);

    try {
      await API.post(`/exams/${examId}/answer`, {
        questionId: currentQ._id,
        selectedOptions: newSelection,
      });

      setAttempt((prev) => {
        const answers = [...(prev?.answers || [])];
        const idx = answers.findIndex((a) => a.questionId.toString() === currentQ._id.toString());
        if (idx > -1) {
          answers[idx].selectedOptions = newSelection;
          answers[idx].isVisited = true;
        } else {
          answers.push({ questionId: currentQ._id, selectedOptions: newSelection, isVisited: true });
        }
        return { ...prev, answers };
      });
    } catch (e) {
      console.error('Save answer error:', e);
    }
  };

  const handleNextQuestion = () => {
    if (currentMcqIdx < exam.questions.length - 1) {
      const nextIdx = currentMcqIdx + 1;
      setCurrentMcqIdx(nextIdx);
      const nextQId = exam.questions[nextIdx]._id;
      const savedAns = attempt?.answers?.find((a) => a.questionId.toString() === nextQId.toString());
      setSelectedOptions(savedAns ? savedAns.selectedOptions || [] : []);
    }
  };

  const handlePrevQuestion = () => {
    if (currentMcqIdx > 0) {
      const prevIdx = currentMcqIdx - 1;
      setCurrentMcqIdx(prevIdx);
      const prevQId = exam.questions[prevIdx]._id;
      const savedAns = attempt?.answers?.find((a) => a.questionId.toString() === prevQId.toString());
      setSelectedOptions(savedAns ? savedAns.selectedOptions || [] : []);
    }
  };

  const handleToggleReview = async () => {
    if (!exam || !exam.questions[currentMcqIdx]) return;
    const currentQ = exam.questions[currentMcqIdx];
    const savedAns = attempt?.answers?.find((a) => a.questionId.toString() === currentQ._id.toString());
    const newReviewState = !savedAns?.isMarkedForReview;

    try {
      await API.post(`/exams/${examId}/answer`, {
        questionId: currentQ._id,
        isMarkedForReview: newReviewState,
      });

      setAttempt((prev) => {
        const answers = [...(prev?.answers || [])];
        const idx = answers.findIndex((a) => a.questionId.toString() === currentQ._id.toString());
        if (idx > -1) answers[idx].isMarkedForReview = newReviewState;
        return { ...prev, answers };
      });
    } catch (e) {}
  };

  const handleCopyInput = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedInputIdx(idx);
    toast.info('Example input copied to clipboard');
    setTimeout(() => setCopiedInputIdx(null), 2000);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmittingExam(true);
      const res = await API.post(`/exams/${examId}/submit`);
      toast.success('Exam submitted successfully!');
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/student/results/${res.data.result._id}`);
    } catch (err) {
      toast.error('Failed to submit exam');
    } finally {
      setIsSubmittingExam(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-vh-100 bg-dark text-light d-flex flex-column align-items-center justify-content-center">
        <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} />
        <h5 className="fw-bold">Initializing Distraction-Free Proctored Workspace...</h5>
        <p className="text-secondary small">Checking credentials and loading exam data...</p>
      </div>
    );
  }

  // ============================================================
  // PRE-EXAM SCREEN: INSTRUCTIONS & CAMERA VERIFICATION CHECKLIST
  // ============================================================
  if (!isExamStarted) {
    const totalMCQs = exam.questions?.length || 0;
    const totalCoding = exam.codingProblems?.length || 0;

    return (
      <div className="min-vh-100 bg-dark text-light p-4 d-flex align-items-center justify-content-center" style={{ background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)' }}>
        <div className="glass-card p-4 p-md-5 border border-secondary rounded-4 shadow-lg w-100" style={{ maxWidth: 900 }}>
          {/* Header */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom border-secondary pb-3 mb-4">
            <div>
              <div className="badge bg-primary px-3 py-1 font-monospace mb-2">OFFICIAL ASSESSMENT</div>
              <h3 className="fw-extrabold text-light m-0">{exam.title}</h3>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap font-monospace">
              <span className="badge bg-secondary p-2.5 d-flex align-items-center gap-1.5">
                <Clock size={16} /> {exam.duration} Mins
              </span>
              <span className="badge bg-success p-2.5 d-flex align-items-center gap-1.5">
                <CheckCircle2 size={16} /> {exam.totalMarks} Total Marks
              </span>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Box: Exam Rules & Anti-Cheat Guidelines */}
            <div className="col-12 col-md-7">
              <h6 className="fw-bold text-info mb-3 font-monospace d-flex align-items-center gap-2">
                <FileText size={18} /> Important Pre-Exam Instructions
              </h6>

              <div className="bg-dark bg-opacity-80 border border-secondary rounded-3 p-3.5 mb-4 small text-light shadow-sm">
                <ul className="mb-0 ps-3 space-y-2 leading-relaxed">
                  <li className="mb-2.5">
                    <strong className="text-info">Sections Included:</strong> {totalMCQs} Objective MCQs & {totalCoding} Sandboxed Coding Problems.
                  </li>
                  <li className="mb-2.5">
                    <strong className="text-light">Fullscreen Enforcement:</strong> The exam must be taken in Fullscreen Mode. Exiting fullscreen will flag a violation.
                  </li>
                  <li className="mb-2.5 p-2 rounded bg-warning bg-opacity-10 border border-warning border-opacity-30 text-warning">
                    <strong>🚨 3-Warning Violation Policy:</strong> A maximum of <strong>3 security violations</strong> (tab-switching, alt-tabbing, focus loss, copy/paste) are permitted. Reaching <span className="text-danger fw-bold">3 violations triggers automatic exam submission</span> immediately!
                  </li>
                  <li className="mb-2.5">
                    <strong className="text-light">Webcam Monitoring:</strong> Live WebRTC video stream and random snapshot captures are active throughout the test.
                  </li>
                  <li>
                    <strong className="text-light">Auto-Save Progress:</strong> Objective answers and code editor progress are auto-saved in real-time.
                  </li>
                </ul>
              </div>

              {/* High-Contrast Interactive Agreement Check Card */}
              <div
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`p-3 rounded-3 border transition-all d-flex align-items-center gap-3 style-cursor-pointer mb-3 ${
                  agreedToTerms
                    ? 'border-success bg-success bg-opacity-15 text-light shadow-sm'
                    : 'border-warning bg-dark bg-opacity-90 text-light'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={`rounded-2 border p-1 d-flex align-items-center justify-content-center flex-shrink-0 transition-all ${
                    agreedToTerms
                      ? 'border-success bg-success text-white'
                      : 'border-warning bg-dark text-warning'
                  }`}
                  style={{ width: 24, height: 24 }}
                >
                  {agreedToTerms ? <Check size={16} strokeWidth={3} /> : <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#fbbf24' }} />}
                </div>
                <span className="small fw-bold leading-snug text-light select-none">
                  I declare that I have read all instructions, verified my camera feed, and agree to the 3-warning anti-cheat policy.
                </span>
              </div>
            </div>

            {/* Right Box: Webcam Verification Feed */}
            <div className="col-12 col-md-5 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold text-warning mb-3 font-monospace d-flex align-items-center gap-2">
                  <Camera size={18} /> Mandatory Webcam Verification
                </h6>

                {/* Video Stream Preview Box */}
                <div className="position-relative bg-black rounded-3 overflow-hidden border border-secondary mb-3 text-center d-flex align-items-center justify-content-center" style={{ height: 210 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />

                  {cameraStatus !== 'granted' && (
                    <div className="position-absolute p-3 text-center">
                      <Camera size={36} className="text-secondary mb-2 opacity-75" />
                      <p className="extra-small text-muted mb-0">Webcam Feed Inactive</p>
                    </div>
                  )}

                  {cameraStatus === 'granted' && (
                    <div className="position-absolute top-0 start-0 m-2 badge bg-success bg-opacity-90 d-flex align-items-center gap-1 font-monospace">
                      <Check size={14} /> Camera Active
                    </div>
                  )}
                </div>

                {/* Camera Status Notification */}
                {cameraStatus === 'idle' && (
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm w-100 fw-bold rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2"
                    onClick={verifyCameraAccess}
                  >
                    <Camera size={16} /> Enable & Verify Webcam
                  </button>
                )}

                {cameraStatus === 'checking' && (
                  <div className="text-center text-info small font-monospace mb-3">
                    <span className="spinner-border spinner-border-sm me-2" /> Requesting Camera Permission...
                  </div>
                )}

                {cameraStatus === 'granted' && (
                  <div className="p-2.5 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 text-success small font-monospace text-center mb-3 d-flex align-items-center justify-content-center gap-2">
                    <CheckCircle2 size={16} /> Webcam Successfully Verified & Active
                  </div>
                )}

                {cameraStatus === 'denied' && (
                  <div className="mb-3 text-center">
                    <div className="p-2.5 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 text-danger small font-monospace mb-2 d-flex align-items-center justify-content-center gap-2">
                      <XCircle size={16} /> Camera Permission Required!
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm w-100 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={verifyCameraAccess}
                    >
                      <Camera size={16} /> Re-Try Camera Access
                    </button>
                  </div>
                )}
              </div>

              {/* Start Assessment Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg w-100 fw-extrabold rounded-pill py-3 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                disabled={cameraStatus !== 'granted' || !agreedToTerms}
                onClick={handleStartExamClick}
              >
                <Play size={20} /> Begin Proctored Exam Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // LIVE EXAM WORKSPACE VIEW (AFTER STARTING EXAM)
  // ============================================================
  const hasQuestions = exam.questions && exam.questions.length > 0;
  const hasCoding = exam.codingProblems && exam.codingProblems.length > 0;

  const currentQ = hasQuestions ? exam.questions[currentMcqIdx] : null;
  const currentProblem = hasCoding ? exam.codingProblems[currentCodingIdx] : null;

  // Calculate pre-submit metrics
  const answeredCount = attempt?.answers?.filter((a) => a.selectedOptions?.length > 0).length || 0;
  const reviewCount = attempt?.answers?.filter((a) => a.isMarkedForReview).length || 0;
  const totalMcqs = hasQuestions ? exam.questions.length : 0;
  const totalCoding = hasCoding ? exam.codingProblems.length : 0;
  const unansweredCount = totalMcqs - answeredCount;

  return (
    <div className="exam-workspace min-vh-100 position-relative d-flex flex-column bg-dark text-light">
      <AntiCheatModal examId={examId} onMaxViolations={handleFinalSubmit} />
      <WebcamProctor />
      <AudioProctor />

      {/* Pre-Submission Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleFinalSubmit}
        title="Submit Exam?"
        description={`Objective Answered: ${answeredCount} / ${totalMcqs} | Coding Problems: ${totalCoding} | Marked for Review: ${reviewCount}. Are you sure you want to finalize your submission?`}
        confirmLabel="Finalize & Submit"
        cancelLabel="Continue Exam"
        variant="danger"
        loading={isSubmittingExam}
      />

      {/* Fullscreen Lockout Overlay */}
      {!isFullscreen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 text-light"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2100, backdropFilter: 'blur(10px)' }}
        >
          <div className="glass-card p-5 border border-danger text-center rounded-4 shadow-lg" style={{ maxWidth: 500 }}>
            <Shield size={48} className="text-warning mb-3" />
            <h4 className="fw-extrabold text-light mb-2">Fullscreen Mode Required</h4>
            <p className="small text-secondary mb-4">
              To ensure assessment integrity, this exam must be taken in Fullscreen Mode. Please click below to re-enter fullscreen.
            </p>
            <Button variant="danger" size="lg" onClick={requestFullScreen} icon={Maximize2}>
              Re-Enter Fullscreen Mode
            </Button>
          </div>
        </div>
      )}

      {/* Exam Top Header Bar */}
      <div className="px-4 py-2 bg-dark border-bottom border-secondary d-flex align-items-center justify-content-between shadow-sm sticky-top">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill font-monospace shadow-sm">
            {exam.title}
          </span>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill d-none d-md-inline-flex align-items-center gap-1.5 small">
            <Shield size={14} /> AI Anti-Cheat Active
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <Timer initialSeconds={attempt?.remainingTime || exam.duration * 60} onTimeUp={handleFinalSubmit} />
          <Button variant="danger" size="sm" onClick={() => setShowConfirmDialog(true)} disabled={isSubmittingExam} className="fw-bold px-3">
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <div className="flex-grow-1 p-3 d-flex flex-column flex-lg-row gap-3 overflow-hidden" style={{ height: 'calc(100vh - 60px)', minHeight: '650px' }}>
        {/* Left / Center Section Panel */}
        <div className="flex-grow-1 d-flex flex-column glass-card p-3 rounded-4 border border-secondary shadow-lg overflow-hidden h-100">
          {/* Section Switcher Tabs */}
          <div className="nav nav-pills gap-2 border-bottom border-secondary pb-3 mb-3 flex-shrink-0">
            {hasQuestions && (
              <button
                className={`nav-link d-flex align-items-center gap-2 fw-bold px-4 py-2 rounded-pill transition-all ${
                  activeTab === 'mcq' ? 'active bg-primary shadow-sm' : 'text-light bg-dark border border-secondary'
                }`}
                onClick={() => setActiveTab('mcq')}
              >
                <HelpCircle size={16} /> Objective MCQs ({exam.questions.length})
              </button>
            )}
            {hasCoding && (
              <button
                className={`nav-link d-flex align-items-center gap-2 fw-bold px-4 py-2 rounded-pill transition-all ${
                  activeTab === 'coding' ? 'active bg-primary shadow-sm' : 'text-light bg-dark border border-secondary'
                }`}
                onClick={() => setActiveTab('coding')}
              >
                <FileCode size={16} /> Coding Arena ({exam.codingProblems.length})
              </button>
            )}
          </div>

          {/* ============================================================ */}
          {/* TAB 1: MCQ QUESTION VIEW */}
          {/* ============================================================ */}
          {activeTab === 'mcq' && currentQ && (
            <div className="d-flex flex-column flex-grow-1 justify-content-between overflow-auto pe-1 custom-ide-scrollbar">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-muted small font-monospace">
                    Question {currentMcqIdx + 1} of {exam.questions.length}
                  </span>
                  <span className="badge bg-secondary px-3 py-1 font-monospace">{currentQ.marks} Mark(s)</span>
                </div>

                <h5 className="fw-bold text-light mb-4 leading-relaxed">{currentQ.questionText}</h5>

                {/* Options List */}
                <div className="d-flex flex-column gap-2.5 mb-4">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = selectedOptions.includes(opt.optionText);
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(opt.optionText)}
                        className={`p-3 rounded-3 border transition-all d-flex align-items-center gap-3 style-cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary bg-opacity-20 text-white shadow-sm'
                            : 'border-secondary bg-dark bg-opacity-50 text-light hover-bg-dark'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          className={`rounded-circle border p-1 d-flex align-items-center justify-content-center flex-shrink-0 ${
                            isSelected ? 'border-primary bg-primary text-white' : 'border-secondary text-muted'
                          }`}
                          style={{ width: 22, height: 22 }}
                        >
                          {isSelected && <CheckCircle2 size={14} />}
                        </div>
                        <span className="fw-medium">{opt.optionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls Bar */}
              <div className="d-flex justify-content-between border-top border-secondary pt-3 mt-auto">
                <div className="d-flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrevQuestion}
                    disabled={currentMcqIdx === 0}
                    icon={ChevronLeft}
                  >
                    Previous
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleToggleReview} icon={Bookmark}>
                    Mark for Review
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextQuestion}
                  disabled={currentMcqIdx === exam.questions.length - 1}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CODING ARENA VIEW */}
          {/* ============================================================ */}
          {activeTab === 'coding' && currentProblem && (
            <div className="d-flex flex-column flex-grow-1 overflow-hidden h-100">
              {/* Problem Selection Pills Bar */}
              {exam.codingProblems.length > 1 && (
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-secondary overflow-x-auto flex-shrink-0 custom-ide-scrollbar">
                  <span className="text-muted small fw-semibold me-1 font-monospace">Problems:</span>
                  {exam.codingProblems.map((prob, pIdx) => (
                    <button
                      key={prob._id}
                      onClick={() => setCurrentCodingIdx(pIdx)}
                      className={`btn btn-sm rounded-pill px-3 fw-bold font-monospace d-inline-flex align-items-center gap-1.5 transition-all ${
                        currentCodingIdx === pIdx
                          ? 'btn-info text-dark shadow-sm'
                          : 'btn-outline-secondary text-light'
                      }`}
                    >
                      <Code2 size={14} /> Problem {pIdx + 1}: {prob.title}
                    </button>
                  ))}
                </div>
              )}

              {/* 50-50 Split Arena Workspace */}
              <div className="row g-3 flex-grow-1 overflow-hidden h-100">
                {/* Left Column: Problem Statement & Examples */}
                <div className="col-12 col-xl-5 d-flex flex-column h-100 overflow-auto pe-2 custom-ide-scrollbar">
                  {/* Problem Metadata Header */}
                  <div className="p-3 bg-dark border border-secondary rounded-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${
                          currentProblem.difficulty === 'easy' ? 'bg-success' : currentProblem.difficulty === 'hard' ? 'bg-danger' : 'bg-warning text-dark'
                        } px-2.5 py-1 text-uppercase font-monospace`}>
                          {currentProblem.difficulty}
                        </span>
                        <span className="badge bg-secondary px-2.5 py-1 font-monospace">
                          {currentProblem.category || 'Data Structures'}
                        </span>
                      </div>
                      <span className="badge bg-primary px-3 py-1 fs-6 font-monospace fw-bold">
                        {currentProblem.marks} Marks
                      </span>
                    </div>

                    <h4 className="fw-extrabold text-light m-0">{currentProblem.title}</h4>
                  </div>

                  {/* Problem Description */}
                  <div className="p-3 bg-dark bg-opacity-50 border border-secondary rounded-3 mb-3">
                    <h6 className="fw-bold text-info mb-2 d-flex align-items-center gap-1.5 small text-uppercase font-monospace">
                      <Sparkles size={14} /> Problem Statement
                    </h6>
                    <div className="text-light leading-relaxed small whitespace-pre-wrap">
                      {currentProblem.description}
                    </div>
                  </div>

                  {/* Input / Output Format */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-2.5 bg-dark border border-secondary rounded-3 h-100">
                        <div className="fw-bold text-warning small font-monospace mb-1">Input Format</div>
                        <div className="text-muted small">{currentProblem.inputFormat || 'Standard Input (stdin)'}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2.5 bg-dark border border-secondary rounded-3 h-100">
                        <div className="fw-bold text-success small font-monospace mb-1">Output Format</div>
                        <div className="text-muted small">{currentProblem.outputFormat || 'Standard Output (stdout)'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Constraints & Limits */}
                  <div className="p-2.5 bg-dark border border-secondary rounded-3 mb-3 d-flex align-items-center justify-content-between small text-muted font-monospace">
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={14} className="text-info" /> Time Limit: {currentProblem.timeLimit || 2}s
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <Cpu size={14} className="text-warning" /> Memory Limit: {currentProblem.memoryLimit || 128}MB
                    </div>
                  </div>

                  {/* Sample Test Case Examples */}
                  {currentProblem.examples && currentProblem.examples.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold text-light mb-2 small text-uppercase font-monospace">
                        Sample Examples ({currentProblem.examples.length})
                      </h6>

                      {currentProblem.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="p-3 bg-dark border border-secondary rounded-3 mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-info small font-monospace">Example {exIdx + 1}</span>
                            <button
                              className="btn btn-link btn-sm text-muted p-0 text-decoration-none d-flex align-items-center gap-1 small"
                              onClick={() => handleCopyInput(ex.input, exIdx)}
                            >
                              <Copy size={12} /> {copiedInputIdx === exIdx ? 'Copied!' : 'Copy Input'}
                            </button>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted extra-small font-monospace mb-0.5">Input:</div>
                            <pre className="bg-secondary bg-opacity-20 text-success p-2 rounded small m-0 font-monospace border border-secondary">
                              {ex.input}
                            </pre>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted extra-small font-monospace mb-0.5">Expected Output:</div>
                            <pre className="bg-secondary bg-opacity-20 text-info p-2 rounded small m-0 font-monospace border border-secondary">
                              {ex.output}
                            </pre>
                          </div>

                          {ex.explanation && (
                            <div className="text-muted extra-small italic">
                              <strong>Explanation:</strong> {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Monaco Sandboxed Code Editor */}
                <div className="col-12 col-xl-7 h-100 d-flex flex-column">
                  <CodeEditor problem={currentProblem} examId={examId} />
                </div>
              </div>
            </div>
          )}

          {/* Empty Fallback state */}
          {!hasQuestions && !hasCoding && (
            <div className="text-center py-5 text-muted">
              <Layers size={48} className="mb-3 text-secondary" />
              <h5>No questions or coding problems configured for this exam.</h5>
            </div>
          )}
        </div>

        {/* Right Sidebar: Question Palette & Section Tracker */}
        <div style={{ width: 290 }} className="d-none d-lg-block flex-shrink-0">
          <QuestionPalette
            questions={exam.questions || []}
            currentIndex={currentMcqIdx}
            answers={attempt?.answers || []}
            onSelectQuestion={(idx) => {
              setActiveTab('mcq');
              setCurrentMcqIdx(idx);
            }}
          />

          {/* Coding Problems Side Palette */}
          {hasCoding && (
            <div className="glass-card p-3 rounded-4 border border-secondary shadow-lg mt-3">
              <div className="fw-bold text-light mb-2 small text-uppercase font-monospace d-flex align-items-center justify-content-between">
                <span>Coding Problems</span>
                <span className="badge bg-primary font-monospace">{exam.codingProblems.length}</span>
              </div>
              <div className="d-flex flex-column gap-2">
                {exam.codingProblems.map((prob, pIdx) => (
                  <button
                    key={prob._id}
                    onClick={() => {
                      setActiveTab('coding');
                      setCurrentCodingIdx(pIdx);
                    }}
                    className={`btn btn-sm text-start rounded-3 px-3 py-2 d-flex align-items-center justify-content-between transition-all ${
                      activeTab === 'coding' && currentCodingIdx === pIdx
                        ? 'btn-info text-dark fw-bold shadow-sm'
                        : 'btn-dark text-light border border-secondary'
                    }`}
                  >
                    <span className="text-truncate font-monospace" style={{ maxWidth: 180 }}>
                      P{pIdx + 1}. {prob.title}
                    </span>
                    <span className="badge bg-secondary font-monospace">{prob.marks}m</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveExam;

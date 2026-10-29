import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Timer from '../../components/Timer';
import PreExamSetup from '../../components/PreExamSetup';
import { buildExamSections, sectionProgress } from '../../utils/examSections';
import AntiCheatModal from '../../components/AntiCheatModal';
import CodeEditor from '../../components/CodeEditor';
import WebcamProctor from '../../components/WebcamProctor';
import AudioProctor from '../../components/AudioProctor';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/common/ThemeToggle';
import { toast } from 'react-toastify';
import '../../styles/student.css';
import '../../styles/live-exam.css';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Monitor,
  ArrowRight,
  Award,
} from 'lucide-react';

const LiveExam = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [submissionReceipt, setSubmissionReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);

  // Pre-Exam Instruction, Camera & Screen Sharing State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle', 'granted', 'denied', 'checking'
  const [screenShareStatus, setScreenShareStatus] = useState('idle'); // 'idle', 'granted', 'denied', 'checking', 'invalid'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [preExamStep, setPreExamStep] = useState(0);
  const [isTestInstructionsOpen, setIsTestInstructionsOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRequestRef = useRef({ camera: 0, screen: 0 });

  // Pre-Exam 40s Countdown State
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(40);

  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' or 'coding'
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [currentCodingIdx, setCurrentCodingIdx] = useState(0);
  const [isCodingBusy, setIsCodingBusy] = useState(false);
  const codingBusyRef = useRef({ promise: Promise.resolve(), resolve: null });
  const handleCodingBusy = (busy) => {
    setIsCodingBusy(busy);
    if (busy && !codingBusyRef.current.resolve) codingBusyRef.current.promise = new Promise(resolve => { codingBusyRef.current.resolve = resolve; });
    if (!busy && codingBusyRef.current.resolve) { codingBusyRef.current.resolve(); codingBusyRef.current.resolve = null; }
  };
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [answerSaveState, setAnswerSaveState] = useState('idle');
  const [copiedInputIdx, setCopiedInputIdx] = useState(null);
  const pendingAnswersRef = useRef(new Map());
  const answerSaveQueueRef = useRef(Promise.resolve());

  // Submission Confirm Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  useEffect(() => {
    if (!submissionReceipt) return;
    const timer = setTimeout(() => navigate('/student/dashboard', { replace: true, state: { assessmentSubmitted: true, releaseAt: submissionReceipt.releaseAt } }), 2500);
    return () => clearTimeout(timer);
  }, [submissionReceipt, navigate]);

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
      stopScreenStream();
    };
  }, [examId]);

  const stopCameraStream = () => {
    mediaRequestRef.current.camera += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopScreenStream = () => {
    mediaRequestRef.current.screen += 1;
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  };

  const verifyCameraAccess = async () => {
    if (cameraStatus === 'checking') return;
    stopCameraStream();
    const requestId = mediaRequestRef.current.camera;
    setCameraStatus('checking');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('denied');
        toast.error('Camera and microphone access is not supported by your browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      if (requestId !== mediaRequestRef.current.camera) { stream.getTracks().forEach(track => track.stop()); return; }
      if (!stream.getAudioTracks().some(track => track.readyState === 'live') || !stream.getVideoTracks().some(track => track.readyState === 'live')) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Camera and microphone are both required.');
      }

      streamRef.current = stream;
      stream.getTracks().forEach(track => { track.onended = () => {
        stopCameraStream();
        setCameraStatus('idle');
        toast.warning('Camera or microphone disconnected. Please verify both again.');
      }; });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('granted');
      toast.success('Camera and microphone verified and active!');
    } catch (err) {
      if (requestId !== mediaRequestRef.current.camera) return;
      console.error('Camera verification failed:', err);
      setCameraStatus('denied');
      toast.error('Camera and microphone access is required. Allow both permissions and try again.');
    }
  };

  const verifyScreenShare = async () => {
    if (screenShareStatus === 'checking') return;
    stopScreenStream();
    const requestId = mediaRequestRef.current.screen;
    setScreenShareStatus('checking');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setScreenShareStatus('denied');
        toast.error('Screen sharing is not supported by your browser. Please use Chrome, Edge, or Firefox.');
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      if (requestId !== mediaRequestRef.current.screen) { displayStream.getTracks().forEach(track => track.stop()); return; }
      const videoTrack = displayStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};

      // Enforce Entire Screen sharing
      if (settings.displaySurface && settings.displaySurface !== 'monitor') {
        videoTrack.stop();
        setScreenShareStatus('invalid');
        toast.error('Entire screen must be shared! You selected a window or tab. Please select "Entire Screen" to proceed.');
        return;
      }

      screenStreamRef.current = displayStream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
      }

      videoTrack.onended = () => {
        screenStreamRef.current = null;
        setScreenShareStatus('idle');
        toast.warning('Screen sharing has stopped. You must keep your screen shared.');
      };

      setScreenShareStatus('granted');
      toast.success('Entire screen shared successfully!');
    } catch (err) {
      if (requestId !== mediaRequestRef.current.screen) return;
      console.error('Screen share verification failed:', err);
      setScreenShareStatus('denied');
      toast.error('Screen share was cancelled or denied. Entire screen sharing is mandatory.');
    }
  };

  const fetchExamMetadata = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/exams/${examId}`);
      setExam(res.data.exam);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load exam information');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const initExamWorkspace = (examData, attemptData) => {
    pendingAnswersRef.current.clear();
    setAnswerSaveState('idle');
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

  // 40-second countdown effect before exam starts
  useEffect(() => {
    let timer;
    if (isCountingDown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      handleStartExamNow();
    }
    return () => clearInterval(timer);
  }, [isCountingDown, countdown]);

  const handleContinueClick = () => {
    if (cameraStatus !== 'granted' || !streamRef.current?.getAudioTracks().some(track => track.readyState === 'live')) {
      toast.error('Camera and microphone verification is required before continuing.');
      return;
    }
    if (screenShareStatus !== 'granted') {
      toast.error('Please share your entire screen before continuing.');
      return;
    }
    if (!agreedToTerms) {
      toast.warning('Please agree to the exam terms & anti-cheat guidelines.');
      return;
    }

    // Enter Fullscreen immediately upon user gesture click
    requestFullScreen();

    // Begin 40s countdown
    setCountdown(40);
    setIsCountingDown(true);
  };

  const handleStartExamNow = async () => {
    const cameraActive = cameraStatus === 'granted' && streamRef.current?.getVideoTracks().some(track => track.readyState === 'live') && streamRef.current?.getAudioTracks().some(track => track.readyState === 'live');
    const screenActive = screenShareStatus === 'granted' && screenStreamRef.current?.getVideoTracks().some(track => track.readyState === 'live');
    if (!cameraActive || !screenActive || !agreedToTerms) {
      setIsCountingDown(false);
      setPreExamStep(!cameraActive ? 1 : !screenActive ? 2 : 3);
      if (!cameraActive) setCameraStatus('idle');
      if (!screenActive) setScreenShareStatus('idle');
      toast.error('Complete your camera, microphone, screen sharing and agreement checks before starting.');
      return;
    }
    try {
      setLoading(true);
      requestFullScreen();

      const res = await API.post(`/exams/${examId}/start`);
      setExam(res.data.exam);
      setAttempt(res.data.attempt);
      setIsCountingDown(false);
      setIsExamStarted(true);
      initExamWorkspace(res.data.exam, res.data.attempt);
      toast.success('Exam started! Good luck!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start exam attempt';
      toast.error(msg);
      setIsCountingDown(false);
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = (questionId, selected, extra = {}) => {
    const questionKey = extra.codingProblemId ? 'coding:' + extra.codingProblemId : String(questionId);
    const previous = pendingAnswersRef.current.get(questionKey)?.payload || {};
    const payload = { ...previous, ...(questionId ? { questionId } : {}), ...(selected !== undefined ? { selectedOptions: selected } : {}), ...extra };
    const request = { payload, questionKey };
    pendingAnswersRef.current.set(questionKey, request);
    setAnswerSaveState('saving');
    const queuedSave = answerSaveQueueRef.current.catch(() => {}).then(async () => {
      if (pendingAnswersRef.current.get(questionKey) !== request) return;
      await API.post('/exams/' + examId + '/answer', payload);
      if (pendingAnswersRef.current.get(questionKey) === request) {
        pendingAnswersRef.current.delete(questionKey);
        setAnswerSaveState(pendingAnswersRef.current.size ? 'saving' : 'saved');
      }
    }).catch(error => {
      if (pendingAnswersRef.current.get(questionKey) === request) { setAnswerSaveState('error'); console.error('Save progress error:', error); }
    });
    answerSaveQueueRef.current = queuedSave;
    return queuedSave;
  };
  const retryPendingAnswers = () => [...pendingAnswersRef.current.values()].forEach(({ payload }) => saveAnswer(payload.questionId, payload.selectedOptions, payload));
  const updateLocalAnswer = (questionId, changes) => setAttempt(prev => {
    const answers = [...(prev?.answers || [])];
    const index = answers.findIndex(answer => String(answer.questionId) === String(questionId));
    if (index >= 0) answers[index] = { ...answers[index], ...changes };
    else answers.push({ questionId, selectedOptions: [], ...changes });
    return { ...prev, answers };
  });
  const handleSelectOption = (optionText) => {
    const question = exam?.questions?.[currentMcqIdx];
    if (!question || isSubmittingExam) return;
    const next = question.questionType === 'multiple' ? (selectedOptions.includes(optionText) ? selectedOptions.filter(value => value !== optionText) : [...selectedOptions, optionText]) : [optionText];
    setSelectedOptions(next);
    updateLocalAnswer(question._id, { selectedOptions: next, isVisited: true });
    saveAnswer(question._id, next);
  };
  const markCurrentAsVisited = (index) => {
    const question = exam?.questions?.[index];
    if (!question) return;
    updateLocalAnswer(question._id, { isVisited: true });
    saveAnswer(question._id, undefined);
  };
  const markCodingVisited = (index) => {
    const problem = exam?.codingProblems?.[index];
    if (!problem) return;
    setAttempt(prev => ({ ...prev, codingVisited: [...new Set([...(prev?.codingVisited || []).map(String), String(problem._id)])] }));
    saveAnswer(null, undefined, { codingProblemId: problem._id });
  };
  const leaveCurrentItem = () => activeTab === 'mcq' ? markCurrentAsVisited(currentMcqIdx) : markCodingVisited(currentCodingIdx);
  const selectMcq = (index) => {
    if (isCodingBusy || isSubmittingExam) return;
    if (activeTab !== 'mcq' || index !== currentMcqIdx) leaveCurrentItem();
    setActiveTab('mcq'); setCurrentMcqIdx(index);
    const answer = attempt?.answers?.find(item => String(item.questionId) === String(exam.questions[index]._id));
    setSelectedOptions(answer?.selectedOptions || []);
  };
  const selectCoding = (index) => {
    if (isCodingBusy || isSubmittingExam) return;
    if (activeTab !== 'coding' || index !== currentCodingIdx) leaveCurrentItem();
    setActiveTab('coding'); setCurrentCodingIdx(index);
  };
  const selectSection = (section) => section.kind === 'coding' ? selectCoding(section.items[0].index) : selectMcq(section.items[0].index);
  const getCurrentSection = () => buildExamSections(exam || {}).find(section => section.kind === activeTab && section.items.some(item => item.index === (activeTab === 'coding' ? currentCodingIdx : currentMcqIdx)));
  const handleNextQuestion = () => {
    const section = getCurrentSection();
    const position = section?.items.findIndex(item => item.index === currentMcqIdx) ?? -1;
    if (position >= 0 && position < section.items.length - 1) selectMcq(section.items[position + 1].index);
  };
  const handlePrevQuestion = () => {
    const section = getCurrentSection();
    const position = section?.items.findIndex(item => item.index === currentMcqIdx) ?? -1;
    if (position > 0) selectMcq(section.items[position - 1].index);
  };
  const handleSkip = () => {
    if (isCodingBusy || isSubmittingExam) return;
    leaveCurrentItem();
    const section = getCurrentSection();
    const position = section?.items.findIndex(item => item.index === (activeTab === 'coding' ? currentCodingIdx : currentMcqIdx)) ?? -1;
    if (position >= 0 && position < section.items.length - 1) {
      if (activeTab === 'coding') selectCoding(section.items[position + 1].index); else selectMcq(section.items[position + 1].index);
    }
  };
  const handleToggleReview = () => {
    const question = exam?.questions?.[currentMcqIdx];
    if (!question || isSubmittingExam) return;
    const answer = attempt?.answers?.find(item => String(item.questionId) === String(question._id));
    const reviewed = !answer?.isMarkedForReview;
    updateLocalAnswer(question._id, { isMarkedForReview: reviewed, isVisited: true });
    saveAnswer(question._id, undefined, { isMarkedForReview: reviewed });
  };

  const handleCopyInput = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedInputIdx(idx);
    toast.info('Example input copied to clipboard');
    setTimeout(() => setCopiedInputIdx(null), 2000);
  };

  const handleFinalSubmit = async () => {
    let submitted = false;
    try {
      setIsSubmittingExam(true);
      await codingBusyRef.current.promise;
      await answerSaveQueueRef.current;
      if (pendingAnswersRef.current.size > 0) {
        setIsSubmittingExam(false);
        toast.error('Some answers are not saved yet. Retry saving them before submitting.');
        return;
      }
      const res = await API.post(`/exams/${examId}/submit`);
      submitted = true;
      toast.success('Assessment submitted. Locked for analysis.');
      stopCameraStream();
      stopScreenStream();
      setCameraStatus('idle');
      setScreenShareStatus('idle');
      setAgreedToTerms(false);
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setSubmissionReceipt({ releaseAt: res.data.releaseAt || null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setIsSubmittingExam(false);
      if (submitted) setShowConfirmDialog(false);
    }
  };

  if (submissionReceipt) return <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 student-exam-start">
    <section className="card p-5 text-center" role="status" style={{ maxWidth: 520 }}><Shield size={44} className="text-primary mx-auto mb-3" /><h1 className="h3">Locked for analysis</h1><p className="text-muted">Your assessment has been submitted. Results will be shown when your faculty releases them.</p><p className="small text-muted">Returning to your dashboard…</p><button type="button" className="btn btn-primary" onClick={() => navigate('/student/dashboard', { replace: true, state: { assessmentSubmitted: true, releaseAt: submissionReceipt.releaseAt } })}>Go to dashboard</button></section>
  </div>;

  if (loading || !exam) {
    return (
      <div className="min-vh-100 bg-dark text-body d-flex flex-column align-items-center justify-content-center">
        <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} />
        <h5 className="fw-bold">Initializing Distraction-Free Proctored Workspace...</h5>
        <p className="text-secondary small">Checking credentials and loading exam data...</p>
      </div>
    );
  }

  // ============================================================
  // PRE-EXAM SCREEN: INSTRUCTIONS & CAMERA VERIFICATION CHECKLIST
  // ============================================================
  // ============================================================
  // PRE-EXAM COUNTDOWN SCREEN (40 SECONDS BEFORE EXAM STARTS)
  // ============================================================
  if (isCountingDown && !isExamStarted) {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((40 - countdown) / 40) * circumference;

    return (
      <div
        className="student-exam-start min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 text-body position-relative"
      >
        <div
          className="card p-4 p-md-5 border border-secondary border-opacity-25 rounded-4 shadow-lg text-center"
          style={{ maxWidth: 660, width: '100%' }}
        >
          <div className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 px-3 py-1.5 rounded-pill mb-3 align-self-center font-monospace small">
            VERIFICATION COMPLETE · FULLSCREEN ACTIVE
          </div>

          <h2 className="h4 fw-bold text-body mb-1">Assessment Starting In...</h2>
          <p className="text-secondary small mb-4">
            Locking secure proctoring environment. Please sit comfortably facing your screen.
          </p>

          {/* Animated 40-Second Circular Countdown */}
          <div className="position-relative d-inline-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: 150, height: 150 }}>
            <svg style={{ width: 150, height: 150, transform: 'rotate(-90deg)' }}>
              <circle
                cx="75"
                cy="75"
                r={radius}
                stroke="var(--app-border)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="75"
                cy="75"
                r={radius}
                stroke="var(--app-blue)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="position-absolute text-center">
              <span className="display-4 fw-bold text-body font-monospace">{countdown}</span>
              <span className="d-block text-secondary extra-small text-uppercase">seconds</span>
            </div>
          </div>

          {/* Verification Status Badges */}
          <div className="row g-2 mb-4 text-start">
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-body">Camera & Microphone Active</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-body">Entire Screen Shared</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-body">Fullscreen Mode Locked</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-body">Test Sandbox Ready</span>
              </div>
            </div>
          </div>

          <div className="alert alert-warning bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning small py-2.5 px-3 mb-4 text-start d-flex align-items-center gap-2">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>Do not exit fullscreen or switch tabs. The assessment will begin automatically in <strong>{countdown}</strong> seconds.</span>
          </div>

          <button
            type="button"
            className="btn btn-primary fw-bold py-2.5 px-4 rounded-pill d-inline-flex align-items-center justify-content-center gap-2 shadow"
            onClick={handleStartExamNow}
          >
            <Play size={16} /> Begin Exam Immediately ({countdown}s)
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // PRE-EXAM SCREEN: INSTRUCTIONS & VERIFICATION (WEBCAM & SCREEN)
  // ============================================================
  if (!isExamStarted) {
    return <PreExamSetup exam={exam} step={preExamStep} onStepChange={setPreExamStep}
      cameraStatus={cameraStatus} screenStatus={screenShareStatus} agreed={agreedToTerms} onAgreement={setAgreedToTerms}
      instructionsOpen={isTestInstructionsOpen} onToggleInstructions={() => setIsTestInstructionsOpen(open => !open)}
      cameraRef={node => { videoRef.current = node; if (node) node.srcObject = streamRef.current; }}
      screenRef={node => { screenVideoRef.current = node; if (node) node.srcObject = screenStreamRef.current; }}
      onCamera={verifyCameraAccess} onScreen={verifyScreenShare} onContinue={handleContinueClick}/>;
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
  const sections = buildExamSections(exam);
  const currentSection = getCurrentSection();
  const currentPosition = currentSection?.items.findIndex(item => item.index === (activeTab === 'coding' ? currentCodingIdx : currentMcqIdx)) ?? 0;
  const progress = sections.reduce((sum, section) => {
    const value = sectionProgress(section, attempt || {});
    Object.keys(sum).forEach(key => { sum[key] += value[key]; });
    return sum;
  }, { total: 0, attempted: 0, skipped: 0, remaining: 0, review: 0 });

  const currentAnswer = attempt?.answers?.find(answer => String(answer.questionId) === String(currentQ?._id));
  const nextSection = sections[sections.findIndex(section => section.id === currentSection?.id) + 1];
  const atLastItem = currentPosition === (currentSection?.items.length || 0) - 1;

  return (
    <div className="exam-workspace exam-focus student-live-exam min-vh-100 position-relative d-flex flex-column text-body">
      <AntiCheatModal examId={examId} onMaxViolations={handleFinalSubmit} />


      {/* Pre-Submission Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleFinalSubmit}
        title="Submit Exam?"
        description={`${progress.attempted} / ${progress.total} attempted · ${progress.skipped} skipped · ${progress.remaining} not visited · ${progress.review} marked for review. Submit all test sections?`}
        confirmLabel="Finalize & Submit"
        cancelLabel="Continue Exam"
        variant="danger"
        loading={isSubmittingExam}
      />

      {/* Fullscreen Lockout Overlay */}
      {!isFullscreen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 text-body"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2100, backdropFilter: 'blur(10px)' }}
        >
          <div className="card p-5 border-danger text-center rounded-3 shadow-lg" style={{ maxWidth: 500 }}>
            <Shield size={48} className="text-warning mb-3" />
            <h4 className="fw-bold text-body mb-2">Fullscreen Mode Required</h4>
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
      <header className="student-exam-topbar exam-focus-header">
        <div className="exam-heading">
          <span className="exam-heading-icon"><Shield size={23} aria-hidden="true" /></span>
          <div className="min-width-0"><span className="exam-eyebrow">ASSESSMENT IN PROGRESS</span><h1>{exam.title}</h1><span className="exam-security"><span /> Proctoring active</span></div>
        </div>

        <div className="exam-header-controls">
          <div className="exam-save-status small d-flex align-items-center gap-2" role="status" aria-live="polite">
            {answerSaveState === 'saving' && <><span className="spinner-border spinner-border-sm" aria-hidden="true" />Saving answers…</>}
            {answerSaveState === 'saved' && <span className="text-success d-inline-flex align-items-center gap-1"><CheckCircle2 size={15} /> All answers saved</span>}
            {answerSaveState === 'error' && (
              <>
                <span className="text-danger">Answer save failed</span>
                <button type="button" className="btn btn-outline-warning btn-sm" onClick={retryPendingAnswers}>Retry save</button>
              </>
            )}
          </div>
          <details className="exam-proctor-monitor">
            <summary aria-label="Camera and microphone monitor"><Camera size={16}/><span>Camera & mic</span><ChevronDown size={14}/></summary>
            <div className="exam-proctor-monitor-content">
      <WebcamProctor mediaStream={streamRef.current} examId={examId} onViolation={(type, meta) => {
        try { API.post(`/exams/${examId}/anticheat`, { eventType: type, metadata: meta }); } catch(e) {}
      }} />
      <AudioProctor mediaStream={streamRef.current} onAudioViolation={(type, meta) => {
        try { API.post(`/exams/${examId}/anticheat`, { eventType: type, metadata: meta }); } catch(e) {}
      }} />
            </div>
          </details>
          <ThemeToggle />
          <div className="exam-time-remaining"><span>Time remaining</span><Timer initialSeconds={attempt?.remainingTime > 0 ? attempt.remainingTime : (exam.duration * 60)} onTimeUp={handleFinalSubmit} /></div>
          <Button variant="danger" size="sm" onClick={() => setShowConfirmDialog(true)} disabled={isSubmittingExam || isCodingBusy} className="fw-bold px-3">
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="exam-workspace-layout flex-grow-1 p-3 d-flex flex-column overflow-hidden">
        {/* Left / Center Section Panel */}
        <div className="exam-focus-surface flex-grow-1 d-flex flex-column card p-3 rounded-3 border overflow-hidden h-100">
          <div className="exam-section-toolbar flex-shrink-0">
            <div className="exam-section-navigation">
              <div className="exam-section-picker">
                <label htmlFor="live-exam-section" className="small text-muted fw-semibold">Test section <span className="exam-section-count">{sections.findIndex(section => section.id === currentSection?.id) + 1} / {sections.length}</span></label>
                <select id="live-exam-section" className="form-select" value={currentSection?.id || ''} disabled={isCodingBusy || isSubmittingExam || !sections.length} onChange={event => { const section = sections.find(item => item.id === event.target.value); if (section) selectSection(section); }}>
                  {!sections.length && <option value="">No sections</option>}
                  {sections.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}
                </select>
              </div>
              <nav className="exam-number-navigation" aria-label={activeTab === 'coding' ? 'Coding problems' : 'Section questions'}>
                {currentSection?.items.map(({ item, index }, position) => {
                  const answer = activeTab === 'mcq' ? attempt?.answers?.find(record => String(record.questionId) === String(item._id)) : null;
                  const submitted = activeTab === 'coding' ? attempt?.codingSubmissions?.some(record => String(record.problemId) === String(item._id)) : Boolean(answer?.selectedOptions?.length);
                  const visited = activeTab === 'coding' ? attempt?.codingVisited?.some(id => String(id) === String(item._id)) : answer?.isVisited;
                  const status = answer?.isMarkedForReview ? 'review' : submitted ? 'attempted' : visited ? 'skipped' : 'unvisited';
                  const isCurrent = position === currentPosition;
                  const label = (activeTab === 'coding' ? 'Problem ' : 'Question ') + (position + 1);
                  return <button type="button" key={item._id} className={'exam-number-button is-' + status + (isCurrent ? ' is-current' : '')} aria-label={label + ', ' + status} title={label + ' · ' + status} aria-current={isCurrent ? 'step' : undefined} disabled={isCodingBusy || isSubmittingExam} onClick={() => activeTab === 'coding' ? selectCoding(index) : selectMcq(index)}>{position + 1}</button>;
                })}
              </nav>
              {activeTab === 'coding' && <button type="button" className="btn btn-outline-secondary btn-sm exam-number-skip" onClick={() => atLastItem && nextSection ? selectSection(nextSection) : handleSkip()} disabled={isCodingBusy || isSubmittingExam || (atLastItem && !nextSection)}>{atLastItem && nextSection ? 'Next section' : 'Skip / Next'} <ChevronRight size={16}/></button>}
            </div>
            <div className="exam-inline-progress" aria-label="Attempt record" aria-live="polite">
              <span className="exam-progress-summary"><strong>{progress.attempted} / {progress.total}</strong> attempted</span>
              <span className="exam-status-key is-attempted"><i aria-hidden="true" /><strong>{progress.attempted}</strong> Answered / submitted</span>
              <span className="exam-status-key is-skipped"><i aria-hidden="true" /><strong>{progress.skipped}</strong> Skipped</span>
              <span className="exam-status-key"><i aria-hidden="true" /><strong>{progress.remaining}</strong> Not visited</span>
              <span className="exam-status-key is-review"><i aria-hidden="true" /><strong>{progress.review}</strong> For review</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: MCQ QUESTION VIEW */}
          {/* ============================================================ */}
          {activeTab === 'mcq' && currentQ && (
            <div className="exam-mcq-workspace d-flex flex-column flex-grow-1">
              <div className="exam-mcq-content overflow-auto custom-ide-scrollbar">
                <div className="exam-question-meta d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-muted small font-monospace">
                    Question {currentPosition + 1} of {currentSection?.items.length || 0}
                  </span>
                  <span className="badge bg-secondary px-3 py-1 font-monospace">{currentQ.marks} Mark(s)</span>
                </div>

                <h2 id="live-question-title" className="exam-question-title">{currentQ.questionText}</h2>
                <p className="exam-answer-hint">{currentQ.questionType === 'multiple' ? 'Select all correct answers.' : 'Select one correct answer.'}</p>

                {/* Options List */}
                <div className="student-exam-options mb-4" role="group" aria-labelledby="live-question-title">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = selectedOptions.includes(opt.optionText);
                    return (
                      <button
                        type="button"
                        key={oIdx}
                        onClick={() => handleSelectOption(opt.optionText)}
                        disabled={isSubmittingExam}
                        role={currentQ.questionType === 'multiple' ? 'checkbox' : 'radio'}
                        aria-checked={isSelected}
                        className={`student-exam-option p-3 rounded-3 border transition-all d-flex align-items-center gap-3 style-cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary bg-opacity-20 text-body shadow-sm'
                            : 'border bg-dark bg-opacity-50 text-body hover-bg-dark'
                        }`}
                        style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        <span className="exam-option-letter" aria-hidden="true">{String.fromCharCode(65 + oIdx)}</span>
                        <span className="exam-option-copy">{opt.optionText}</span>
                        <span className={`exam-option-check ${currentQ.questionType === 'multiple' ? 'is-multiple' : ''}`} aria-hidden="true">{isSelected && <Check size={15} />}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls Bar */}
              <div className="exam-bottom-navigation d-flex justify-content-between border-top pt-3 mt-auto">
                <div className="d-flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrevQuestion}
                    disabled={currentPosition === 0 || isSubmittingExam}
                    icon={ChevronLeft}
                  >
                    Previous
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleSkip} disabled={isSubmittingExam}>Skip / Next</Button>
                  <Button variant={currentAnswer?.isMarkedForReview ? "warning" : "outline-secondary"} size="sm" onClick={handleToggleReview} disabled={isSubmittingExam} icon={Bookmark} aria-pressed={Boolean(currentAnswer?.isMarkedForReview)}>
                    {currentAnswer?.isMarkedForReview ? 'Marked for review' : 'Mark for review'}
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => atLastItem && nextSection ? selectSection(nextSection) : handleNextQuestion()}
                  disabled={(atLastItem && !nextSection) || isSubmittingExam}
                >
                  {atLastItem && nextSection ? 'Next section' : 'Next question'} <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CODING ARENA VIEW */}
          {/* ============================================================ */}
          {activeTab === 'coding' && currentProblem && (
            <section className="exam-code-arena d-flex flex-column flex-grow-1 overflow-hidden h-100" aria-label="Coding problem workspace">
              <div className="row g-3 flex-grow-1 overflow-hidden h-100 exam-coding-columns">
                <div className="col-12 col-lg-6 d-flex flex-column h-100 overflow-auto custom-ide-scrollbar exam-problem-panel">
                  {/* Problem Metadata Header */}
                  <header className="exam-problem-summary p-3 border rounded-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className={`badge ${
                          currentProblem.difficulty === 'easy' ? 'bg-success' : currentProblem.difficulty === 'hard' ? 'bg-danger' : 'bg-warning text-dark'
                        } px-2.5 py-1 text-uppercase font-monospace`}>
                          {currentProblem.difficulty || 'easy'}
                        </span>
                        <span className="badge bg-secondary px-2.5 py-1 font-monospace">
                          {currentProblem.topic || currentProblem.category || 'General'}
                        </span>
                      </div>
                      <span className="badge bg-primary px-3 py-1 font-monospace fw-bold">
                        {currentProblem.marks} Marks
                      </span>
                    </div>

                    <h2 className="h5 fw-bold text-body m-0">{currentProblem.title}</h2>
                    {currentProblem.tags?.length > 0 && <div className="exam-problem-tags mt-2">{currentProblem.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
                  </header>

                  <section className="exam-problem-section p-3 border rounded-3 mb-3">
                    <h3 className="exam-coding-section-title"><Sparkles size={15} /> Problem statement</h3>
                    <div className="text-body leading-relaxed small whitespace-pre-wrap">
                      {currentProblem.description}
                    </div>
                  </section>

                  <section className="exam-problem-specs row g-2 mb-3" aria-label="Input and output format">
                    <div className="col-6">
                      <div className="exam-problem-section p-3 border rounded-3 h-100">
                        <h3 className="exam-coding-section-title">Input format</h3>
                        <div className="text-muted small">{currentProblem.inputFormat || 'Standard Input (stdin)'}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="exam-problem-section p-3 border rounded-3 h-100">
                        <h3 className="exam-coding-section-title">Output format</h3>
                        <div className="text-muted small">{currentProblem.outputFormat || 'Standard Output (stdout)'}</div>
                      </div>
                    </div>
                  </section>

                  {currentProblem.constraints && (
                    <section className="exam-problem-section p-3 border rounded-3 mb-3">
                      <h3 className="exam-coding-section-title"><FileText size={15} /> Constraints</h3>
                      <div className="small text-body whitespace-pre-wrap">{currentProblem.constraints}</div>
                    </section>
                  )}

                  <div className="exam-problem-limits border rounded-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 small text-muted">
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={14} className="text-info" /> Time Limit: {currentProblem.timeLimit || 2}s
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <Cpu size={14} className="text-warning" /> Memory Limit: {currentProblem.memoryLimit || 128}MB
                    </div>
                  </div>

                  {currentProblem.examples && currentProblem.examples.length > 0 && (
                    <section className="exam-problem-section p-3 border rounded-3 mb-3">
                      <h3 className="exam-coding-section-title">Examples <span className="text-muted">{currentProblem.examples.length}</span></h3>

                      {currentProblem.examples.map((ex, exIdx) => (
                        <article key={exIdx} className="exam-example-card p-3 border rounded-3 mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-semibold small">Example {exIdx + 1}</span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-muted p-0 text-decoration-none d-flex align-items-center gap-1 small"
                              onClick={() => handleCopyInput(ex.input, exIdx)}
                            >
                              <Copy size={12} /> {copiedInputIdx === exIdx ? 'Copied!' : 'Copy Input'}
                            </button>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted extra-small mb-0.5">Input</div>
                            <pre className="exam-example-code p-2 rounded small m-0 font-monospace border">
                              {ex.input}
                            </pre>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted extra-small mb-0.5">Expected output</div>
                            <pre className="exam-example-code p-2 rounded small m-0 font-monospace border">
                              {ex.output}
                            </pre>
                          </div>

                          {ex.explanation && (
                            <div className="text-muted extra-small italic">
                              <strong>Explanation:</strong> {ex.explanation}
                            </div>
                          )}
                        </article>
                      ))}
                    </section>
                  )}
                </div>

                <div className="col-12 col-lg-6 h-100 d-flex flex-column exam-editor-panel">
                  <CodeEditor problem={currentProblem} examId={examId} draftScope={attempt?._id} onBusyChange={handleCodingBusy} onSubmissionSuccess={submission => setAttempt(prev => ({ ...prev, codingSubmissions: [...(prev?.codingSubmissions || []).filter(item => String(item.problemId) !== String(currentProblem._id)), { problemId: currentProblem._id, submissionId: submission._id, status: submission.status, score: submission.score }] }))} />
                </div>
              </div>
            </section>
          )}

          {/* Empty Fallback state */}
          {!hasQuestions && !hasCoding && (
            <div className="text-center py-5 text-muted">
              <Layers size={48} className="mb-3 text-secondary" />
              <h5>No questions or coding problems configured for this exam.</h5>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default LiveExam;

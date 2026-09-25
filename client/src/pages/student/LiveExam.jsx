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
  Monitor,
  ArrowRight,
  Award,
} from 'lucide-react';

const LiveExam = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);

  // Pre-Exam Instruction, Camera & Screen Sharing State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle', 'granted', 'denied', 'checking'
  const [screenShareStatus, setScreenShareStatus] = useState('idle'); // 'idle', 'granted', 'denied', 'checking', 'invalid'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Pre-Exam 40s Countdown State
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(40);

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
      stopScreenStream();
    };
  }, [examId]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopScreenStream = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
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

  const verifyScreenShare = async () => {
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
        setScreenShareStatus('idle');
        toast.warning('Screen sharing has stopped. You must keep your screen shared.');
      };

      setScreenShareStatus('granted');
      toast.success('Entire screen shared successfully!');
    } catch (err) {
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
      navigate('/student/exams');
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
    if (cameraStatus !== 'granted') {
      toast.error('Webcam verification is required before continuing.');
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
        className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 text-white position-relative"
        style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)' }}
      >
        <div
          className="card p-4 p-md-5 border border-secondary border-opacity-25 rounded-4 shadow-lg text-center bg-dark bg-opacity-80 backdrop-blur"
          style={{ maxWidth: 660, width: '100%' }}
        >
          <div className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 px-3 py-1.5 rounded-pill mb-3 align-self-center font-monospace small">
            VERIFICATION COMPLETE · FULLSCREEN ACTIVE
          </div>

          <h2 className="h4 fw-bold text-white mb-1">Assessment Starting In...</h2>
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
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="75"
                cy="75"
                r={radius}
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="position-absolute text-center">
              <span className="display-4 fw-bold text-white font-monospace">{countdown}</span>
              <span className="d-block text-secondary extra-small text-uppercase">seconds</span>
            </div>
          </div>

          {/* Verification Status Badges */}
          <div className="row g-2 mb-4 text-start">
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-light">Webcam Stream Active</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-light">Entire Screen Shared</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-light">Fullscreen Mode Locked</span>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span className="small text-light">Test Sandbox Ready</span>
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
    const totalMCQs = exam.questions?.length || 0;
    const totalCoding = exam.codingProblems?.length || 0;
    const allChecksCompleted = cameraStatus === 'granted' && screenShareStatus === 'granted' && agreedToTerms;

    return (
      <div
        className="min-vh-100 bg-dark text-body p-3 p-md-4 d-flex align-items-center justify-content-center"
        style={{ background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)' }}
      >
        <div className="card p-4 p-md-5 border border-secondary border-opacity-25 rounded-4 shadow-lg w-100" style={{ maxWidth: 1060 }}>
          {/* Header */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-4 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary px-3 py-1 font-monospace">OFFICIAL ASSESSMENT</span>
                {exam.category && (
                  <span className="badge bg-secondary bg-opacity-20 text-light border border-secondary border-opacity-30">
                    {exam.category}
                  </span>
                )}
              </div>
              <h2 className="h4 fw-bold text-white m-0">{exam.title}</h2>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap font-monospace">
              <span className="badge bg-secondary bg-opacity-25 border border-secondary border-opacity-30 p-2.5 d-flex align-items-center gap-1.5 text-light">
                <Clock size={15} /> {exam.duration} Mins
              </span>
              <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 p-2.5 d-flex align-items-center gap-1.5">
                <Award size={15} /> {exam.totalMarks ?? '—'} Total Marks
              </span>
              <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-30 p-2.5 d-flex align-items-center gap-1.5">
                <FileCode size={15} /> {totalMCQs} MCQ · {totalCoding} Coding
              </span>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Box: Exam Rules & Anti-Cheat Guidelines */}
            <div className="col-12 col-lg-7">
              <h6 className="fw-bold text-info mb-3 d-flex align-items-center gap-2">
                <FileText size={18} /> Important Pre-Exam Instructions
              </h6>

              <div className="bg-dark bg-opacity-80 border border-secondary border-opacity-25 rounded-3 p-3.5 mb-4 text-light small shadow-sm">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-2.5">
                    <Maximize2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white d-block mb-0.5">Fullscreen Enforcement</strong>
                      <span className="text-secondary">
                        The assessment must be taken in Fullscreen Mode. Clicking Continue activates full screen. Exiting fullscreen or pressing Esc is recorded as a security violation.
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 d-flex align-items-start gap-2.5">
                    <AlertOctagon size={18} className="text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-danger d-block mb-0.5">3-Warning Violation Policy</strong>
                      <span className="text-light">
                        A maximum of <strong>3 security violations</strong> (tab-switching, alt-tabbing, focus loss, copy/paste) are permitted. Reaching <strong>3 violations triggers automatic submission</strong> immediately!
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <Shield size={18} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white d-block mb-0.5">Dual Proctoring (Webcam + Entire Screen)</strong>
                      <span className="text-secondary">
                        Real-time webcam monitoring and desktop screen sharing are active throughout the test. Ensure good room lighting and face visibility.
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white d-block mb-0.5">Real-Time Auto-Save</strong>
                      <span className="text-secondary">
                        Objective answers and code editor solutions are continuously saved in the cloud. You can revisit marked questions anytime before final submission.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Agreement Check Card */}
              <div
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`p-3 rounded-3 border transition-all d-flex align-items-center gap-3 mb-3 ${
                  agreedToTerms
                    ? 'border-success bg-success bg-opacity-15 text-white shadow-sm'
                    : 'border-secondary border-opacity-30 bg-dark bg-opacity-90 text-light'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={`rounded-2 border p-1 d-flex align-items-center justify-content-center flex-shrink-0 transition-all ${
                    agreedToTerms
                      ? 'border-success bg-success text-white'
                      : 'border-secondary border-opacity-50 bg-dark text-warning'
                  }`}
                  style={{ width: 24, height: 24 }}
                >
                  {agreedToTerms ? <Check size={16} strokeWidth={3} /> : <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#64748b' }} />}
                </div>
                <span className="small fw-semibold leading-snug select-none">
                  I declare that I have read all instructions, verified my camera, shared my entire screen, and agree to the 3-warning anti-cheat policy.
                </span>
              </div>
            </div>

            {/* Right Box: Hardware & Proctoring Verification (Webcam + Screen Sharing) */}
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2">
                  <Shield size={18} /> System & Proctoring Verification
                </h6>

                {/* 1. Webcam Verification Sub-Card */}
                <div className="p-3 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-60 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-white d-flex align-items-center gap-1.5">
                      <Camera size={15} className="text-warning" /> 1. Webcam Feed
                    </span>
                    {cameraStatus === 'granted' && (
                      <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 extra-small d-flex align-items-center gap-1">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>

                  <div className="position-relative bg-black rounded-3 overflow-hidden border border-secondary border-opacity-30 mb-2.5 text-center d-flex align-items-center justify-content-center" style={{ height: 140 }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-100 h-100"
                      style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                    {cameraStatus !== 'granted' && (
                      <div className="position-absolute p-2 text-center">
                        <Camera size={30} className="text-secondary mb-1 opacity-75" />
                        <p className="extra-small text-secondary mb-0">Webcam Not Enabled</p>
                      </div>
                    )}
                  </div>

                  {cameraStatus === 'idle' && (
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                      onClick={verifyCameraAccess}
                    >
                      <Camera size={14} /> Enable & Verify Webcam
                    </button>
                  )}

                  {cameraStatus === 'checking' && (
                    <div className="text-center text-info small py-1">
                      <span className="spinner-border spinner-border-sm me-2" /> Requesting Camera Access...
                    </div>
                  )}

                  {cameraStatus === 'granted' && (
                    <div className="p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2 text-success extra-small text-center d-flex align-items-center justify-content-center gap-1.5">
                      <CheckCircle2 size={14} /> Webcam Verified & Active
                    </div>
                  )}

                  {cameraStatus === 'denied' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                      onClick={verifyCameraAccess}
                    >
                      <Camera size={14} /> Retry Camera Permission
                    </button>
                  )}
                </div>

                {/* 2. Entire Screen Share Verification Sub-Card */}
                <div className="p-3 rounded-3 border border-secondary border-opacity-25 bg-dark bg-opacity-60 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-white d-flex align-items-center gap-1.5">
                      <Monitor size={15} className="text-info" /> 2. Entire Screen Share
                    </span>
                    {screenShareStatus === 'granted' && (
                      <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 extra-small d-flex align-items-center gap-1">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>

                  <p className="extra-small text-secondary mb-2">
                    <strong>Instruction:</strong> You must choose <strong>"Entire Screen"</strong> in the browser prompt. Sharing only an app window or tab is not permitted.
                  </p>

                  {/* Screen Share Mini Preview or Placeholder */}
                  <div className="position-relative bg-black rounded-3 overflow-hidden border border-secondary border-opacity-30 mb-2.5 text-center d-flex align-items-center justify-content-center" style={{ height: 120 }}>
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-100 h-100"
                      style={{ objectFit: 'contain' }}
                    />
                    {screenShareStatus !== 'granted' && (
                      <div className="position-absolute p-2 text-center">
                        <Monitor size={28} className="text-secondary mb-1 opacity-75" />
                        <p className="extra-small text-secondary mb-0">Entire Screen Not Shared</p>
                      </div>
                    )}
                  </div>

                  {screenShareStatus === 'idle' && (
                    <button
                      type="button"
                      className="btn btn-outline-info btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                      onClick={verifyScreenShare}
                    >
                      <Monitor size={14} /> Share Entire Screen
                    </button>
                  )}

                  {screenShareStatus === 'checking' && (
                    <div className="text-center text-info small py-1">
                      <span className="spinner-border spinner-border-sm me-2" /> Select "Entire Screen" in prompt...
                    </div>
                  )}

                  {screenShareStatus === 'granted' && (
                    <div className="p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2 text-success extra-small text-center d-flex align-items-center justify-content-center gap-1.5">
                      <CheckCircle2 size={14} /> Entire Screen Verified & Streaming
                    </div>
                  )}

                  {screenShareStatus === 'invalid' && (
                    <div className="mb-2">
                      <div className="p-2 bg-warning bg-opacity-15 border border-warning border-opacity-30 rounded-2 text-warning extra-small mb-2 text-start">
                        <AlertTriangle size={13} className="me-1" />
                        You shared a window or tab. You must select <strong>"Entire Screen"</strong> to proceed.
                      </div>
                      <button
                        type="button"
                        className="btn btn-warning btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                        onClick={verifyScreenShare}
                      >
                        <Monitor size={14} /> Re-Select Entire Screen
                      </button>
                    </div>
                  )}

                  {screenShareStatus === 'denied' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                      onClick={verifyScreenShare}
                    >
                      <Monitor size={14} /> Retry Screen Sharing
                    </button>
                  )}
                </div>
              </div>

              {/* Continue to Fullscreen & Countdown Button */}
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-lg w-100 fw-bold rounded-pill py-3 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                  disabled={!allChecksCompleted}
                  onClick={handleContinueClick}
                >
                  <Maximize2 size={19} /> Continue to Fullscreen (40s Countdown) <ArrowRight size={18} />
                </button>
                <div className="text-center mt-2 extra-small text-secondary">
                  Requires Webcam, Entire Screen Share & Terms agreement. Fullscreen will activate on Continue.
                </div>
              </div>
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
    <div className="exam-workspace min-vh-100 position-relative d-flex flex-column bg-dark text-body">
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
      <div className="px-4 py-2 bg-dark border-bottom border d-flex align-items-center justify-content-between shadow-sm sticky-top">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill font-monospace shadow-sm">
            {exam.title}
          </span>
          <span className="badge bg-success bg-opacity-10 text-success border-success border-opacity-25 px-3 py-1.5 rounded-pill d-none d-md-inline-flex align-items-center gap-1.5 small">
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
        <div className="flex-grow-1 d-flex flex-column card p-3 rounded-3 border shadow-lg overflow-hidden h-100">
          {/* Section Switcher Tabs */}
          <div className="nav nav-pills gap-2 border-bottom border pb-3 mb-3 flex-shrink-0">
            {hasQuestions && (
              <button
                className={`nav-link d-flex align-items-center gap-2 fw-bold px-4 py-2 rounded-pill transition-all ${
                  activeTab === 'mcq' ? 'active bg-primary shadow-sm' : 'text-body bg-dark border'
                }`}
                onClick={() => setActiveTab('mcq')}
              >
                <HelpCircle size={16} /> Objective MCQs ({exam.questions.length})
              </button>
            )}
            {hasCoding && (
              <button
                className={`nav-link d-flex align-items-center gap-2 fw-bold px-4 py-2 rounded-pill transition-all ${
                  activeTab === 'coding' ? 'active bg-primary shadow-sm' : 'text-body bg-dark border'
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

                <h5 className="fw-bold text-body mb-4 leading-relaxed">{currentQ.questionText}</h5>

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
                            : 'border bg-dark bg-opacity-50 text-body hover-bg-dark'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          className={`rounded-circle border p-1 d-flex align-items-center justify-content-center flex-shrink-0 ${
                            isSelected ? 'border-primary bg-primary text-white' : 'border text-muted'
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
              <div className="d-flex justify-content-between border-top border pt-3 mt-auto">
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
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border overflow-x-auto flex-shrink-0 custom-ide-scrollbar">
                  <span className="text-muted small fw-semibold me-1 font-monospace">Problems:</span>
                  {exam.codingProblems.map((prob, pIdx) => (
                    <button
                      key={prob._id}
                      onClick={() => setCurrentCodingIdx(pIdx)}
                      className={`btn btn-sm rounded-pill px-3 fw-bold font-monospace d-inline-flex align-items-center gap-1.5 transition-all ${
                        currentCodingIdx === pIdx
                          ? 'btn-info text-dark shadow-sm'
                          : 'btn-outline-secondary text-body'
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
                  <div className="p-3 bg-dark border rounded-3 mb-3">
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

                    <h4 className="fw-bold text-body m-0">{currentProblem.title}</h4>
                  </div>

                  {/* Problem Description */}
                  <div className="p-3 bg-dark bg-opacity-50 border rounded-3 mb-3">
                    <h6 className="fw-bold text-info mb-2 d-flex align-items-center gap-1.5 small text-uppercase font-monospace">
                      <Sparkles size={14} /> Problem Statement
                    </h6>
                    <div className="text-body leading-relaxed small whitespace-pre-wrap">
                      {currentProblem.description}
                    </div>
                  </div>

                  {/* Input / Output Format */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-2.5 bg-dark border rounded-3 h-100">
                        <div className="fw-bold text-warning small font-monospace mb-1">Input Format</div>
                        <div className="text-muted small">{currentProblem.inputFormat || 'Standard Input (stdin)'}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2.5 bg-dark border rounded-3 h-100">
                        <div className="fw-bold text-success small font-monospace mb-1">Output Format</div>
                        <div className="text-muted small">{currentProblem.outputFormat || 'Standard Output (stdout)'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Constraints & Limits */}
                  <div className="p-2.5 bg-dark border rounded-3 mb-3 d-flex align-items-center justify-content-between small text-muted font-monospace">
                    <div className="d-flex align-items-center gap-1">
                      <Clock size={14} className="text-info" /> Time Limit: {currentProblem.timeLimit || 2}s
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <Cpu size={14} className="text-warning" /> Memory Limit: {currentProblem.memoryLimit || 128}MB
                    </div>
                  </div>

                  {/* Public Test Case Examples */}
                  {currentProblem.examples && currentProblem.examples.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold text-body mb-2 small text-uppercase font-monospace">
                        Public Examples ({currentProblem.examples.length})
                      </h6>

                      {currentProblem.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="p-3 bg-dark border rounded-3 mb-2">
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
                            <pre className="bg-secondary bg-opacity-20 text-success p-2 rounded small m-0 font-monospace border">
                              {ex.input}
                            </pre>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted extra-small font-monospace mb-0.5">Expected Output:</div>
                            <pre className="bg-secondary bg-opacity-20 text-info p-2 rounded small m-0 font-monospace border">
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
            <div className="card p-3 rounded-3 border shadow-lg mt-3">
              <div className="fw-bold text-body mb-2 small text-uppercase font-monospace d-flex align-items-center justify-content-between">
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
                        : 'btn-dark text-body border'
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


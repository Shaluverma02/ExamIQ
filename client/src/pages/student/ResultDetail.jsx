import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { Award, CheckCircle2, XCircle, HelpCircle, Trophy, FileText, ArrowLeft, Bot, Sparkles, Code2, Download, RefreshCw } from 'lucide-react';
import { downloadResultsExcel } from '../../utils/downloadExcel';
import AICodeReviewModal from '../../components/AICodeReviewModal';
import AIStudyRoadmapModal from '../../components/AIStudyRoadmapModal';
import RetakeConfirmModal from '../../components/RetakeConfirmModal';
import PDFPerformanceReport from '../../components/PDFPerformanceReport';

const ResultDetail = () => {
  const { id: resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Retake State
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [isStartingRetake, setIsStartingRetake] = useState(false);

  // AI Modal States
  const [showAiCodeModal, setShowAiCodeModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedCodeData, setSelectedCodeData] = useState({
    code: '',
    language: 'javascript',
    problemTitle: '',
  });

  const handleStartRetake = async () => {
    if (!result || !result.examId) return;
    const examId = result.examId._id || result.examId;
    try {
      setIsStartingRetake(true);
      const res = await API.post(`/assessments/${examId}/retake`);
      toast.success(`New attempt #${res.data.attemptNumber || ''} created!`);
      setShowRetakeModal(false);
      navigate(`/student/exam/${examId}/attempt`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start retake attempt');
    } finally {
      setIsStartingRetake(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/results/${resultId}`);
      setResult(res.data.result);
      setCertificate(res.data.certificate);

      if (res.data.result?.status === 'Pass') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAiInsights = (code, language = 'javascript', problemTitle = 'Exam Problem') => {
    if (!code) {
      toast.info('No submitted code is available for this result.');
      return;
    }

    setSelectedCodeData({
      code,
      language,
      problemTitle: problemTitle || result?.examId?.title || 'Coding Submission',
    });
    setShowAiCodeModal(true);
  };

  const handleDownloadSingleExcel = async () => {
    if (!result) return;
    setDownloadingExcel(true);
    const sId = result.studentId?._id || result.studentId;
    const eId = result.examId?._id || result.examId;
    await downloadResultsExcel({ studentId: sId, examId: eId });
    setDownloadingExcel(false);
  };

  if (loading || !result) {
    return <div className="text-center py-5 text-body">Loading evaluation summary...</div>;
  }

  const score = Number(result.totalScore ?? result.score ?? 0);
  const totalMarks = Number(result.totalMarks ?? result.examId?.totalMarks ?? 0);
  const objectiveScore = Number(result.objectiveScore ?? 0);
  const codingScore = Number(result.codingScore ?? 0);
  const percentage = Number.isFinite(Number(result.percentage))
    ? Number(result.percentage)
    : totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;
  const status = result.status || (percentage >= 40 ? 'Pass' : 'Fail');
  const isPass = status.toLowerCase() === 'pass';
  const codingSubmission = result.attemptId?.codingSubmissions
    ?.map((item) => ({
      code: item.submissionId?.sourceCode,
      language: item.submissionId?.language || 'javascript',
      problemTitle: item.problemId?.title || result.examId?.title || 'Coding Submission',
    }))
    .find((item) => item.code);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Link to="/student/results" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
          <ArrowLeft size={16} /> Back to Results
        </Link>
        <div className="d-flex align-items-center gap-2">
          <PDFPerformanceReport result={result} student={result.studentId} exam={result.examId} />
          <button
            className="btn btn-success fw-bold btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
            onClick={handleDownloadSingleExcel}
            disabled={downloadingExcel}
          >
            {downloadingExcel ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} /> Download Result (Excel)
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-3 mb-4 text-white ${isPass ? 'bg-success bg-opacity-20 border-success' : 'bg-danger bg-opacity-20 border-danger'}`}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge ${isPass ? 'bg-success' : 'bg-danger'} fs-6`}>{status}</span>
              <span className="text-muted small">Evaluated at {new Date(result.evaluatedAt || result.submittedAt || Date.now()).toLocaleString()}</span>
            </div>
            <h2 className="fw-bold m-0 text-body">{result.examId?.title || 'Assessment Result'}</h2>
          </div>

          <div className="text-center">
            <h1 className={`display-4 fw-bold m-0 ${isPass ? 'text-success' : 'text-danger'}`}>
              {percentage}%
            </h1>
            <span className="text-muted small">Total Marks: {score} / {totalMarks || '-'}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center">
            <div className="text-success mb-1"><CheckCircle2 size={24} /></div>
            <h4 className="fw-bold text-body m-0">{result.correctAnswers ?? 0}</h4>
            <span className="text-muted small">Correct</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center">
            <div className="text-danger mb-1"><XCircle size={24} /></div>
            <h4 className="fw-bold text-body m-0">{result.wrongAnswers ?? 0}</h4>
            <span className="text-muted small">Wrong</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center">
            <div className="text-warning mb-1"><HelpCircle size={24} /></div>
            <h4 className="fw-bold text-body m-0">{result.skippedAnswers ?? 0}</h4>
            <span className="text-muted small">Skipped</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center">
            <div className="text-info mb-1"><Award size={24} /></div>
            <h4 className="fw-bold text-body m-0">{objectiveScore + codingScore || score}</h4>
            <span className="text-muted small">Objective + Coding</span>
          </div>
        </div>
      </div>

      {/* AI Code Review Action Card */}
      <div className="card p-4 mb-4 border-info border-opacity-50 bg-info bg-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h5 className="fw-bold text-body mb-1 d-flex align-items-center gap-2">
            <Sparkles className="text-warning animate-pulse" size={22} />
            AI Code Complexity & Optimization Analysis
          </h5>
          <p className="text-muted small mb-0">
            {codingSubmission
              ? 'Get instant AI analysis for your submitted solution: time and space complexity, edge cases, and clean code optimization tips.'
              : 'AI code feedback appears after this attempt has an actual coding submission.'}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-info fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
            onClick={() => setShowRoadmapModal(true)}
          >
            <Sparkles size={18} /> Generate AI Study Plan
          </button>

          <button
            className="btn btn-info fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow"
            onClick={() => handleOpenAiInsights(codingSubmission?.code, codingSubmission?.language, codingSubmission?.problemTitle)}
            disabled={!codingSubmission}
          >
            <Bot size={18} /> View AI Code Feedback
          </button>
        </div>
      </div>

      {/* Retake & Certificate Action Bar */}
      <div className="card p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-secondary fs-6 px-3 py-2 font-monospace">
            Attempt: {result.attemptNumber || 1} / {result.examId?.maxAttempts && result.examId.maxAttempts > 0 ? result.examId.maxAttempts : 'Unlimited'}
          </span>
          {result.examId?.allowRetake !== false && (
            <span className="text-secondary small font-monospace">
              {result.examId?.maxAttempts && result.examId.maxAttempts > 0 && result.attemptNumber >= result.examId.maxAttempts ? (
                <span className="text-warning fw-bold">Maximum attempts reached</span>
              ) : (
                <span className="text-success">Retake Available</span>
              )}
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {result.examId?.allowRetake !== false && (!result.examId?.maxAttempts || result.examId.maxAttempts === 0 || (result.attemptNumber || 1) < result.examId.maxAttempts) ? (
            <button
              type="button"
              className="btn btn-info fw-bold px-4 py-2 rounded-pill font-monospace d-flex align-items-center gap-2 shadow"
              onClick={() => setShowRetakeModal(true)}
            >
              <RefreshCw size={18} /> Take Test Again
            </button>
          ) : (
            <span className="badge bg-body-tertiary border text-muted px-3 py-2 font-monospace">
              Maximum attempts reached
            </span>
          )}

          {isPass && certificate && (
            <Link to="/student/certificates" className="btn btn-warning fw-bold px-4 py-2 rounded-pill">
              View Certificate
            </Link>
          )}
        </div>
      </div>

      {/* Retake Confirmation Modal */}
      <RetakeConfirmModal
        isOpen={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        onConfirm={handleStartRetake}
        assessmentTitle={result.examId?.title || 'Assessment'}
        previousAttempts={result.attemptNumber || 1}
        maxAttempts={result.examId?.maxAttempts || 3}
        loading={isStartingRetake}
      />

      {/* AI Modals */}
      <AICodeReviewModal
        isOpen={showAiCodeModal}
        onClose={() => setShowAiCodeModal(false)}
        codeData={selectedCodeData}
      />

      <AIStudyRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        resultData={result}
      />
    </div>
  );
};

export default ResultDetail;

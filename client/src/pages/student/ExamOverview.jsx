import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Award, BookOpen, Calendar, Clock, FileText, ShieldCheck } from 'lucide-react';
import API from '../../services/api';
import { buildExamSections } from '../../utils/examSections';
import ThemeToggle from '../../components/common/ThemeToggle';
import EmptyState from '../../components/common/EmptyState';
import '../../styles/student.css';

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not specified';

const ExamOverview = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError('');
        const [examResponse, assignmentResponse] = await Promise.all([
          API.get(`/exams/${examId}`),
          API.get('/exam-assignments/student'),
        ]);
        if (!active) return;
        const examData = examResponse.data.exam;
        setExam(examData);
        setAssignment((assignmentResponse.data.assignments || []).find((item) => {
          const assignedExamId = item.examId?._id || item.examId;
          return String(assignedExamId) === String(examData._id);
        }) || null);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Could not load assessment details. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchOverview();
    return () => { active = false; };
  }, [examId]);

  const sections = useMemo(() => buildExamSections(exam || {}), [exam]);
  const questionCount = exam?.questions?.length || 0;
  const codingCount = exam?.codingProblems?.length || 0;
  const totalItems = questionCount + codingCount;
  const duration = assignment?.duration || exam?.duration || 0;
  const startsAt = assignment?.startDate || exam?.startDate;
  const endsAt = assignment?.endDate || exam?.endDate;
  const now = new Date();
  const isUpcoming = startsAt && new Date(startsAt) > now;
  const isExpired = endsAt && new Date(endsAt) < now;
  const hasActiveAttempt = assignment?.attempt?.status === 'started';
  const attemptsExhausted = assignment?.attemptsRemaining != null && assignment.attemptsRemaining <= 0;

  if (loading) {
    return <main className="exam-overview-screen"><div className="exam-overview-shell"><div className="loading-panel" role="status"><div className="spinner-border text-primary mb-3" /><p className="text-muted mb-0">Loading assessment details…</p></div></div></main>;
  }

  if (error || !exam) {
    return <main className="exam-overview-screen"><div className="exam-overview-shell"><EmptyState icon={FileText} title="Assessment details unavailable" description={error || 'This assessment could not be found.'} actionLabel="Back to assessments" onAction={() => navigate('/student/exams')} /></div></main>;
  }

  return (
    <main className="exam-overview-screen">
      <div className="exam-overview-shell">
        <header className="exam-overview-header">
          <div>
            <Link to="/student/exams" className="exam-overview-back"><ArrowLeft size={16} /> Back to assessments</Link>
            <span className="exam-setup-eyebrow"><ShieldCheck size={16} /> Assessment overview</span>
            <h1>{exam.title}</h1>
            <p>{exam.description || 'Review the test instructions and question breakdown before starting.'}</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="exam-overview-layout">
          <div className="exam-overview-main">
            <section className="exam-overview-facts" aria-label="Assessment summary">
              <article><Clock size={19} /><span><small>Duration</small><strong>{duration} minutes</strong></span></article>
              <article><Award size={19} /><span><small>Total marks</small><strong>{exam.totalMarks} marks</strong></span></article>
              <article><BookOpen size={19} /><span><small>Questions</small><strong>{totalItems} total ({questionCount} MCQ · {codingCount} coding)</strong></span></article>
              <article><Calendar size={19} /><span><small>Schedule</small><strong>{formatDateTime(startsAt)} – {formatDateTime(endsAt)}</strong></span></article>
            </section>

            {exam.testInstructions && (
              <section className="exam-overview-card">
                <h2><FileText size={19} /> Test instructions</h2>
                <p className="exam-overview-instructions">{exam.testInstructions}</p>
              </section>
            )}

            <section className="exam-overview-card">
              <div className="exam-overview-section-heading">
                <div><h2>Section summary</h2><p>Questions and marks by section.</p></div>
              </div>
              <div className="table-responsive">
                <table className="table exam-overview-table align-middle mb-0">
                  <thead><tr><th>Section</th><th>Questions</th><th>Total marks</th></tr></thead>
                  <tbody>
                    {sections.map((section) => (
                      <tr key={section.id}>
                        <th scope="row">{section.label}</th>
                        <td>{section.items.length}</td>
                        <td>{section.items.reduce((sum, { item }) => sum + (Number(item.marks) || 0), 0)}</td>
                      </tr>
                    ))}
                    <tr className="exam-overview-total"><th scope="row">All sections</th><td>{totalItems}</td><td>{sections.reduce((sum, section) => sum + section.items.reduce((sectionSum, { item }) => sectionSum + (Number(item.marks) || 0), 0), 0)}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="exam-overview-card">
              <div className="exam-overview-section-heading">
                <div><h2>Question-wise marks</h2><p>Marks awarded for each question or coding problem.</p></div>
              </div>
              <div className="table-responsive">
                <table className="table exam-overview-table exam-overview-question-table align-middle mb-0">
                  <thead><tr><th>#</th><th>Question / problem</th><th>Section</th><th>Marks</th></tr></thead>
                  <tbody>
                    {sections.flatMap((section) => section.items.map(({ item, index }, sectionIndex) => (
                      <tr key={`${section.id}-${item._id}`}>
                        <td>{section.kind === 'coding' ? `C${sectionIndex + 1}` : `Q${index + 1}`}</td>
                        <td className="exam-overview-question-text">{item.questionText || item.title || 'Question'}</td>
                        <td>{section.label}</td>
                        <td>{Number(item.marks) || 0}</td>
                      </tr>
                    )))}
                    {totalItems === 0 && <tr><td colSpan="4" className="text-center text-muted py-4">No questions are available for this assessment.</td></tr>}
                  </tbody>
                </table>
              </div>
              {exam.negativeMarking && <p className="exam-overview-negative-note mb-0">Negative marking is enabled. Incorrect answers may reduce your score.</p>}
            </section>
          </div>

          <aside className="exam-overview-sidebar">
            <section className="exam-overview-card exam-overview-start-card">
              <span className="exam-setup-eyebrow"><ShieldCheck size={16} /> Ready when you are</span>
              <h2>{hasActiveAttempt ? 'Continue your test' : 'Before you begin'}</h2>
              <p>Next, review the exam rules and complete the camera, microphone, and screen checks. Your timer starts when the test attempt begins.</p>
              <ul>
                <li>{duration} minutes to complete the test</li>
                <li>{totalItems} questions · {exam.totalMarks} total marks</li>
                <li>Camera, microphone and screen sharing required</li>
              </ul>
              {isUpcoming ? (
                <button type="button" className="btn btn-primary w-100" disabled>Opens {formatDateTime(startsAt)}</button>
              ) : isExpired ? (
                <button type="button" className="btn btn-outline-danger w-100" disabled>Assessment expired</button>
              ) : attemptsExhausted && !hasActiveAttempt ? (
                <button type="button" className="btn btn-secondary w-100" disabled>Attempts exhausted</button>
              ) : (
                <Link to={`/student/exam/${exam._id}/attempt`} className="btn btn-primary w-100">
                  {hasActiveAttempt ? 'Resume test' : 'Take test'} <ArrowRight size={17} />
                </Link>
              )}
              <small>Do not close this page during the assessment.</small>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default ExamOverview;

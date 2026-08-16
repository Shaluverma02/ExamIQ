import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Printer, FileText, Download, CheckCircle, HelpCircle, X, Shield, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PrintableQuestionPaperModal = ({ isOpen, onClose, examId }) => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const printAreaRef = useRef(null);

  useEffect(() => {
    if (isOpen && examId) {
      fetchExamDetails();
    }
  }, [isOpen, examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/exams/${examId}`);
      setExam(res.data.exam || res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exam details for PDF generation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setDownloading(true);
      toast.info('Generating high-resolution Printable Question Paper PDF...');

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `${(exam?.title || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_')}_QuestionPaper.pdf`;
      pdf.save(fileName);

      toast.success('Printable Question Paper PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content glass-card text-light border border-secondary shadow-lg rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-dark border-bottom border-secondary px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                <FileText size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-extrabold text-light m-0">
                  Printable Assessment Question Paper Export
                </h5>
                <p className="text-muted small m-0">Official A4 format suitable for offline examinations & answer keys</p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="form-check form-switch me-3 text-light small">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  id="includeAnswersToggle"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                />
                <label className="form-check-input-label cursor-pointer" htmlFor="includeAnswersToggle">
                  Show Answer Keys & Solutions
                </label>
              </div>

              <button type="button" className="btn-close btn-close-white" onClick={onClose} />
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-secondary bg-opacity-20" style={{ minHeight: '60vh' }}>
            {loading || !exam ? (
              <div className="text-center py-5 text-light">
                <div className="spinner-border text-primary mb-2" />
                <div>Preparing Official Question Paper PDF...</div>
              </div>
            ) : (
              <div className="d-flex justify-content-center">
                {/* Official A4 Printable Container */}
                <div
                  ref={printAreaRef}
                  className="bg-white text-dark p-5 rounded shadow-sm border"
                  style={{
                    width: '100%',
                    maxWidth: '820px',
                    fontFamily: 'serif',
                    lineHeight: 1.5,
                  }}
                >
                  {/* Header Box */}
                  <div className="text-center border-bottom border-2 border-dark pb-3 mb-4">
                    <h3 className="fw-bold text-uppercase m-0" style={{ letterSpacing: 1 }}>
                      EXAMIQ NATIONAL ASSESSMENT PORTAL
                    </h3>
                    <h5 className="fw-semibold text-secondary mb-2">END-SEMESTER OFFICIAL EXAMINATION</h5>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary small fw-bold">
                      <span>COURSE / CATEGORY: {exam.category || 'GENERAL'}</span>
                      <span>DATE: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Metadata Table */}
                  <table className="table table-bordered border-dark text-center align-middle mb-4" style={{ fontSize: '0.9rem' }}>
                    <tbody>
                      <tr>
                        <th className="bg-light w-25">EXAM TITLE</th>
                        <td className="fw-bold text-uppercase">{exam.title}</td>
                        <th className="bg-light w-25">DURATION</th>
                        <td className="fw-bold">{exam.duration || 60} MINS</td>
                      </tr>
                      <tr>
                        <th className="bg-light">TOTAL MARKS</th>
                        <td className="fw-bold">{exam.totalMarks || 100} MARKS</td>
                        <th className="bg-light">PASS MARKS</th>
                        <td className="fw-bold">{exam.passMarks || Math.round((exam.totalMarks || 100) * 0.4)} MARKS</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Candidate Information Grid */}
                  <div className="border border-dark p-3 rounded mb-4" style={{ fontSize: '0.85rem' }}>
                    <div className="row g-2">
                      <div className="col-6">CANDIDATE NAME: ____________________________</div>
                      <div className="col-6">ROLL NUMBER: ____________________________</div>
                      <div className="col-6">CENTER / BATCH: ____________________________</div>
                      <div className="col-6">INVIGILATOR SIGNATURE: __________________</div>
                    </div>
                  </div>

                  {/* General Instructions */}
                  <div className="mb-4">
                    <h6 className="fw-bold border-bottom border-dark pb-1 mb-2">GENERAL INSTRUCTIONS:</h6>
                    <ol className="small ps-3 m-0" style={{ fontSize: '0.85rem' }}>
                      <li>All questions are compulsory. Marks for each question are indicated against it.</li>
                      <li>For Objective MCQs, select exactly one correct option. Darken the corresponding circle.</li>
                      <li>For Coding Problems, write optimal algorithmic logic considering memory and time complexity bounds.</li>
                      <li>Rough sheets are provided at the end of the question paper booklet.</li>
                    </ol>
                  </div>

                  {/* SECTION A: OBJECTIVE MCQs */}
                  {exam.questions && exam.questions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="fw-bold border-bottom border-2 border-dark pb-1 mb-3 text-uppercase">
                        SECTION A: OBJECTIVE MULTIPLE CHOICE QUESTIONS ({exam.questions.length} Items)
                      </h5>

                      {exam.questions.map((q, index) => (
                        <div key={q._id || index} className="mb-4 pb-2 border-bottom border-light">
                          <div className="fw-bold d-flex justify-content-between">
                            <span>Q{index + 1}. {q.title || q.questionText || 'Multiple Choice Question'}</span>
                            <span className="font-monospace small">[{q.marks || 1} Mark]</span>
                          </div>

                          {q.codeSnippet && (
                            <pre className="bg-light p-2 rounded border small my-2 font-monospace">{q.codeSnippet}</pre>
                          )}

                          <div className="row g-2 mt-2" style={{ fontSize: '0.9rem' }}>
                            {(q.options || []).map((opt, optIdx) => {
                              const optLetter = String.fromCharCode(65 + optIdx);
                              const isCorrect = includeAnswers && (q.correctOption === optIdx || q.correctOptions?.includes(optIdx) || q.correctAnswer === opt);
                              return (
                                <div key={optIdx} className="col-6">
                                  <div
                                    className={`p-2 rounded border ${
                                      isCorrect ? 'bg-success bg-opacity-20 border-success fw-bold text-success' : 'bg-light'
                                    }`}
                                  >
                                    <strong>({optLetter})</strong> {typeof opt === 'object' ? opt.text : opt}
                                    {isCorrect && <span className="ms-2 badge bg-success">✓ Correct Key</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {includeAnswers && q.explanation && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 border border-warning rounded small text-dark">
                              <strong>Solution Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SECTION B: PROGRAMMING & ALGORITHMIC CHALLENGES */}
                  {exam.codingProblems && exam.codingProblems.length > 0 && (
                    <div className="mb-4">
                      <h5 className="fw-bold border-bottom border-2 border-dark pb-1 mb-3 text-uppercase">
                        SECTION B: PROGRAMMING & ALGORITHM CHALLENGES ({exam.codingProblems.length} Problems)
                      </h5>

                      {exam.codingProblems.map((cp, cpIdx) => (
                        <div key={cp._id || cpIdx} className="mb-4 pb-3 border-bottom border-secondary">
                          <div className="fw-bold d-flex justify-content-between mb-1">
                            <span>Problem {cpIdx + 1}: {cp.title}</span>
                            <span className="font-monospace small">[{cp.marks || 10} Marks]</span>
                          </div>
                          <p className="small mb-2">{cp.description}</p>

                          <div className="row g-2 mb-2 small font-monospace">
                            <div className="col-6 bg-light p-2 rounded border">
                              <strong>Sample Input:</strong>
                              <pre className="m-0 text-success">{cp.sampleInput || '5\n1 2 3 4 5'}</pre>
                            </div>
                            <div className="col-6 bg-light p-2 rounded border">
                              <strong>Sample Output:</strong>
                              <pre className="m-0 text-primary">{cp.sampleOutput || '15'}</pre>
                            </div>
                          </div>

                          {includeAnswers && cp.solutionCode && (
                            <div className="p-2 bg-dark text-success rounded border font-monospace small">
                              <strong>Optimal Reference Solution:</strong>
                              <pre className="m-0 text-success">{cp.solutionCode}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer End of Paper */}
                  <div className="text-center border-top border-dark pt-3 mt-4 text-muted small font-monospace">
                    *** END OF QUESTION PAPER • EXAMIQ PROCTORED EXAMINATION SYSTEM ***
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer border-top border-secondary px-4 py-3 justify-content-between">
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
              Close Preview
            </button>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-info fw-bold rounded-pill px-4 d-flex align-items-center gap-2"
                onClick={handlePrint}
                disabled={loading}
              >
                <Printer size={18} /> Print Question Paper
              </button>

              <button
                className="btn btn-success fw-bold rounded-pill px-4 d-flex align-items-center gap-2 shadow"
                onClick={handleDownloadPdf}
                disabled={downloading || loading}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={18} /> Download Printable PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableQuestionPaperModal;

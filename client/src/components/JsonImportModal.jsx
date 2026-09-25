import React, { useState } from 'react';
import { questionAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  Upload,
  FileJson,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

const SAMPLE_JSON_DATA = [
  {
    question: "What is the time complexity of Binary Search algorithm?",
    type: "single",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    explanation: "Binary search repeatedly divides the search space into half.",
    difficulty: "medium",
    category: "Data Structures",
    topic: "Algorithms",
    marks: 2,
    negativeMarks: 0
  },
  {
    question: "Which of the following data structures follow First-In-First-Out (FIFO)?",
    type: "single",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correctAnswer: "Queue",
    explanation: "Queue inserts elements at the rear and removes from the front (FIFO).",
    difficulty: "easy",
    category: "Data Structures",
    topic: "Queue",
    marks: 1,
    negativeMarks: 0
  },
  {
    question: "Select all prime numbers from the given list:",
    type: "multiple",
    options: ["2", "4", "5", "9"],
    correctAnswer: ["2", "5"],
    explanation: "2 and 5 are prime numbers as they are divisible only by 1 and themselves.",
    difficulty: "medium",
    category: "Mathematics",
    topic: "Number Theory",
    marks: 2,
    negativeMarks: 0.5
  },
  {
    question: "JavaScript is a statically-typed programming language.",
    type: "boolean",
    correctAnswer: false,
    explanation: "JavaScript is dynamically-typed; variable types are checked at runtime.",
    difficulty: "easy",
    category: "JavaScript",
    topic: "Basics",
    marks: 1,
    negativeMarks: 0
  }
];

const SAMPLE_CODING_JSON = [
  {
    type: "coding",
    title: "Reverse Words in a String",
    description: "Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters.",
    difficulty: "medium",
    category: "Data Structures",
    topic: "Strings",
    marks: 10,
    timeLimit: 2,
    memoryLimit: 128,
    inputFormat: "A single line containing space-separated words",
    outputFormat: "A single line with reversed words",
    testCases: [
      { input: "the sky is blue", expectedOutput: "blue is sky the", isHidden: false },
      { input: " hello world ", expectedOutput: "world hello", isHidden: true }
    ]
  },
  {
    type: "coding",
    title: "Find Maximum Element in Array",
    description: "Given N integers, find and print the maximum integer among them.",
    difficulty: "easy",
    category: "Algorithms",
    topic: "Arrays",
    marks: 5,
    timeLimit: 2,
    memoryLimit: 128,
    inputFormat: "First line N, second line N space-separated integers",
    outputFormat: "Single integer representing the maximum value",
    testCases: [
      { input: "5\n1 9 3 14 2", expectedOutput: "14", isHidden: false },
      { input: "3\n-5 -2 -10", expectedOutput: "-2", isHidden: true }
    ]
  }
];

const JsonImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Response Data from Server
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const jsonStr = JSON.stringify(SAMPLE_JSON_DATA, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mcq_questions_template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info('MCQ JSON template downloaded');
  };

  const handleDownloadTemplateCoding = () => {
    const jsonStr = JSON.stringify(SAMPLE_CODING_JSON, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coding_problems_template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info('Coding JSON template downloaded');
  };

  const handleDownloadTemplateCsv = () => {
    const csvContent =
      'question,type,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,topic,marks,explanation\n' +
      '"What is Binary Search?",single,O(1),O(log n),O(n),O(n log n),O(log n),medium,Data Structures,Algorithms,2,"Halves search space"\n' +
      '"Queue follows FIFO structure",boolean,True,False,,,True,easy,Data Structures,Queue,1,"First in first out"';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info('CSV import template downloaded');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const name = selectedFile.name.toLowerCase();
      if (!name.endsWith('.json') && !name.endsWith('.csv')) {
        toast.error('Only .json and .csv files are supported');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5 MB limit');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleValidateFile = async () => {
    if (!file) {
      toast.warning('Please select a JSON file to upload');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'true');
      formData.append('skipDuplicates', skipDuplicates ? 'true' : 'false');

      const res = await questionAPI.importJson(formData);
      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to validate JSON file');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'false');
      formData.append('skipDuplicates', skipDuplicates ? 'true' : 'false');

      const res = await questionAPI.importJson(formData);
      setImportResult(res.data);
      setStep(3);
      toast.success(`${res.data.imported} question(s) imported successfully!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content card text-body border shadow-lg">
          {/* Header */}
          <div className="modal-header border">
            <div className="d-flex align-items-center gap-2">
              <FileJson className="text-primary" size={24} />
              <h5 className="modal-title fw-bold">Bulk Question Import (JSON)</h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Stepper Indicator */}
          <div className="px-4 py-2 border-bottom border bg-body-tertiary bg-opacity-50">
            <div className="d-flex align-items-center justify-content-center gap-2 small">
              <span className={`badge ${step >= 1 ? 'bg-primary' : 'bg-secondary'} px-3 py-1 font-monospace`}>
                1. Upload JSON
              </span>
              <span className="text-muted">â”€â”€â”€</span>
              <span className={`badge ${step >= 2 ? 'bg-primary' : 'bg-secondary'} px-3 py-1 font-monospace`}>
                2. Preview & Validate
              </span>
              <span className="text-muted">â”€â”€â”€</span>
              <span className={`badge ${step >= 3 ? 'bg-success' : 'bg-secondary'} px-3 py-1 font-monospace`}>
                3. Import Result
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ minHeight: '380px' }}>
            {/* STEP 1: UPLOAD FILE */}
            {step === 1 && (
              <div>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div>
                    <h6 className="fw-bold mb-1">Upload Question Bank JSON File</h6>
                    <p className="text-muted small m-0">
                      Upload a `.json` file containing questions adhering to the portal schema. Max file size: 5 MB.
                    </p>
                  </div>

                  <div className="d-flex gap-2 flex-wrap flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-outline-info btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                      onClick={handleDownloadTemplate}
                    >
                      <Download size={15} /> MCQ JSON Template
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                      onClick={handleDownloadTemplateCoding}
                    >
                      <Download size={15} /> Coding JSON Template
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                      onClick={handleDownloadTemplateCsv}
                    >
                      <Download size={15} /> CSV Template
                    </button>
                  </div>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border rounded-3 p-5 text-center bg-body-tertiary bg-opacity-20 mb-4">
                  <Upload size={48} className="text-primary mb-3 opacity-75" />

                  <h6 className="fw-bold text-body mb-2">
                    {file ? file.name : 'Drag & drop your .json file here'}
                  </h6>

                  {file ? (
                    <div className="badge bg-secondary font-monospace mb-3">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  ) : (
                    <p className="text-secondary small mb-3">Supports MCQ, Multiple Correct, and True/False questions</p>
                  )}

                  <div>
                    <label className="btn btn-primary btn-sm px-4 rounded-pill fw-bold" style={{ cursor: 'pointer' }}>
                      Choose JSON File
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="d-none"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-body-tertiary border small text-muted">
                  <div className="fw-bold text-body mb-1">Supported JSON Fields:</div>
                  <code>question</code> (or <code>questionText</code>), <code>type</code> (single, multiple, boolean), <code>options</code> (array), <code>correctAnswer</code>, <code>difficulty</code>, <code>category</code>, <code>topic</code>, <code>marks</code>, <code>explanation</code>.
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & VALIDATE */}
            {step === 2 && previewData && (
              <div>
                {/* Stats Header */}
                <div className="row g-3 mb-3">
                  <div className="col-6 col-md-3">
                    <div className="border rounded-3 p-3 text-center bg-body-tertiary">
                      <div className="text-muted small">Total Questions</div>
                      <div className="fs-4 fw-bold text-body">{previewData.total}</div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border-success border-opacity-50 rounded-3 p-3 text-center bg-success bg-opacity-10">
                      <div className="text-success small fw-semibold">Valid Questions</div>
                      <div className="fs-4 fw-bold text-success">{previewData.validCount}</div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border-danger border-opacity-50 rounded-3 p-3 text-center bg-danger bg-opacity-10">
                      <div className="text-danger small fw-semibold">Invalid / Errors</div>
                      <div className="fs-4 fw-bold text-danger">{previewData.invalidCount}</div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border-warning border-opacity-50 rounded-3 p-3 text-center bg-warning bg-opacity-10">
                      <div className="text-warning small fw-semibold">Duplicates Detected</div>
                      <div className="fs-4 fw-bold text-warning">{previewData.duplicates}</div>
                    </div>
                  </div>
                </div>

                {/* Duplicate Action Checkbox */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded-3 bg-body-tertiary border">
                  <div className="form-check m-0 small ms-2">
                    <input
                      type="checkbox"
                      className="form-check-input bg-secondary border-0"
                      id="skipDupCheck"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                    />
                    <label className="form-check-label text-body fw-medium" htmlFor="skipDupCheck">
                      Skip duplicate questions during import ({previewData.duplicates} detected)
                    </label>
                  </div>

                  <span className="text-muted small me-2">
                    Valid questions to be imported: <strong>{skipDuplicates ? Math.max(0, previewData.validCount - previewData.duplicates) : previewData.validCount}</strong>
                  </span>
                </div>

                {/* Preview Table */}
                <div className="table-responsive border rounded-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table className="table table-hover align-middle m-0 small">
                    <thead>
                      <tr className="text-muted text-uppercase">
                        <th style={{ width: 40 }}>#</th>
                        <th>Question Text</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Category / Topic</th>
                        <th>Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview?.map((item) => {
                        const isValid = item.status === 'valid';
                        const isDup = item.status === 'duplicate';

                        return (
                          <tr key={item.index} className={!isValid && !isDup ? 'bg-danger bg-opacity-10' : ''}>
                            <td>{item.index}</td>
                            <td className="fw-semibold text-body text-truncate" style={{ maxWidth: 300 }}>
                              {item.questionText}
                            </td>
                            <td><span className="badge bg-secondary font-monospace">{item.type}</span></td>
                            <td>
                              <span className={`badge ${item.difficulty === 'easy' ? 'bg-success' : item.difficulty === 'hard' ? 'bg-danger' : 'bg-warning'}`}>
                                {item.difficulty}
                              </span>
                            </td>
                            <td className="text-muted">{item.category} / {item.topic}</td>
                            <td>
                              {isValid ? (
                                <span className="badge bg-success d-inline-flex align-items-center gap-1">
                                  <CheckCircle2 size={12} /> Valid
                                </span>
                              ) : isDup ? (
                                <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                                  <AlertTriangle size={12} /> Duplicate
                                </span>
                              ) : (
                                <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                                  <XCircle size={12} /> {item.message}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 3: IMPORT RESULT */}
            {step === 3 && importResult && (
              <div className="text-center py-4">
                <div className="rounded-circle bg-success bg-opacity-20 text-success p-4 d-inline-block mb-3">
                  <CheckCircle2 size={48} />
                </div>

                <h4 className="fw-bold text-body mb-1">Import Process Complete!</h4>
                <p className="text-muted small mb-4">
                  Questions have been validated and inserted into the Question Bank.
                </p>

                <div className="row justify-content-center g-3 mb-4">
                  <div className="col-12 col-md-3">
                    <div className="border-success rounded-3 p-3 bg-success bg-opacity-10">
                      <div className="text-success small fw-semibold">Successfully Imported</div>
                      <div className="fs-3 fw-bold text-success">{importResult.imported}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-3">
                    <div className="border rounded-3 p-3 bg-body-tertiary">
                      <div className="text-muted small fw-semibold">Skipped / Invalid</div>
                      <div className="fs-3 fw-bold text-body">{importResult.skipped}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-3">
                    <div className="border-warning border-opacity-50 rounded-3 p-3 bg-warning bg-opacity-10">
                      <div className="text-warning small fw-semibold">Duplicates Detected</div>
                      <div className="fs-3 fw-bold text-warning">{importResult.duplicates}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border">
            {step === 1 && (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-bold px-4 d-flex align-items-center gap-2"
                  disabled={!file || loading}
                  onClick={handleValidateFile}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      Validate JSON <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="me-1" /> Re-upload File
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-bold px-4 d-flex align-items-center gap-2"
                  disabled={loading || (previewData && previewData.validCount === 0)}
                  onClick={handleExecuteImport}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      Import Questions <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetState}>
                  <RefreshCw size={15} className="me-1" /> Import Another File
                </button>
                <button type="button" className="btn btn-primary btn-sm fw-bold px-4" onClick={onClose}>
                  View Question Bank
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonImportModal;


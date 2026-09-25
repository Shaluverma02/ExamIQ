import React, { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Cpu,
  Layers,
  Send,
  AlertTriangle,
  Clock,
  Code2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

const LANGUAGES = [
  {
    label: 'JavaScript',
    value: 'javascript',
    monacoLang: 'javascript',
  },
  {
    label: 'Python',
    value: 'python',
    monacoLang: 'python',
  },
  {
    label: 'C++',
    value: 'cpp',
    monacoLang: 'cpp',
  },
  {
    label: 'C',
    value: 'c',
    monacoLang: 'c',
  },
  {
    label: 'Java',
    value: 'java',
    monacoLang: 'java',
  },
];

const STARTER_CODE = {
  javascript: `// Write your solution here

function solution(input) {
  const lines = input.trim().split('\\n');

  const n = parseInt(lines[0]);
  const arr = lines[1].split(' ').map(Number);

  let sum = 0;

  for (const x of arr) {
    sum += x;
  }

  return sum;
}

const fs = require('fs');

const input = fs.readFileSync(0, 'utf8');

console.log(solution(input));`,

  python: `# Write your solution here

import sys

def solution():
    data = sys.stdin.read().strip().split()

    if not data:
        return

    n = int(data[0])
    arr = list(map(int, data[1:n + 1]))

    total = sum(arr)

    print(total)

solution()`,

  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;

    vector<int> arr(n);

    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    int sum = 0;

    for (int x : arr) {
        sum += x;
    }

    cout << sum << endl;

    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    int sum = 0;

    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);

        sum += x;
    }

    printf("%d\\n", sum);

    return 0;
}`,

  java: `import java.util.Scanner;

public class Solution {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int sum = 0;

        for (int i = 0; i < n; i++) {
            sum += sc.nextInt();
        }

        System.out.println(sum);

        sc.close();
    }
}`,
};

const normalizeOutput = (value) => {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
};

const CodingArena = () => {
  const [warningCount, setWarningCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  const autoSubmittingRef = useRef(false);
  const violationLockRef = useRef(false);

  const [language, setLanguage] = useState('javascript');

  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [problemDetails, setProblemDetails] = useState(null);
  const [testCases, setTestCases] = useState([]);

  const [code, setCode] = useState(STARTER_CODE.javascript);

  const [customInput, setCustomInput] = useState('');

  const [output, setOutput] = useState('');
  const [outputStatus, setOutputStatus] = useState('');

  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingProblem, setLoadingProblem] = useState(false);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submissionResult, setSubmissionResult] = useState(null);

  /*
   * ---------------------------------------------------------
   * Load Coding Problems
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoadingProblems(true);

      const res = await API.get('/coding');

      const list = res.data?.problems || [];

      setProblems(list);

      if (list.length > 0) {
        setSelectedProblem(list[0]);
      }
    } catch (error) {
      console.error('Fetch coding problems error:', error);

      toast.error(
        error.response?.data?.message ||
        'Failed to load coding problems'
      );
    } finally {
      setLoadingProblems(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Load Selected Problem Details
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedProblem?._id) return;

    fetchProblemDetails(selectedProblem._id);
  }, [selectedProblem]);

  const fetchProblemDetails = async (problemId) => {
    try {
      setLoadingProblem(true);

      setOutput('');
      setOutputStatus('');
      setSubmissionResult(null);

      const res = await API.get(`/coding/${problemId}`);

      const problem = res.data?.problem || selectedProblem;
      const cases = res.data?.testCases || [];

      setProblemDetails(problem);
      setTestCases(cases);

      /*
       * Set default custom input
       * from first public test case.
       */

      const publicCase = cases.find(
        (tc) => !tc.isHidden
      );

      if (publicCase) {
        setCustomInput(publicCase.input || '');
      } else {
        setCustomInput('');
      }

      /*
       * Load starter code for selected language.
       */

      const starter = problem?.starterCode?.find(
        (item) =>
          item.language?.toLowerCase() ===
          language.toLowerCase()
      );

      if (starter?.code) {
        setCode(starter.code);
      } else {
        setCode(
          STARTER_CODE[language] || ''
        );
      }
    } catch (error) {
      console.error(
        'Fetch coding problem details error:',
        error
      );

      toast.error(
        error.response?.data?.message ||
        'Failed to load problem details'
      );
    } finally {
      setLoadingProblem(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Change Language
   * ---------------------------------------------------------
   */

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    const starter =
      problemDetails?.starterCode?.find(
        (item) =>
          item.language?.toLowerCase() ===
          newLanguage.toLowerCase()
      );

    if (starter?.code) {
      setCode(starter.code);
    } else {
      setCode(
        STARTER_CODE[newLanguage] || ''
      );
    }

    setOutput('');
    setOutputStatus('');
    setSubmissionResult(null);
  };

  /*
   * ---------------------------------------------------------
   * Run Code
   * ---------------------------------------------------------
   */

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.warning(
        'Please write some code before running.'
      );
      return;
    }

    setRunning(true);
    setOutput('');
    setOutputStatus('');

    try {
      const res = await API.post('/coding/run', {
        language,
        sourceCode: code,
        input: customInput,
        timeLimit: (problemDetails?.timeLimit || 2) * 1000,
        memoryLimit: problemDetails?.memoryLimit || 128,
      });

      if (!res.data?.success) {
        setOutput(
          res.data?.message ||
          'Code execution failed.'
        );

        setOutputStatus('error');

        return;
      }

      const result = res.data.result;

      const rawOutput = result?.output || '';

      setOutput(
        rawOutput || '(No output)'
      );

      if (result?.status === 'Accepted') {
        setOutputStatus('success');
      } else {
        setOutputStatus('error');
      }
    } catch (error) {
      console.error(
        'Run code error:',
        error
      );

      const message =
        error.response?.data?.message ||
        'Code execution failed.';

      setOutput(message);
      setOutputStatus('error');

      toast.error(message);
    } finally {
      setRunning(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Submit Code
   * ---------------------------------------------------------
   */

  const handleSubmitCode = async () => {
    if (!selectedProblem?._id) {
      toast.warning(
        'Please select a coding problem.'
      );
      return;
    }

    if (!code.trim()) {
      toast.warning(
        'Please write your solution first.'
      );
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);
    setOutput('');
    setOutputStatus('');

    try {
      const res = await API.post('/coding/submit', {
        problemId: selectedProblem._id,
        language,
        sourceCode: code,

        /*
         * If you later use this component inside
         * an exam, pass examId here.
         */
        examId: null,
      });

      if (!res.data?.success) {
        toast.error(
          res.data?.message ||
          'Submission failed.'
        );

        return;
      }

      const submission =
        res.data.submission;

      setSubmissionResult(submission);

      if (submission.status === 'Accepted') {
        setOutputStatus('success');

        setOutput(
          `Accepted\n\nPassed: ${submission.passedTestCases}/${submission.totalTestCases}\nScore: ${submission.score}/${problemDetails?.marks || 10}`
        );

        toast.success(
          'ðŸŽ‰ Solution Accepted!'
        );
      } else {
        setOutputStatus('wrong');

        setOutput(
          `Status: ${submission.status}\n\nPassed: ${submission.passedTestCases}/${submission.totalTestCases}\nScore: ${submission.score}/${problemDetails?.marks || 10}`
        );

        toast.warning(
          `Submission: ${submission.status}`
        );
      }
    } catch (error) {
      console.error(
        'Submit code error:',
        error
      );

      const message =
        error.response?.data?.message ||
        'Submission failed.';

      setOutput(message);
      setOutputStatus('error');

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Reset Code
   * ---------------------------------------------------------
   */

  const handleResetCode = () => {
    const starter =
      problemDetails?.starterCode?.find(
        (item) =>
          item.language?.toLowerCase() ===
          language.toLowerCase()
      );

    if (starter?.code) {
      setCode(starter.code);
    } else {
      setCode(
        STARTER_CODE[language] || ''
      );
    }

    setOutput('');
    setOutputStatus('');
    setSubmissionResult(null);

    toast.info('Code reset.');
  };

  /*
   * ---------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------
   */

  const publicTestCases = useMemo(() => {
    return testCases.filter(
      (tc) => !tc.isHidden
    );
  }, [testCases]);

  const currentLanguage = LANGUAGES.find(
    (item) => item.value === language
  );

  /*
   * ---------------------------------------------------------
   * Proctoring & Assessment Mode
   * ---------------------------------------------------------
   */

  const startAssessment = async () => {
    try {
      if (!selectedProblem) {
        toast.error('Please select a problem first.');
        return;
      }

      const res = await API.post('/coding/assessment/start', {
        problemId: selectedProblem._id
      });
      
      const session = res.data.session;

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      setAssessmentStarted(true);
      setWarningCount(session.warningCount || 0);

      if (session.warningCount >= 4 || session.status === 'terminated') {
          toast.error('Assessment was already terminated due to violations.');
          autoSubmittingRef.current = true;
          handleSubmitCode();
          return;
      }

      toast.success('Assessment started in fullscreen mode');
    } catch (error) {
      toast.error('Failed to start the assessment. Fullscreen permission might be required.');
    }
  };

  const handleViolation = async (message) => {
    if (!assessmentStarted) return;
    if (autoSubmittingRef.current) return;
    if (violationLockRef.current) return;

    violationLockRef.current = true;

    setTimeout(() => {
      violationLockRef.current = false;
    }, 1000);

    try {
      const res = await API.post('/coding/assessment/violation', {
        problemId: selectedProblem._id,
        message
      });

      const { warningCount: serverCount, status } = res.data;

      setWarningCount(serverCount);
      setWarningMessage(message);

      if (status === 'terminated' || serverCount >= 4) {
        autoSubmittingRef.current = true;

        toast.error(
          'Maximum warnings exceeded. Assessment is being submitted automatically.'
        );

        setTimeout(() => {
          handleSubmitCode();
        }, 1000);

        return;
      }

      toast.warning(`Warning ${serverCount}/3: ${message}`);
    } catch (err) {
      console.error(err);
      // Fallback local logic
      const nextCount = warningCount + 1;
      setWarningCount(nextCount);
      setWarningMessage(message);

      if (nextCount >= 4) {
        autoSubmittingRef.current = true;
        toast.error('Maximum warnings exceeded. Assessment is being submitted automatically.');
        setTimeout(() => {
          handleSubmitCode();
        }, 1000);
        return;
      }

      toast.warning(`Warning ${nextCount}/3: ${message}`);
    }

    setTimeout(async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (error) {}
      }
    }, 500);
  };

  useEffect(() => {
    if (!assessmentStarted) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation('You exited fullscreen mode.');
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('You switched to another tab or application.');
      }
    };

    const onBlur = () => {
      handleViolation('Assessment window lost focus.');
    };

    const preventCopyPaste = (e) => {
      e.preventDefault();
      toast.warning('Copy, paste and cut are disabled during assessment.');
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      toast.warning('Right-click is disabled during assessment.');
    };

    const preventShortcuts = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        toast.warning('Keyboard shortcuts are disabled during assessment.');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventShortcuts);
    };
  }, [assessmentStarted, warningCount]);

  /*
   * ---------------------------------------------------------
   * Loading State
   * ---------------------------------------------------------
   */

  if (loadingProblems) {
    return (
      <div className="text-center text-body py-5">
        <RefreshCw
          size={30}
          className="spinner-border"
        />

        <div className="mt-3">
          Loading coding problems...
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * No Problems
   * ---------------------------------------------------------
   */

  if (!problems.length) {
    return (
      <div className="card p-5 text-center text-body">
        <Code2
          size={50}
          className="text-info mb-3"
        />

        <h4>
          No Coding Problems Available
        </h4>

        <p className="text-muted">
          Faculty/Admin needs to add coding
          problems to the question bank first.
        </p>

        <button
          className="btn btn-primary"
          onClick={fetchProblems}
        >
          <RefreshCw size={16} className="me-2" />
          Refresh
        </button>
      </div>
    );
  }



  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <div className="practice-ide-playground">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

        <div>
          <h3 className="fw-bold text-body m-0 d-flex align-items-center gap-2">

            <div className="p-2 bg-primary bg-opacity-20 text-primary rounded-3">
              <Cpu size={26} />
            </div>

            Coding Arena
          </h3>

          <p className="text-muted small m-0 mt-1">
            Practice coding problems with real-time
            code execution.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">

          {/* Assessment Mode UI */}
          {assessmentStarted && (
            <div className="d-flex align-items-center gap-2 me-3">
              <AlertTriangle
                size={18}
                className={
                  warningCount > 0
                    ? 'text-warning'
                    : 'text-success'
                }
              />
              <span
                className={`badge ${
                  warningCount > 0
                    ? 'bg-warning text-dark'
                    : 'bg-success'
                }`}
              >
                Warnings: {warningCount}/3
              </span>
            </div>
          )}

          {!assessmentStarted ? (
            <button
              className="btn btn-sm btn-danger fw-bold rounded-pill px-3 me-2"
              onClick={startAssessment}
            >
              Start Assessment
            </button>
          ) : (
            <span className="badge bg-danger rounded-pill px-3 py-2 me-2">
              Assessment Mode
            </span>
          )}

          {/* Language */}

          <select
            className="form-select form-select-sm bg-dark text-body border font-monospace"
            value={language}
            onChange={(e) =>
              handleLanguageChange(
                e.target.value
              )
            }
            style={{
              width: '150px',
              borderRadius: '8px',
            }}
          >
            {LANGUAGES.map((lang) => (
              <option
                key={lang.value}
                value={lang.value}
              >
                {lang.label}
              </option>
            ))}
          </select>

          {/* Reset */}

          <button
            className="btn btn-secondary btn-sm rounded-pill d-flex align-items-center gap-2"
            onClick={handleResetCode}
            disabled={
              running || submitting
            }
          >
            <RefreshCw size={15} />
            Reset
          </button>

          {/* Run */}

          <button
            className="btn btn-primary fw-bold btn-sm px-4 d-flex align-items-center gap-2 rounded-pill"
            onClick={handleRunCode}
            disabled={
              running || submitting
            }
          >
            {running ? (
              <RefreshCw
                size={16}
                className="spinner-border"
              />
            ) : (
              <Play size={16} />
            )}

            {running
              ? 'Running...'
              : 'Run Code'}
          </button>

          {/* Submit */}

          <button
            className="btn btn-success fw-bold btn-sm px-4 d-flex align-items-center gap-2 rounded-pill"
            onClick={handleSubmitCode}
            disabled={
              running || submitting
            }
          >
            {submitting ? (
              <RefreshCw
                size={16}
                className="spinner-border"
              />
            ) : (
              <Send size={16} />
            )}

            {submitting
              ? 'Submitting...'
              : 'Submit'}
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="row g-4">

        {/* ===================================================
            LEFT SIDE
        ==================================================== */}

        <div className="col-12 col-lg-5 col-xl-4">

          <div className="card p-4 h-100 border">

            <h6 className="fw-bold text-body mb-3 d-flex align-items-center gap-2">

              <Layers
                size={18}
                className="text-primary"
              />

              Coding Problems
            </h6>

            {/* Problem List */}

            <div className="d-flex flex-column gap-2 mb-4">

              {problems.map((problem) => {

                const isSelected =
                  selectedProblem?._id ===
                  problem._id;

                return (
                  <button
                    key={problem._id}
                    className={`btn btn-sm text-start d-flex justify-content-between align-items-center rounded-3 px-3 py-3 ${isSelected
                      ? 'bg-primary text-white fw-bold border-0'
                      : 'bg-dark text-body border'
                      }`}
                    onClick={() =>
                      setSelectedProblem(
                        problem
                      )
                    }
                  >

                    <div className="d-flex align-items-center gap-2">

                      <Code2 size={15} />

                      <span>
                        {problem.title}
                      </span>

                    </div>

                    <span
                      className={`badge ${problem.difficulty ===
                        'easy'
                        ? 'bg-success'
                        : problem.difficulty ===
                          'medium'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                        }`}
                    >
                      {problem.difficulty}
                    </span>

                  </button>
                );
              })}
            </div>

            {/* Problem Details */}

            {loadingProblem ? (
              <div className="text-center text-muted py-4">

                <RefreshCw
                  size={24}
                  className="spinner-border"
                />

                <div className="mt-2">
                  Loading problem...
                </div>

              </div>
            ) : (
              problemDetails && (
                <div className="pt-3 border-top border">

                  <h5 className="fw-bold text-info mb-2">
                    {problemDetails.title}
                  </h5>

                  {/* Difficulty */}

                  <div className="d-flex gap-2 mb-3">

                    <span
                      className={`badge ${problemDetails.difficulty ===
                        'easy'
                        ? 'bg-success'
                        : problemDetails.difficulty ===
                          'medium'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                        }`}
                    >
                      {problemDetails.difficulty}
                    </span>

                    <span className="badge bg-primary">
                      {problemDetails.marks} Marks
                    </span>

                    <span className="badge bg-secondary">
                      {problemDetails.timeLimit ||
                        2}
                      s
                    </span>

                  </div>

                  {/* Description */}

                  <p className="text-body small mb-3">
                    {problemDetails.description}
                  </p>

                  {/* Input Format */}

                  {problemDetails.inputFormat && (
                    <div className="mb-3">

                      <div className="text-info small fw-bold mb-1">
                        Input Format
                      </div>

                      <div className="p-2 rounded bg-dark border text-body small">
                        <pre className="m-0 text-body">
                          {
                            problemDetails.inputFormat
                          }
                        </pre>
                      </div>

                    </div>
                  )}

                  {/* Output Format */}

                  {problemDetails.outputFormat && (
                    <div className="mb-3">

                      <div className="text-info small fw-bold mb-1">
                        Output Format
                      </div>

                      <div className="p-2 rounded bg-dark border text-body small">
                        <pre className="m-0 text-body">
                          {
                            problemDetails.outputFormat
                          }
                        </pre>
                      </div>

                    </div>
                  )}

                  {/* Constraints */}

                  {problemDetails.constraints && (
                    <div className="mb-3">

                      <div className="text-info small fw-bold mb-1">
                        Constraints
                      </div>

                      <div className="p-2 rounded bg-dark border text-body small">
                        <pre className="m-0 text-body">
                          {
                            problemDetails.constraints
                          }
                        </pre>
                      </div>

                    </div>
                  )}

                  {/* Public Examples */}

                  {publicTestCases.length >
                    0 && (
                      <div className="pt-3 border-top border">

                        <h6 className="fw-bold text-body mb-3">
                          Public Test Cases
                        </h6>

                        {publicTestCases.map(
                          (tc, index) => (
                            <div
                              key={
                                tc._id ||
                                index
                              }
                              className="p-3 rounded-3 bg-dark border mb-2"
                            >

                              <div className="text-muted small mb-1">
                                Input
                              </div>

                              <pre className="text-success small bg-black p-2 rounded">
                                {tc.input}
                              </pre>

                              <div className="text-muted small mb-1">
                                Expected Output
                              </div>

                              <pre className="text-warning small bg-black p-2 rounded mb-0">
                                {
                                  tc.expectedOutput
                                }
                              </pre>

                            </div>
                          )
                        )}

                      </div>
                    )}

                </div>
              )
            )}
          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="col-12 col-lg-7 col-xl-8">

          <div className="card overflow-hidden border">

            {/* Editor Header */}

            <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-dark border-bottom border">

              <div className="d-flex align-items-center gap-2">

                <Code2
                  size={17}
                  className="text-info"
                />

                <span className="text-body small fw-bold font-monospace">
                  {currentLanguage?.label ||
                    language}
                </span>

              </div>

              <span className="text-muted small">
                Monaco Editor
              </span>

            </div>

            {/* Monaco */}

            <div
              style={{
                height: '480px',
              }}
            >
              <Editor
                height="480px"
                language={
                  currentLanguage?.monacoLang ||
                  'javascript'
                }
                value={code}
                onChange={(value) =>
                  setCode(value || '')
                }
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: {
                    enabled: false,
                  },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: {
                    top: 16,
                    bottom: 16,
                  },
                  fontFamily:
                    "'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </div>

            {/* =================================================
                INPUT / OUTPUT
            ================================================== */}

            <div className="row g-0 border-top border bg-dark">

              {/* Input */}

              <div className="col-12 col-md-6 border-end border">

                <div className="p-3">

                  <label className="form-label small text-body fw-bold d-flex align-items-center gap-1 mb-2 font-monospace">

                    <ChevronRight
                      size={14}
                    />

                    Custom Input

                  </label>

                  <textarea
                    className="form-control bg-black text-success border font-monospace small"
                    rows={7}
                    value={customInput}
                    onChange={(e) =>
                      setCustomInput(
                        e.target.value
                      )
                    }
                    placeholder="Enter custom input..."
                    spellCheck={false}
                  />

                </div>
              </div>

              {/* Output */}

              <div className="col-12 col-md-6">

                <div className="p-3">

                  <div className="d-flex align-items-center justify-content-between mb-2">

                    <label className="form-label small text-body fw-bold d-flex align-items-center gap-1 mb-0 font-monospace">

                      <ChevronRight
                        size={14}
                      />

                      Execution Output

                    </label>

                    {outputStatus ===
                      'success' && (
                        <span className="badge bg-success d-flex align-items-center gap-1">

                          <CheckCircle2
                            size={12}
                          />

                          Accepted

                        </span>
                      )}

                    {outputStatus ===
                      'wrong' && (
                        <span className="badge bg-warning text-dark d-flex align-items-center gap-1">

                          <XCircle
                            size={12}
                          />

                          Wrong Answer

                        </span>
                      )}

                    {outputStatus ===
                      'error' && (
                        <span className="badge bg-danger d-flex align-items-center gap-1">

                          <AlertTriangle
                            size={12}
                          />

                          Error

                        </span>
                      )}

                  </div>

                  <pre
                    className={`p-3 rounded bg-black font-monospace small m-0 ${outputStatus ===
                      'success'
                      ? 'text-success'
                      : outputStatus ===
                        'error'
                        ? 'text-danger'
                        : outputStatus ===
                          'wrong'
                          ? 'text-warning'
                          : 'text-body'
                      }`}
                    style={{
                      minHeight: '170px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      whiteSpace:
                        'pre-wrap',
                    }}
                  >
                    {running
                      ? 'â³ Executing code...'
                      : submitting
                        ? 'â³ Running all test cases...'
                        : output ||
                        '// Output will appear here'}
                  </pre>

                </div>
              </div>
            </div>

            {/* =================================================
                SUBMISSION RESULT
            ================================================== */}

            {submissionResult && (
              <div className="border-top border p-3 bg-dark">

                <h6 className="text-body fw-bold mb-3">
                  Submission Result
                </h6>

                <div className="row g-2">

                  <div className="col-6 col-md-3">

                    <div className="p-3 rounded bg-black border">

                      <div className="text-muted small">
                        Status
                      </div>

                      <div
                        className={`fw-bold ${submissionResult.status ===
                          'Accepted'
                          ? 'text-success'
                          : 'text-danger'
                          }`}
                      >
                        {
                          submissionResult.status
                        }
                      </div>

                    </div>
                  </div>

                  <div className="col-6 col-md-3">

                    <div className="p-3 rounded bg-black border">

                      <div className="text-muted small">
                        Test Cases
                      </div>

                      <div className="text-body fw-bold">
                        {
                          submissionResult.passedTestCases
                        }
                        /
                        {
                          submissionResult.totalTestCases
                        }
                      </div>

                    </div>
                  </div>

                  <div className="col-6 col-md-3">

                    <div className="p-3 rounded bg-black border">

                      <div className="text-muted small">
                        Score
                      </div>

                      <div className="text-warning fw-bold">
                        {
                          submissionResult.score
                        }
                        /
                        {
                          problemDetails?.marks ||
                          10
                        }
                      </div>

                    </div>
                  </div>

                  <div className="col-6 col-md-3">

                    <div className="p-3 rounded bg-black border">

                      <div className="text-muted small d-flex align-items-center gap-1">

                        <Clock
                          size={12}
                        />

                        Execution
                      </div>

                      <div className="text-info fw-bold">
                        {
                          submissionResult.executionTime ||
                          0
                        }{' '}
                        ms
                      </div>

                    </div>
                  </div>

                </div>

                {/* Test Results */}

                {Array.isArray(
                  submissionResult.testResults
                ) &&
                  submissionResult
                    .testResults.length >
                  0 && (
                    <div className="mt-3">

                      <h6 className="text-body small fw-bold mb-2">
                        Test Case Results
                      </h6>

                      <div className="table-responsive">

                        <table className="table table-sm align-middle mb-0">

                          <thead>
                            <tr className="text-muted small">
                              <th>
                                #
                              </th>

                              <th>
                                Test Case
                              </th>

                              <th>
                                Status
                              </th>

                              <th>
                                Time
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {submissionResult.testResults.map(
                              (
                                result,
                                index
                              ) => (
                                <tr
                                  key={
                                    result.testCaseId ||
                                    index
                                  }
                                >

                                  <td>
                                    {index +
                                      1}
                                  </td>

                                  <td>
                                    {result.isHidden
                                      ? 'Hidden Test Case'
                                      : 'Public Test Case'}
                                  </td>

                                  <td>

                                    {result.status ===
                                      'Accepted' ? (
                                      <span className="text-success d-flex align-items-center gap-1">
                                        <CheckCircle2
                                          size={
                                            14
                                          }
                                        />
                                        Accepted
                                      </span>
                                    ) : (
                                      <span className="text-danger d-flex align-items-center gap-1">
                                        <XCircle
                                          size={
                                            14
                                          }
                                        />
                                        {
                                          result.status
                                        }
                                      </span>
                                    )}

                                  </td>

                                  <td>
                                    {
                                      result.executionTime
                                    }{' '}
                                    ms
                                  </td>

                                </tr>
                              )
                            )}
                          </tbody>

                        </table>

                      </div>
                    </div>
                  )}

              </div>
            )}

          </div>
        </div>
      </div>

      {warningMessage && assessmentStarted && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: 'rgba(0,0,0,.85)',
            zIndex: 9999,
          }}
        >
          <div
            className="bg-dark border-warning rounded-3 p-4 text-center shadow-lg"
            style={{
              width: '420px',
              maxWidth: '90%',
            }}
          >
            <AlertTriangle
              size={56}
              className="text-warning mb-3"
            />

            <h4 className="text-warning fw-bold">
              Assessment Warning
            </h4>

            <p className="text-body mt-3 mb-4">
              {warningMessage}
            </p>

            <h5 className="text-body">
              Warning {warningCount}/3
            </h5>

            <p className="text-muted small">
              After 3 warnings, the next violation will automatically submit your assessment.
            </p>

            <button
              className="btn btn-warning fw-bold px-4 mt-2"
              onClick={() => setWarningMessage('')}
            >
              Continue Assessment
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CodingArena;

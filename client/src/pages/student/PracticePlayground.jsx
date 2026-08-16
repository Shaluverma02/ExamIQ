import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Maximize2,
  Minimize2,
  BookOpen,
  ListFilter,
  History,
  Search,
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

const getProblemStarterCode = (probTitle, lang) => {
  const pName = probTitle ? probTitle.trim() : 'Problem Solution';
  if (lang === 'python') {
    return `# Problem: ${pName}\n# Write your Python solution below\nimport sys\n\ndef solution():\n    data = sys.stdin.read().strip().split()\n    if not data:\n        return\n    # Add logic for ${pName}\n\nsolution()\n`;
  }
  if (lang === 'cpp') {
    return `// Problem: ${pName}\n// Write your C++ solution below\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Add logic for ${pName}\n    return 0;\n}\n`;
  }
  if (lang === 'c') {
    return `// Problem: ${pName}\n// Write your C solution below\n#include <stdio.h>\n\nint main() {\n    // Add logic for ${pName}\n    return 0;\n}\n`;
  }
  if (lang === 'java') {
    return `// Problem: ${pName}\n// Write your Java solution below\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Add logic for ${pName}\n    }\n}\n`;
  }
  return `// Problem: ${pName}\n// Write your JavaScript solution below\nconst fs = require('fs');\n\nfunction solution() {\n  const input = fs.readFileSync(0, 'utf-8').trim();\n  // Add logic for ${pName}\n}\n\nsolution();\n`;
};

const PracticePlayground = () => {
  const { id: paramProblemId } = useParams();
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
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState('input');
  const [submissionsHistory, setSubmissionsHistory] = useState([]);

  /*
   * ---------------------------------------------------------
   * Load Coding Problems
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchProblems();
  }, [paramProblemId]);

  const fetchProblems = async () => {
    try {
      setLoadingProblems(true);

      const res = await API.get('/coding');

      const list = res.data?.problems || [];

      setProblems(list);

      if (list.length > 0) {
        const target = paramProblemId ? list.find((p) => p._id.toString() === paramProblemId) : null;
        setSelectedProblem(target || list[0]);
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
  }, [selectedProblem?._id]);

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
       * Load starter code for selected language safely.
       */
      const normLang = (l) => {
        const s = (l || '').toLowerCase();
        if (s === 'js' || s === 'javascript') return 'javascript';
        if (s === 'py' || s === 'python' || s === 'python3') return 'python';
        if (s === 'cpp' || s === 'c++') return 'cpp';
        if (s === 'c') return 'c';
        if (s === 'java') return 'java';
        return s;
      };

      const starter = problem?.starterCode?.find(
        (item) => normLang(item.language) === normLang(language)
      );

      if (starter && starter.code) {
        setCode(starter.code);
      } else {
        setCode(getProblemStarterCode(problem?.title, language));
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
      setCode(getProblemStarterCode(problemDetails?.title, newLanguage));
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

      const result = res.data?.result;
      const rawOutput = (result?.output || '').trim();

      const inputToUse = (customInput || '').trim() || publicTestCases[0]?.input || '';

      const matchedTc = publicTestCases.find(
        (tc) => (tc.input || '').trim() === inputToUse
      ) || publicTestCases[0];

      const expectedVal = (matchedTc?.expectedOutput || matchedTc?.output || '').trim();

      let outputDisplay = `Input:\n${inputToUse || '(Empty)'}\n\nYour Output:\n${rawOutput || '(No Output)'}`;

      if (expectedVal) {
        const isMatch = rawOutput === expectedVal;
        outputDisplay += `\n\nExpected Output:\n${expectedVal}`;
        outputDisplay += `\n\nResult: ${isMatch ? '✅ MATCHED (Passed)' : '❌ MISMATCHED (Wrong Answer)'}`;

        setOutputStatus(isMatch ? 'success' : 'wrong');
        if (isMatch) {
          toast.success('Trial Run Output Matched Expected Output! 🎉');
        } else {
          toast.warning('Trial Run Output Mismatched Expected Output.');
        }
      } else {
        setOutputStatus(result?.status === 'Accepted' ? 'success' : 'error');
      }

      setOutput(outputDisplay);
    } catch (error) {
      console.error('Run code error:', error);
      const message = error.response?.data?.message || 'Code execution failed.';
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
          '🎉 Solution Accepted!'
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
      setCode(getProblemStarterCode(problemDetails?.title, language));
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
    const fromDb = (testCases || []).filter((tc) => !tc.isHidden);
    if (fromDb.length > 0) return fromDb;

    if (problemDetails?.examples && problemDetails.examples.length > 0) {
      return problemDetails.examples.map((ex, idx) => ({
        _id: `ex_${idx}`,
        input: ex.input || '',
        expectedOutput: ex.expectedOutput || ex.output || '',
        isHidden: false,
      }));
    }

    return [];
  }, [testCases, problemDetails]);

  const currentLanguage = LANGUAGES.find(
    (item) => item.value === language
  );

  /*
   * ---------------------------------------------------------
   * Loading State
   * ---------------------------------------------------------
   */

  if (loadingProblems) {
    return (
      <div className="text-center text-light py-5">
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
      <div className="glass-card p-5 text-center text-light">
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
    <div className="practice-ide-playground pb-5">
      {/* =====================================================
          TOP CONTROL BAR & QUICK PROBLEM SELECTOR
      ====================================================== */}
      <div className="glass-card p-3 border border-secondary rounded-4 mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Left: Quick Problem Select Dropdown & Title */}
        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: '300px' }}>
          <div className="p-2 bg-primary bg-opacity-20 text-primary rounded-3 flex-shrink-0">
            <Cpu size={22} />
          </div>

          <div className="flex-grow-1 position-relative">
            <label className="form-label extra-small text-muted mb-0 font-monospace d-flex align-items-center gap-1">
              <Layers size={12} className="text-primary" /> Active Problem ({problems.length})
            </label>
            <select
              className="form-select form-select-sm bg-dark text-info border-secondary font-monospace fw-bold"
              value={selectedProblem?._id || ''}
              onChange={(e) => {
                const target = problems.find((p) => p._id === e.target.value);
                if (target) setSelectedProblem(target);
              }}
              style={{ borderRadius: '8px' }}
            >
              {problems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.difficulty ? p.difficulty.toUpperCase() : 'EASY'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Controls (Language, Reset, Run, Submit, Fullscreen) */}
        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
          {/* Language Selector */}
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary font-monospace"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ width: '140px', borderRadius: '8px' }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Reset Code */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1.5 font-monospace"
            onClick={handleResetCode}
            disabled={running || submitting}
            title="Reset to default starter code"
          >
            <RefreshCw size={14} /> Reset
          </button>

          {/* Run Trial Code */}
          <button
            type="button"
            className="btn btn-primary btn-sm px-3.5 rounded-pill fw-bold font-monospace d-flex align-items-center gap-2 shadow-sm"
            onClick={handleRunCode}
            disabled={running || submitting}
          >
            {running ? <RefreshCw size={14} className="spinner-border" /> : <Play size={14} />}
            {running ? 'Running...' : 'Run Code'}
          </button>

          {/* Submit Solution */}
          <button
            type="button"
            className="btn btn-success btn-sm px-4 rounded-pill fw-bold font-monospace d-flex align-items-center gap-2 shadow-sm"
            onClick={handleSubmitCode}
            disabled={running || submitting}
          >
            {submitting ? <RefreshCw size={14} className="spinner-border" /> : <Send size={14} />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>

          {/* Fullscreen Editor Toggle */}
          <button
            type="button"
            className={`btn btn-sm rounded-circle p-2 ${isEditorFullscreen ? 'btn-warning' : 'btn-outline-info'}`}
            onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
            title={isEditorFullscreen ? 'Exit Fullscreen' : 'Fullscreen Code Editor'}
          >
            {isEditorFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN SPLIT WORKSPACE GRID (50 / 50 EQUAL SPLIT)
      ====================================================== */}
      <div className="row g-3">
        {/* ===================================================
            LEFT SIDE (PROBLEM WORKSPACE & TABS)
        ==================================================== */}
        {!isEditorFullscreen && (
          <div className="col-12 col-lg-6 d-flex flex-column">
            <div className="glass-card border border-secondary rounded-4 shadow-sm overflow-hidden d-flex flex-column h-100" style={{ minHeight: '680px' }}>
              {/* Left Panel Tabs Header */}
              <div className="d-flex bg-dark border-bottom border-secondary px-2 pt-2 gap-1">
                <button
                  type="button"
                  className={`btn btn-sm rounded-top-3 px-3 py-2 font-monospace fw-bold d-flex align-items-center gap-1.5 border-bottom-0 ${
                    activeLeftTab === 'description'
                      ? 'btn-primary text-white active shadow-sm'
                      : 'text-muted hover-light'
                  }`}
                  onClick={() => setActiveLeftTab('description')}
                >
                  <BookOpen size={14} /> Problem Statement
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-top-3 px-3 py-2 font-monospace fw-bold d-flex align-items-center gap-1.5 border-bottom-0 ${
                    activeLeftTab === 'problems'
                      ? 'btn-primary text-white active shadow-sm'
                      : 'text-muted hover-light'
                  }`}
                  onClick={() => setActiveLeftTab('problems')}
                >
                  <ListFilter size={14} /> Problem Bank ({problems.length})
                </button>
              </div>

              {/* Tab 1: Description Panel */}
              {activeLeftTab === 'description' && (
                <div className="p-4 overflow-auto flex-grow-1" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                  {loadingProblem ? (
                    <div className="text-center text-muted py-5">
                      <RefreshCw size={28} className="spinner-border text-info mb-2" />
                      <div className="small font-monospace">Loading problem details...</div>
                    </div>
                  ) : problemDetails ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h4 className="fw-bold text-info m-0">{problemDetails.title}</h4>
                        <span className="badge bg-secondary font-monospace">{problemDetails.category || 'DSA'}</span>
                      </div>

                      {/* Difficulty & Metrics Badges */}
                      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                        <span
                          className={`badge px-2.5 py-1.5 text-uppercase ${
                            problemDetails.difficulty === 'easy'
                              ? 'bg-success'
                              : problemDetails.difficulty === 'medium'
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}
                        >
                          {problemDetails.difficulty}
                        </span>
                        <span className="badge bg-primary px-2.5 py-1.5 font-monospace">{problemDetails.marks || 10} Marks</span>
                        <span className="badge bg-dark border border-secondary text-light px-2.5 py-1.5 font-monospace">
                          <Clock size={12} className="me-1" /> {problemDetails.timeLimit || 2}s limit
                        </span>
                      </div>

                      {/* Problem Statement */}
                      <div className="text-light mb-4 leading-relaxed font-sans small bg-black bg-opacity-40 p-3 rounded-3 border border-secondary">
                        {problemDetails.description}
                      </div>

                      {/* Input Format */}
                      {problemDetails.inputFormat && (
                        <div className="mb-3">
                          <div className="text-info extra-small fw-bold mb-1 uppercase font-monospace">Input Format</div>
                          <div className="p-2.5 rounded-3 bg-dark border border-secondary text-light extra-small font-monospace">
                            <pre className="m-0 text-light whitespace-pre-wrap">{problemDetails.inputFormat}</pre>
                          </div>
                        </div>
                      )}

                      {/* Output Format */}
                      {problemDetails.outputFormat && (
                        <div className="mb-3">
                          <div className="text-info extra-small fw-bold mb-1 uppercase font-monospace">Output Format</div>
                          <div className="p-2.5 rounded-3 bg-dark border border-secondary text-light extra-small font-monospace">
                            <pre className="m-0 text-light whitespace-pre-wrap">{problemDetails.outputFormat}</pre>
                          </div>
                        </div>
                      )}

                      {/* Constraints */}
                      {problemDetails.constraints && (
                        <div className="mb-3">
                          <div className="text-info extra-small fw-bold mb-1 uppercase font-monospace">Constraints</div>
                          <div className="p-2.5 rounded-3 bg-dark border border-secondary text-light extra-small font-monospace">
                            <pre className="m-0 text-light whitespace-pre-wrap">{problemDetails.constraints}</pre>
                          </div>
                        </div>
                      )}

                      {/* Sample Test Cases */}
                      {publicTestCases.length > 0 && (
                        <div className="pt-3 border-top border-secondary mt-4">
                          <h6 className="fw-bold text-light mb-3 font-monospace d-flex align-items-center gap-2">
                            <CheckCircle2 size={16} className="text-success" /> Sample Test Cases ({publicTestCases.length})
                          </h6>
                          {publicTestCases.map((tc, index) => (
                            <div key={tc._id || index} className="p-3 rounded-3 bg-dark border border-secondary mb-3 font-monospace">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted extra-small fw-bold">Sample #{index + 1} Input:</span>
                                <button
                                  type="button"
                                  className="btn btn-link text-info extra-small p-0 text-decoration-none"
                                  onClick={() => {
                                    setCustomInput(tc.input || '');
                                    toast.info(`Sample #${index + 1} input loaded into Custom Input box!`);
                                  }}
                                >
                                  ⚡ Load Input
                                </button>
                              </div>
                              <pre className="text-success extra-small bg-black p-2.5 rounded mb-2 border border-secondary">{tc.input || '(Empty)'}</pre>

                              <div className="text-muted extra-small fw-bold mb-1">Expected Output:</div>
                              <pre className="text-warning extra-small bg-black p-2.5 rounded mb-0 border border-secondary">
                                {tc.expectedOutput || tc.output || 'N/A'}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Tab 2: All Problems List */}
              {activeLeftTab === 'problems' && (
                <div className="p-3 overflow-auto flex-grow-1 d-flex flex-column gap-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                  <div className="position-relative mb-2">
                    <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary ps-5 font-monospace"
                      placeholder="Search coding problems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="d-flex flex-column gap-2 pe-1" style={{ overflowY: 'auto' }}>
                    {problems
                      .filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((problem) => {
                        const isSelected = selectedProblem?._id === problem._id;
                        return (
                          <button
                            key={problem._id}
                            className={`btn btn-sm text-start d-flex justify-content-between align-items-center rounded-3 px-3 py-2.5 ${
                              isSelected
                                ? 'bg-primary text-white fw-bold border-0 shadow-sm'
                                : 'bg-dark text-light border border-secondary hover-dark'
                            }`}
                            onClick={() => {
                              setSelectedProblem(problem);
                              setActiveLeftTab('description');
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 text-truncate">
                              <Code2 size={15} className="flex-shrink-0 text-info" />
                              <span className="text-truncate">{problem.title}</span>
                            </div>
                            <span
                              className={`badge flex-shrink-0 ms-2 ${
                                problem.difficulty === 'easy'
                                  ? 'bg-success'
                                  : problem.difficulty === 'medium'
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            RIGHT SIDE (MONACO CODE EDITOR & CONSOLE)
        ==================================================== */}
        <div className={isEditorFullscreen ? 'col-12' : 'col-12 col-lg-6'}>
          <div className="glass-card overflow-hidden border border-secondary rounded-4 shadow-sm">
            {/* Editor Top Toolbar */}
            <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-dark border-bottom border-secondary">
              <div className="d-flex align-items-center gap-2">
                <Code2 size={16} className="text-info" />
                <span className="text-light small fw-bold font-monospace">
                  {currentLanguage?.label || language} Solution Canvas
                </span>
              </div>
              <span className="text-muted extra-small font-monospace">Monaco Editor v0.45</span>
            </div>

            {/* Monaco Canvas */}
            <div style={{ height: isEditorFullscreen ? 'calc(100vh - 280px)' : '450px' }}>
              <Editor
                height="100%"
                language={currentLanguage?.monacoLang || 'javascript'}
                value={code}
                onChange={(value) => setCode(value !== undefined ? value : '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 14, bottom: 14 },
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </div>

            {/* =================================================
                INPUT / EXECUTION CONSOLE
            ================================================== */}
            <div className="border-top border-secondary bg-dark p-3">
              <div className="row g-3">
                {/* Input Column */}
                <div className="col-12 col-md-6 border-end border-secondary">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label extra-small text-light fw-bold d-flex align-items-center gap-1 mb-0 font-monospace">
                      <ChevronRight size={14} className="text-primary" /> Custom Input
                    </label>
                  </div>
                  <textarea
                    className="form-control bg-black text-success border-secondary font-monospace extra-small"
                    rows={6}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom test input here..."
                    spellCheck={false}
                  />
                </div>

                {/* Output Column */}
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label extra-small text-light fw-bold d-flex align-items-center gap-1 mb-0 font-monospace">
                      <ChevronRight size={14} className="text-primary" /> Execution Console
                    </label>

                    {outputStatus === 'success' && (
                      <span className="badge bg-success d-flex align-items-center gap-1">
                        <CheckCircle2 size={12} /> Accepted
                      </span>
                    )}

                    {outputStatus === 'wrong' && (
                      <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                        <XCircle size={12} /> Wrong Answer
                      </span>
                    )}

                    {outputStatus === 'error' && (
                      <span className="badge bg-danger d-flex align-items-center gap-1">
                        <AlertTriangle size={12} /> Error
                      </span>
                    )}
                  </div>

                  <pre
                    className={`p-3 rounded-3 bg-black font-monospace extra-small m-0 ${
                      outputStatus === 'success'
                        ? 'text-success border border-success border-opacity-25'
                        : outputStatus === 'error'
                        ? 'text-danger border border-danger border-opacity-25'
                        : outputStatus === 'wrong'
                        ? 'text-warning border border-warning border-opacity-25'
                        : 'text-light border border-secondary'
                    }`}
                    style={{
                      minHeight: '145px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {running
                      ? '⏳ Executing code against custom input...'
                      : submitting
                      ? '⏳ Evaluating all test cases...'
                      : output || '// Run Code to see execution output'}
                  </pre>
                </div>
              </div>
              {/* Submission Result Details Banner */}
              {submissionResult && (
                <div className="mt-3 p-3 rounded-3 bg-black border border-secondary font-monospace">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <div>
                      <span className="text-muted extra-small">Submission Status: </span>
                      <span className={`fw-bold ${submissionResult.status === 'Accepted' ? 'text-success' : 'text-danger'}`}>
                        {submissionResult.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted extra-small">Passed Cases: </span>
                      <span className="text-light fw-bold">
                        {submissionResult.passedTestCases}/{submissionResult.totalTestCases}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted extra-small">Score: </span>
                      <span className="text-info fw-bold">{submissionResult.score} pts</span>
                    </div>
                  </div>

                  {Array.isArray(submissionResult.testResults) && submissionResult.testResults.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-top border-secondary">
                      <div className="table-responsive">
                        <table className="table table-dark table-sm align-middle mb-0 extra-small">
                          <thead>
                            <tr className="text-muted">
                              <th>#</th>
                              <th>Test Case</th>
                              <th>Status</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissionResult.testResults.map((result, idx) => (
                              <tr key={result.testCaseId || idx}>
                                <td>{idx + 1}</td>
                                <td>{result.isHidden ? 'Hidden Case' : 'Public Case'}</td>
                                <td>
                                  {result.status === 'Accepted' ? (
                                    <span className="text-success d-flex align-items-center gap-1">
                                      <CheckCircle2 size={12} /> Passed
                                    </span>
                                  ) : (
                                    <span className="text-danger d-flex align-items-center gap-1">
                                      <XCircle size={12} /> {result.status}
                                    </span>
                                  )}
                                </td>
                                <td>{result.executionTime} ms</td>
                              </tr>
                            ))}
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
      </div>
    </div>
  );
};

export default PracticePlayground;
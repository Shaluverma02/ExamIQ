import React, { useState, useContext, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import {
  Play,
  CheckCircle2,
  RefreshCw,
  Send,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  Code2,
} from 'lucide-react';
import { toast } from 'react-toastify';

const LANGUAGES = [
  { label: 'JavaScript (Node.js)', value: 'javascript', monacoLang: 'javascript' },
  { label: 'Python 3', value: 'python', monacoLang: 'python' },
  { label: 'C++ (g++)', value: 'cpp', monacoLang: 'cpp' },
  { label: 'C (gcc)', value: 'c', monacoLang: 'c' },
  { label: 'Java (OpenJDK)', value: 'java', monacoLang: 'java' },
];

const DEFAULT_STARTER_CODE = {
  javascript: `// Write your JavaScript solution
const fs = require('fs');

function solution() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) return;
  console.log(input);
}

solution();`,

  python: `# Write your Python 3 solution
import sys

def solution():
    data = sys.stdin.read().strip()
    if not data:
        return
    print(data)

solution()`,

  cpp: `// Write your C++ solution
#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    if (cin >> input) {
        cout << input << endl;
    }
    return 0;
}`,

  c: `// Write your C solution
#include <stdio.h>

int main() {
    char input[1000];
    if (scanf("%s", input) == 1) {
        printf("%s\\n", input);
    }
    return 0;
}`,

  java: `// Write your Java solution
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            System.out.println(sc.next());
        }
    }
}`,
};

const CodeEditor = ({ problem, examId, draftScope, onBusyChange, onSubmissionSuccess }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const draftPrefix = 'examiq-code:' + (user?._id || user?.id || 'student') + ':' + (draftScope || examId || 'practice') + ':' + (problem?._id || 'scratch') + ':';
  const activeProblem = useRef(problem?._id);
  activeProblem.current = draftPrefix;
  const draftReady = useRef(false);
  const starterFor = (lang) => problem?.starterCode?.find((s) => s.language?.toLowerCase() === lang)?.code ?? DEFAULT_STARTER_CODE[lang] ?? '';
  const readDraft = (lang) => { try { return sessionStorage.getItem(draftPrefix + lang) ?? starterFor(lang); } catch { return starterFor(lang); } };
  const saveDraft = (lang, value) => { try { sessionStorage.setItem(draftPrefix + lang, value); } catch { /* Editing remains available without storage. */ } };
  const [language, setLanguage] = useState(problem?.allowedLanguages?.[0] || 'javascript');
  const [code, setCode] = useState(DEFAULT_STARTER_CODE[problem?.allowedLanguages?.[0] || 'javascript'] || DEFAULT_STARTER_CODE.javascript);
  const [customInput, setCustomInput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases'); // 'testcases', 'custom', 'result'
  const [inputMode, setInputMode] = useState('testcases');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const [outputResult, setOutputResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { onBusyChange?.(isRunning || isSubmitting); }, [isRunning, isSubmitting]);

  useEffect(() => {
    const allowed = LANGUAGES.filter((lang) => !problem?.allowedLanguages?.length || problem.allowedLanguages.includes(lang.value));
    const next = allowed.some((lang) => lang.value === language) ? language : allowed[0]?.value || 'javascript';
    setLanguage(next);
    setCode(readDraft(next));
    setSelectedTestCaseIdx(0);
    setCustomInput('');
    setInputMode('testcases');
    setOutputResult(null);
    setSubmissionResult(null);
    setActiveConsoleTab('testcases');
    draftReady.current = true;
  }, [draftPrefix]);

  const availableLanguages = LANGUAGES.filter((lang) => !problem?.allowedLanguages?.length || problem.allowedLanguages.includes(lang.value));
  const updateCode = (value) => { setCode(value); if (draftReady.current) saveDraft(language, value); };
  const handleLanguageChange = (e) => {
    saveDraft(language, code);
    const next = e.target.value;
    setLanguage(next);
    setCode(readDraft(next));
    setOutputResult(null);
    setSubmissionResult(null);
  };

  const handleResetCode = () => {
    updateCode(starterFor(language));
    toast.info('Starter code reset to default');
  };

  const handleRunTrialCode = async () => {
    if (isRunning || isSubmitting) return;
    const requestProblem = draftPrefix;
    try {
      setIsRunning(true);
      setOutputResult(null);
      const inputToUse = inputMode === 'custom' ? customInput : (problem?.examples?.[selectedTestCaseIdx]?.input ?? problem?.examples?.[0]?.input ?? '');
      setSubmissionResult(null);
      setActiveConsoleTab('result');

      const res = await API.post('/coding/run', {
        language,
        sourceCode: code,
        input: inputToUse,
        timeLimit: (problem?.timeLimit || 2) * 1000,
        memoryLimit: problem?.memoryLimit || 128,
      });

      if (activeProblem.current !== requestProblem) return;
      setOutputResult(res.data.result);
      if (res.data.result.status === 'Accepted') {
        toast.success(`Trial Run Execution Passed (${res.data.result.executionTime}ms)`);
      } else {
        toast.warning(`Execution Status: ${res.data.result.status}`);
      }
    } catch (err) {
      if (activeProblem.current === requestProblem) setOutputResult({ status: 'Execution failed', errorMessage: err.response?.data?.message || 'Failed to execute code. Please try again.' });
      toast.error(err.response?.data?.message || 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting || !problem?._id) return;
    const requestProblem = draftPrefix;
    try {
      setIsSubmitting(true);
      setSubmissionResult(null);
      setOutputResult(null);
      setActiveConsoleTab('result');

      const res = await API.post('/coding/submit', {
        problemId: problem._id,
        examId,
        language,
        sourceCode: code,
      });

      const subData = res.data.submission;
      if (activeProblem.current !== requestProblem) return;
      setOutputResult(null);
      setSubmissionResult(subData);

      if (subData.status === 'Accepted') {
        toast.success(`🎉 Solution Accepted! Score: ${subData.score} pts`);
      } else {
        toast.warning(`Submission Result: ${subData.status}`);
      }

      if (onSubmissionSuccess) onSubmissionSuccess(subData);
    } catch (err) {
      if (activeProblem.current === requestProblem) setOutputResult({ status: 'Submission failed', errorMessage: err.response?.data?.message || 'Submission failed. Please try again.' });
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentExample = problem?.examples?.[selectedTestCaseIdx] || problem?.examples?.[0];

  return (
    <div className="coding-editor d-flex flex-column h-100 rounded-3 overflow-hidden border card">
      {/* Control Toolbar (Practice Playground Matching Style) */}
      <div className="coding-editor-toolbar p-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Code2 size={18} className="text-info" />
          <select
            className="form-select form-select-sm bg-dark text-body border font-monospace fw-bold"
            style={{ width: 190, borderRadius: '8px' }}
            value={language}
            onChange={handleLanguageChange}
            disabled={isRunning || isSubmitting}
            aria-label="Programming language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1.5 font-monospace"
            onClick={handleResetCode}
            disabled={isRunning || isSubmitting}
            title="Reset Starter Code"
          >
            <RefreshCw size={14} /> Reset
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm px-3.5 rounded-pill fw-bold font-monospace d-flex align-items-center gap-2 shadow-sm"
            onClick={handleRunTrialCode}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? (
              <>
                <span className="spinner-border spinner-border-sm" /> Running...
              </>
            ) : (
              <>
                <Play size={14} /> Run Code
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-success btn-sm px-4 rounded-pill fw-bold font-monospace d-flex align-items-center gap-2 shadow-sm"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" /> Submitting...
              </>
            ) : (
              <>
                <Send size={14} /> Submit
              </>
            )}
          </button>
        </div>
      </div>

      <div className="coding-editor-filebar d-flex justify-content-between align-items-center px-3 py-2 border-bottom small">
        <span className="font-monospace text-muted">{({ javascript: 'solution.js', python: 'solution.py', cpp: 'solution.cpp', c: 'solution.c', java: 'Main.java' })[language]}</span>
        <span className="text-muted">{inputMode === 'custom' ? 'Custom input' : 'Sample case ' + (selectedTestCaseIdx + 1)}</span>
      </div>
      {/* Monaco Code Canvas */}
      <div className="coding-editor-canvas flex-grow-1 position-relative overflow-hidden" style={{ minHeight: 250, flex: '1 1 0%' }}>
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          value={code}
          onChange={(val) => updateCode(val ?? '')}
          loading={
            <div className="coding-editor-loading w-100 h-100 p-3 font-monospace d-flex flex-column">
              <div className="text-info extra-small mb-2">Loading editor — you can start typing below</div>
              <textarea
                aria-label="Code editor"
                className="coding-editor-fallback w-100 flex-grow-1 font-monospace p-2 border rounded"
                value={code}
                onChange={(e) => updateCode(e.target.value)}
                style={{ resize: 'none', outline: 'none' }}
              />
            </div>
          }
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            wordWrap: 'on',
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>

      {/* Test Case & Output Console Drawer */}
      <div aria-live="polite" aria-busy={isRunning || isSubmitting} className="coding-editor-console border-top flex-shrink-0 custom-ide-scrollbar" style={{ maxHeight: 240, overflowY: 'auto' }}>
        {/* Console Header Tabs */}
        <div className="coding-editor-console-header px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
              <button
                type="button"
              className={`btn btn-sm py-1 px-3 rounded-2 font-monospace extra-small fw-bold transition-all ${
                activeConsoleTab === 'testcases' ? 'btn-secondary text-body' : 'text-muted hover-text-body'
              }`}
              onClick={() => { setActiveConsoleTab('testcases'); setInputMode('testcases'); }}
            >
              Test Cases ({problem?.examples?.length || 1})
            </button>
              <button
                type="button"
              className={`btn btn-sm py-1 px-3 rounded-2 font-monospace extra-small fw-bold transition-all ${
                activeConsoleTab === 'custom' ? 'btn-secondary text-body' : 'text-muted hover-text-body'
              }`}
              onClick={() => { setActiveConsoleTab('custom'); setInputMode('custom'); }}
            >
              Custom Input
            </button>
              <button
                type="button"
              className={`btn btn-sm py-1 px-3 rounded-2 font-monospace extra-small fw-bold transition-all ${
                activeConsoleTab === 'result' ? 'btn-primary text-white' : 'text-muted hover-text-body'
              }`}
              onClick={() => setActiveConsoleTab('result')}
            >
              Execution Console
            </button>
          </div>

          {(outputResult || submissionResult) && (
            <div className="extra-small font-monospace">
              {outputResult && (
                <span className={outputResult.status === 'Accepted' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                  Trial Run: {outputResult.status} ({outputResult.executionTime || 0}ms)
                </span>
              )}
              {submissionResult && (
                <span className={`ms-2 ${submissionResult.status === 'Accepted' ? 'text-success fw-bold' : 'text-danger fw-bold'}`}>
                  Submitted: {submissionResult.status} ({submissionResult.score || 0} pts)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Console Body Content */}
        <div className="p-3">
          {/* TAB 1: SAMPLE TEST CASES */}
          {activeConsoleTab === 'testcases' && (
            <div>
              {problem?.examples && problem.examples.length > 0 ? (
                <div>
                  <div className="d-flex gap-2 mb-2">
                    {problem.examples.map((ex, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`btn btn-sm px-3 py-1 rounded-2 font-monospace extra-small ${
                          selectedTestCaseIdx === idx ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-body'
                        }`}
                        onClick={() => setSelectedTestCaseIdx(idx)}
                      >
                        Case #{idx + 1}
                      </button>
                    ))}
                  </div>

                  {currentExample && (
                    <div className="row g-2 extra-small font-monospace">
                      <div className="col-6">
                        <span className="text-muted">Input:</span>
                        <pre className="coding-console-output text-success p-2 rounded border mt-1 mb-0" style={{ maxHeight: 90 }}>
                          {currentExample.input}
                        </pre>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Expected Output:</span>
                        <pre className="coding-console-output text-info p-2 rounded border mt-1 mb-0" style={{ maxHeight: 90 }}>
                          {currentExample.output}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted small">Standard Input Stream Enabled</div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM INPUT */}
          {activeConsoleTab === 'custom' && (
            <div>
              <label className="text-muted extra-small font-monospace mb-1">Enter Stdin Arguments / Inputs:</label>
              <textarea
                className="form-control form-control-sm coding-custom-input font-monospace"
                rows="3"
                placeholder="Type custom test input here..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>
          )}

          {/* TAB 3: EXECUTION RESULTS CONSOLE */}
          {activeConsoleTab === 'result' && (
            <div>
              {!outputResult && !submissionResult && (
                <div className="text-muted small font-monospace text-center py-3">
                  <Terminal size={20} className="mb-1 text-secondary" />
                  <div>Click <strong>Run Code</strong> or <strong>Submit</strong> to view real-time compilation output.</div>
                </div>
              )}

              {/* Trial Run Result */}
              {outputResult && (
                <div className="font-monospace extra-small">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className={`fw-bold d-flex align-items-center gap-1.5 ${outputResult.status === 'Accepted' ? 'text-success' : 'text-danger'}`}>
                      {outputResult.status === 'Accepted' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      Status: {outputResult.status}
                    </span>
                    <span className="text-muted">Time: {outputResult.executionTime || 0}ms</span>
                  </div>

                  {(outputResult.errorMessage || outputResult.error) ? (
                    <pre className="coding-console-output text-danger p-2 rounded border-danger mb-0">
                      {outputResult.errorMessage || outputResult.error}
                    </pre>
                  ) : (
                    <div>
                      <span className="text-muted">Standard Output (stdout):</span>
                      <pre className="coding-console-output text-success p-2 rounded border mt-1 mb-0" style={{ maxHeight: 90 }}>
                        {outputResult.output || '(No stdout output)'}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Final Submission Result */}
              {submissionResult && (
                <div className="font-monospace extra-small mt-3 pt-2 border-top border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className={`fw-bold fs-6 ${submissionResult.status === 'Accepted' ? 'text-success' : 'text-danger'}`}>
                      Final Result: {submissionResult.status} ({submissionResult.passedTestCases} / {submissionResult.totalTestCases} Test Cases Passed)
                    </span>
                    <span className="badge bg-primary fs-6">Score: {submissionResult.score} pts</span>
                  </div>

                  {submissionResult.testResults && (
                    <div className="row g-2">
                      {submissionResult.testResults.map((tr, idx) => (
                        <div key={idx} className="col-12 col-md-6">
                          <div className={`coding-test-result p-2 rounded border ${tr.status === 'Accepted' ? 'border-success' : 'border-danger'}`}>
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Test Case #{idx + 1} {tr.isHidden ? '(Hidden)' : ''}</span>
                              <span className={tr.status === 'Accepted' ? 'text-success' : 'text-danger'}>{tr.status}</span>
                            </div>
                            {!tr.isHidden && (
                              <div className="text-muted extra-small mt-1">
                                <div>In: {tr.input}</div>
                                <div>Out: {tr.actualOutput}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Award } from 'lucide-react';
import { toast } from 'react-toastify';

const PDFPerformanceReport = ({ result, student, exam }) => {
  const handleDownloadPDFReport = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blocked! Please allow pop-ups to print PDF report.');
        return;
      }

      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ExamiQ Performance Report — ${student?.name || result?.studentId?.name || 'Student'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .title { margin: 0; color: #2563eb; font-size: 24px; font-weight: bold; }
            .badge { background: #2563eb; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 12px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .table td { padding: 10px; border: 1px solid #cbd5e1; font-size: 13px; }
            .table .label { font-weight: bold; background: #f8fafc; width: 25%; }
            .score-box { background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; border: 1px solid #cbd5e1; }
            .score-title { font-size: 32px; font-weight: 800; color: #1e293b; margin: 0; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">ExamiQ Performance Diagnostic Report</h1>
              <div style="color: #64748b; font-size: 13px; mt: 4px;">Official Candidate Evaluation & Integrity Summary</div>
            </div>
            <span class="badge">STATUS: ${(result?.status || 'COMPLETED').toUpperCase()}</span>
          </div>

          <table class="table">
            <tr>
              <td class="label">Candidate Name:</td>
              <td>${student?.name || result?.studentId?.name || 'N/A'}</td>
              <td class="label">Email:</td>
              <td>${student?.email || result?.studentId?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Assessment Title:</td>
              <td>${exam?.title || result?.examId?.title || 'Assessment'}</td>
              <td class="label">Attempt Number:</td>
              <td>Attempt #${result?.attemptNumber || 1}</td>
            </tr>
          </table>

          <div class="score-box">
            <div class="score-title">${result?.totalScore || 0} / ${result?.totalMarks || 100} (${result?.percentage || 0}%)</div>
            <div style="color: #475569; font-size: 13px; margin-top: 4px;">Evaluated at: ${new Date(result?.evaluatedAt || Date.now()).toLocaleString()}</div>
          </div>

          <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Key Performance Takeaways:</h3>
          <ul style="color: #334155; line-height: 1.6; font-size: 13px;">
            <li>Objective Accuracy: Evaluated against single/multiple choice keys.</li>
            <li>Sandboxed Code Execution: Code submissions evaluated against test cases with execution limits.</li>
            <li>Proctoring Compliance: Fully monitored under webcam feed and 3-warning anti-cheat policy.</li>
          </ul>

          <div class="footer">
            Report Generated Automatically by ExamiQ Assessment System — ${new Date().toLocaleString()}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(reportContent);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      toast.error('Failed to open print PDF view');
    }
  };

  return (
    <button
      type="button"
      className="btn btn-outline-info btn-sm rounded-pill px-3 font-monospace d-flex align-items-center gap-1.5"
      onClick={handleDownloadPDFReport}
    >
      <FileText size={16} />
      <span>Print / Download PDF Report</span>
    </button>
  );
};

export default PDFPerformanceReport;

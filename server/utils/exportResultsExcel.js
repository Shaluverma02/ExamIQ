const XLSX = require('xlsx');

/**
 * Generates an Excel workbook buffer containing assessment results and summary statistics.
 * @param {Array} results - Populated Result document objects
 * @param {Object} profileMap - Map of userId -> Student profile document
 * @param {Object} options - Optional parameters (e.g. examName, filterSummary)
 * @returns {Buffer} XLSX binary buffer
 */
exports.generateResultsExcel = (results = [], profileMap = {}, options = {}) => {
  // 1. Map results into spreadsheet row objects
  const rows = results.map((r, index) => {
    const student = r.studentId || {};
    const exam = r.examId || {};
    const attempt = r.attemptId || {};
    const profile = profileMap[student._id?.toString()] || {};
    const group = profile.groupId || {};

    // Calculate time taken
    let timeTaken = 'N/A';
    if (attempt.startedAt && attempt.submittedAt) {
      const elapsedSec = Math.max(0, Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000));
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      timeTaken = `${mins}m ${secs}s`;
    } else if (exam.duration && attempt.remainingTime !== undefined) {
      const elapsedSec = Math.max(0, (exam.duration * 60) - attempt.remainingTime);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      timeTaken = `${mins}m ${secs}s`;
    }

    // Coding stats from attempt or result
    const codingSubmissions = attempt.codingSubmissions || [];
    const codingQuestions = exam.codingProblems?.length || (codingSubmissions.length > 0 ? codingSubmissions.length : 0);
    const codingPassed = codingSubmissions.filter((cs) => cs.status === 'Accepted').length;
    const codingFailed = Math.max(0, codingSubmissions.length - codingPassed);

    // Calculate grade
    let grade = 'F';
    if (r.percentage >= 90) grade = 'A+';
    else if (r.percentage >= 80) grade = 'A';
    else if (r.percentage >= 70) grade = 'B';
    else if (r.percentage >= 60) grade = 'C';
    else if (r.percentage >= 50) grade = 'D';

    return {
      'S.No': index + 1,
      'Student Name': student.name || 'N/A',
      'Student ID': profile.rollNumber || student._id?.toString() || 'N/A',
      'Email': student.email || 'N/A',
      'Group': group.name ? `${group.name} (${group.code || ''})` : 'N/A',
      'Course': profile.course || group.course || 'N/A',
      'Department': profile.branch || group.department || 'N/A',
      'Exam Name': exam.title || 'N/A',
      'Exam ID': exam._id?.toString() || 'N/A',
      'Exam Date': r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'N/A',
      'Total Questions': (r.attemptedQuestions || 0) + (r.skippedAnswers || 0),
      'Attempted Questions': r.attemptedQuestions || 0,
      'Correct Answers': r.correctAnswers || 0,
      'Wrong Answers': r.wrongAnswers || 0,
      'Objective Marks': r.objectiveScore || 0,
      'Coding Questions': codingQuestions,
      'Coding Passed': codingPassed,
      'Coding Failed': codingFailed,
      'Coding Marks': r.codingScore || 0,
      'Total Marks': r.totalMarks || 0,
      'Obtained Marks': r.totalScore || 0,
      'Percentage': `${r.percentage || 0}%`,
      'Grade': r.status === 'Pass' ? grade : 'F',
      'Result Status': r.status || 'Fail',
      'Time Taken': timeTaken,
      'Submitted At': r.evaluatedAt ? new Date(r.evaluatedAt).toLocaleString() : 'N/A',
    };
  });

  // 2. Summary Statistics Sheet
  const totalAppeared = results.length;
  const passedCount = results.filter((r) => r.status === 'Pass').length;
  const failedCount = results.filter((r) => r.status === 'Fail').length;

  const scores = results.map((r) => r.totalScore || 0);
  const percentages = results.map((r) => r.percentage || 0);

  const avgScore = totalAppeared > 0 ? (scores.reduce((a, b) => a + b, 0) / totalAppeared).toFixed(2) : 0;
  const maxScore = totalAppeared > 0 ? Math.max(...scores) : 0;
  const minScore = totalAppeared > 0 ? Math.min(...scores) : 0;
  const avgPercentage = totalAppeared > 0 ? (percentages.reduce((a, b) => a + b, 0) / totalAppeared).toFixed(2) : 0;

  const summaryRows = [
    { Parameter: 'Exam Name', Value: options.examTitle || (results[0]?.examId?.title) || 'Assessment Export' },
    { Parameter: 'Total Students Appeared', Value: totalAppeared },
    { Parameter: 'Students Passed', Value: passedCount },
    { Parameter: 'Students Failed', Value: failedCount },
    { Parameter: 'Pass Rate (%)', Value: totalAppeared > 0 ? `${((passedCount / totalAppeared) * 100).toFixed(2)}%` : '0%' },
    { Parameter: 'Average Score', Value: Number(avgScore) },
    { Parameter: 'Highest Score', Value: maxScore },
    { Parameter: 'Lowest Score', Value: minScore },
    { Parameter: 'Average Percentage', Value: `${avgPercentage}%` },
    { Parameter: 'Generated At', Value: new Date().toLocaleString() },
  ];

  // 3. Build Workbook
  const wb = XLSX.utils.book_new();

  // Create Assessment Results Sheet
  const wsResults = XLSX.utils.json_to_sheet(rows);

  // Auto column widths for Sheet 1
  if (rows.length > 0) {
    const colKeys = Object.keys(rows[0]);
    wsResults['!cols'] = colKeys.map((key) => {
      let maxLen = key.length;
      rows.forEach((row) => {
        const valStr = String(row[key] || '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
    });
  }

  XLSX.utils.book_append_sheet(wb, wsResults, 'Assessment Results');

  // Create Summary Sheet
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Return binary buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

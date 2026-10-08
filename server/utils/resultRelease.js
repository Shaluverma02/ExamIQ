const getResultRelease = (result, exam = result?.examId, now = new Date()) => {
  const mode = exam?.resultReleaseMode || 'manual';
  if (mode === 'immediate') return { released: true, releaseAt: null };
  if (mode !== 'delay') return { released: false, releaseAt: null };
  const base = new Date(result?.createdAt || result?.evaluatedAt).getTime();
  const hours = Number(exam?.resultReleaseDelayHours ?? 24);
  const releaseAt = new Date(base + hours * 3600000);
  return { released: Number.isFinite(releaseAt.getTime()) && releaseAt <= now, releaseAt: Number.isFinite(releaseAt.getTime()) ? releaseAt : null };
};
const releasedResultsQuery = async (query, Exam, now = new Date()) => {
  const exams = await Exam.find(query.collegeId ? { collegeId: query.collegeId } : {}).select('_id resultReleaseMode resultReleaseDelayHours').lean();
  const clauses = [];
  for (const exam of exams) {
    if (exam.resultReleaseMode === 'immediate') clauses.push({ examId: exam._id });
    if (exam.resultReleaseMode === 'delay') clauses.push({ examId: exam._id, createdAt: { $lte: new Date(now.getTime() - Number(exam.resultReleaseDelayHours ?? 24) * 3600000) } });
  }
  return { $and: [query, clauses.length ? { $or: clauses } : { _id: { $in: [] } }] };
};
module.exports = { getResultRelease, releasedResultsQuery };

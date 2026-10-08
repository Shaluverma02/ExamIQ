export const SECTION_LABELS = { aptitude: 'Aptitude', reasoning: 'Reasoning', verbal: 'Verbal Ability', general: 'General' };
export function inferSection(question) {
  if (Object.hasOwn(SECTION_LABELS, question.section)) return question.section;
  const text = [question.category, question.topic, ...(question.tags || [])].join(' ').toLowerCase();
  if (/reason|logical/.test(text)) return 'reasoning';
  if (/verbal|english|grammar|language|communication/.test(text)) return 'verbal';
  if (/aptitude|quantitative|arithmetic|numerical/.test(text)) return 'aptitude';
  return 'general';
}
export function buildExamSections(exam = {}) {
  const mapping = new Map((exam.sectionAssignments || []).map(a => [String(a.questionId?._id || a.questionId), a.section]));
  const groups = Object.keys(SECTION_LABELS).map(id => ({ id, label: SECTION_LABELS[id], kind: 'mcq', items: [] }));
  (exam.questions || []).forEach((item, index) => {
    const id = mapping.get(String(item._id)) || inferSection(item);
    (groups.find(g => g.id === id) || groups.at(-1)).items.push({ item, index });
  });
  if (exam.codingProblems?.length) groups.unshift({ id: 'coding', label: 'Coding Test', kind: 'coding', items: exam.codingProblems.map((item,index) => ({ item, index })) });
  return groups.filter(g => g.items.length);
}
export function sectionProgress(section, attempt = {}) {
  const answers = new Map((attempt.answers || []).map(a => [String(a.questionId?._id || a.questionId), a]));
  const submitted = new Set((attempt.codingSubmissions || []).map(a => String(a.problemId?._id || a.problemId)));
  const visited = new Set((attempt.codingVisited || []).map(String));
  const result = { total: section.items.length, attempted: 0, skipped: 0, remaining: 0, review: 0 };
  section.items.forEach(({item}) => {
    const answer = answers.get(String(item._id));
    const attempted = section.kind === 'coding' ? submitted.has(String(item._id)) : Boolean(answer?.selectedOptions?.length);
    const wasVisited = section.kind === 'coding' ? visited.has(String(item._id)) : answer?.isVisited;
    if (attempted) result.attempted++; else if (wasVisited) result.skipped++; else result.remaining++;
    if (answer?.isMarkedForReview && section.kind === 'mcq') result.review++;
  });
  return result;
}

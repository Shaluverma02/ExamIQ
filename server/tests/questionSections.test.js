const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeSection, inferQuestionSection } = require('../utils/questionSections');
function controller(existing = []) {
  const inserted = [], coding = [];
  const Question = { find: () => ({ select: async () => existing }), insertMany: async docs => { inserted.push(...docs); return docs; }, create: async data => { inserted.push(data); return data; } };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/questionController'), 'utf8'), { module, exports: module.exports, console, require(name) { if (name === '../models/Question') return Question; if (name === '../models/CodingProblem') return { create: async data => { coding.push(data); return { _id: 'coding' }; } }; if (name === '../models/TestCase') return { insertMany: async () => [] }; if (name === '../utils/questionSections') return require('../utils/questionSections'); if (name === 'xlsx') return require('xlsx'); throw new Error(name); } });
  return { api: module.exports, inserted, coding };
}
const question = (section, text = 'Question') => ({ question: text, section, options: ['First', 'Second'], correctAnswer: 'First' });
async function runImport(c, body, file) { let result, status; await c.api.importQuestionsJson({ body, file, user: { _id: 'faculty' }, collegeId: 'college' }, { status(value) { status = value; return this; }, json(value) { result = value; } }, error => { throw error; }); return { result, status }; }
test('mixed sections persist individually and coding stays in coding section', async () => {
  const c = controller();
  const { result } = await runImport(c, { questions: [question('aptitude', 'A'), question('reasoning', 'R'), question('Verbal Ability', 'V'), { type: 'coding', title: 'Code', description: 'Solve' }], section: 'general' });
  assert.equal(result.imported, 4);
  assert.deepEqual(c.inserted.map(q => q.section), ['aptitude', 'reasoning', 'verbal']);
  assert.deepEqual(Array.from(result.preview, q => q.section), ['aptitude', 'reasoning', 'verbal', 'coding']);
  assert(c.inserted.every(q => q.collegeId === 'college' && q.createdBy === 'faculty'));
});
test('upload default fills missing sections while explicit sections take priority', async () => {
  const c = controller();
  const { result } = await runImport(c, { questions: [question(undefined, 'A'), question('verbal', 'V'), question('typo', 'Bad')], section: 'reasoning', validateOnly: true });
  assert.equal(result.invalidCount, 1); assert.equal(result.validCount, 2); assert.equal(c.inserted.length, 0);
  assert.deepEqual(Array.from(result.preview.slice(0, 2), q => q.section), ['reasoning', 'verbal']);
});
test('CSV preserves quoted commas and section column', async () => {
  const c = controller();
  const csv = 'question,type,optionA,optionB,correctAnswer,section\n"Choose one, please",single,First,Second,First,aptitude';
  const { result } = await runImport(c, {}, { originalname: 'sections.csv', buffer: Buffer.from(csv) });
  assert.equal(result.imported, 1); assert.equal(c.inserted[0].questionText, 'Choose one, please'); assert.equal(c.inserted[0].section, 'aptitude');
});
test('duplicate checks distinguish sections and match legacy inferred sections', async () => {
  const c = controller([{ questionText: 'Same', category: 'General', section: 'aptitude' }]);
  const { result } = await runImport(c, { questions: [question('aptitude', 'Same'), question('reasoning', 'Same')], skipDuplicates: true });
  assert.equal(result.duplicates, 1); assert.equal(c.inserted.length, 1); assert.equal(c.inserted[0].section, 'reasoning');
});
test('manual creation stores a validated section', async () => {
  const c = controller(); let result, status;
  const res = { status(value) { status = value; return this; }, json(value) { result = value; } };
  await c.api.createQuestion({ body: { ...question('Verbal Ability') }, user: { _id: 'faculty' } }, res, error => { throw error; });
  assert.equal(status, 201); assert.equal(result.question.section, 'verbal');
  await c.api.createQuestion({ body: question('unknown'), user: { _id: 'faculty' } }, res, error => { throw error; }); assert.equal(status, 400);
});
test('legacy inference and schema allow canonical section values', () => {
  assert.equal(inferQuestionSection({ category: 'Logical reasoning' }), 'reasoning'); assert.equal(normalizeSection('Verbal Ability'), 'verbal');
  const Question = require('../models/Question');
  assert(Question.schema.path('section').enumValues.includes('aptitude'));
  assert(!Question.schema.path('section').enumValues.includes('coding'));
});

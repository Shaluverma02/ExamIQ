const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const server = path.join(__dirname, '..');
function load(file, mocks, extra = '') {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(server, file), 'utf8') + extra, { module, exports: module.exports, process: { env: {} }, console, require(name) { return name in mocks ? mocks[name] : require(path.join(server, path.dirname(file), name)); } });
  return module.exports;
}
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }
const member = (id, active = true) => ({ collegeId: { _id: id, name: id, isActive: active }, role: 'faculty' });
function authFixture(memberships, options = {}) {
  let recovered;
  const user = { _id: 'faculty', role: 'faculty', isActive: true, activeCollegeId: 'A', collegeIds: ['A'], save: async () => {} };
  const Membership = { find: () => ({ populate: async () => memberships }), exists: async () => options.suspended || false, findOneAndUpdate: async (_, data) => { recovered = data.collegeId; memberships.push(member(data.collegeId)); } };
  const mocks = { jsonwebtoken: { verify: () => ({ id: 'faculty', activeCollegeId: 'A' }) }, '../models/User': { findById: async () => user }, '../models/Membership': Membership, '../models/Student': { findOne: async () => null }, '../models/Faculty': { findOne: async () => options.profile || null }, '../models/College': { findById: async id => ({ _id: id, isActive: true }), findOne: async () => { throw Error('Should use mapped college ID'); } } };
  return { api: load('middleware/auth.js', mocks), user, recovered: () => recovered };
}
test('faculty college context cannot be changed to an unassigned college header', async () => {
  const f = authFixture([member('A')]); const res = response(); let proceeded = false;
  await f.api.protect({ headers: { authorization: 'Bearer token', 'x-college-id': 'B' } }, res, () => { proceeded = true; });
  assert.equal(res.code, 403); assert.equal(proceeded, false);
});
test('valid membership determines faculty/student data scope and inactive colleges are denied', async () => {
  const f = authFixture([member('A'), member('B', false)]); let proceeded = false;
  const req = { headers: { authorization: 'Bearer token', 'x-college-id': 'A' } };
  await f.api.protect(req, response(), () => { proceeded = true; }); assert(proceeded); assert.equal(req.collegeId, 'A');
  const res = response(); await f.api.protect({ headers: { authorization: 'Bearer token', 'x-college-id': 'B' } }, res, () => { throw Error('Must reject'); }); assert.equal(res.code, 403);
});
test('suspended membership is never silently reactivated', async () => {
  const f = authFixture([], { suspended: true }); const res = response();
  await f.api.protect({ headers: { authorization: 'Bearer token' } }, res, () => { throw Error('Must reject'); });
  assert.equal(res.code, 403); assert.equal(f.recovered(), undefined);
});
test('legacy faculty recovery respects faculty profile college ID', async () => {
  const f = authFixture([], { profile: { collegeId: 'B' } }); const req = { headers: { authorization: 'Bearer token' } };
  await f.api.protect(req, response(), () => {}); assert.equal(f.recovered(), 'B'); assert.equal(req.collegeId, 'B');
});
function groupFixture() {
  let saves = 0, updates = [];
  const group = { _id: 'group', college: 'A', code: 'GROUP', save: async () => { saves++; } };
  const mocks = { '../models/Group': { findOne: async () => group }, '../models/Student': { find: query => ({ select: async () => query.collegeId === 'A' ? query.userId.$in.filter(id => id === 'studentA').map(userId => ({ userId })) : [] }), updateMany: async query => { updates.push(query); } }, '../models/User': {}, '../models/ExamAssignment': {}, '../models/Result': {} };
  return { api: load('controllers/groupController.js', mocks), group, saves: () => saves, updates };
}
test('roster rejects cross-college students before any group or profile mutation', async () => {
  const f = groupFixture(); const res = response();
  await f.api.assignStudentsToGroup({ collegeId: 'A', params: { id: 'group' }, body: { studentIds: ['studentA', 'studentB'] } }, res, error => { throw error; });
  assert.equal(res.code, 400); assert.equal(f.saves(), 0); assert.equal(f.updates.length, 0);
});
test('valid roster updates only same-college student profiles', async () => {
  const f = groupFixture(); const res = response();
  await f.api.assignStudentsToGroup({ collegeId: 'A', params: { id: 'group' }, body: { studentIds: ['studentA'] } }, res, error => { throw error; });
  assert.equal(res.code, 200); assert.equal(f.saves(), 1); assert(f.updates.every(query => query.collegeId === 'A'));
});
test('group update rejects a college name or student roster from another college', async () => {
  const f = groupFixture(); for (const body of [{ students: ['studentB'] }, { college: 'B' }]) {
    const res = response(); await f.api.updateGroup({ collegeId: 'A', college: { name: 'A' }, params: { id: 'group' }, body }, res, error => { throw error; }); assert.equal(res.code, 400);
  } assert.equal(f.saves(), 0);
});
test('exam create rejects questions and target groups belonging to another college', async () => {
  let creates = 0;
  const mocks = { '../models/Exam': { create: async data => { creates++; return data; } }, '../models/Question': { countDocuments: async query => query._id.$in.every(id => id === 'questionA') && query.collegeId === 'A' ? query._id.$in.length : 0 }, '../models/CodingProblem': { countDocuments: async () => 0 }, '../models/Group': { countDocuments: async () => 0 }, '../models/ExamAttempt': {}, '../models/CodingSubmission': {}, '../models/Result': {}, '../models/Certificate': {}, '../models/ExamAssignment': {}, './examAssignmentController': {}, '../utils/createNotifications': async () => {}, crypto: require('node:crypto'), '../utils/resultRelease': require('../utils/resultRelease') };
  const api = load('controllers/examController.js', mocks);
  for (const body of [{ questions: ['questionB'] }, { targetGroups: ['groupB'] }, { codingProblems: ['codingB'] }]) { const res = response(); await api.createExam({ collegeId: 'A', user: { _id: 'faculty' }, body }, res, error => { throw error; }); assert.equal(res.code, 400); }
  assert.equal(creates, 0); const res = response(); await api.createExam({ collegeId: 'A', user: { _id: 'faculty' }, body: { questions: ['questionA'], collegeId: 'B' } }, res, error => { throw error; }); assert.equal(res.code, 201); assert.equal(res.data.exam.collegeId, 'A');
});

test('faculty student listing uses active same-college memberships', async () => {
  let membershipQuery, userQuery;
  const users = { sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => [{ _id: 'studentA', name: 'Student A' }] };
  const profiles = { populate() { return this; }, lean: async () => [] };
  const mocks = { '../models/User': { countDocuments: async query => { userQuery = query; return 1; }, find: () => users }, '../models/Student': { find: query => { assert.equal(query.collegeId, 'A'); return profiles; } }, '../models/Faculty': {}, '../models/Course': {}, '../models/Category': {}, '../models/Exam': {}, '../models/Result': {}, '../models/AuditLog': {}, '../models/FormSchema': {}, '../models/Membership': { find: query => { membershipQuery = query; return { select: async () => [{ userId: 'studentA' }] }; } }, '../models/Group': {}, '../utils/sendEmail': async () => {}, bcryptjs: {}, './../models/College': {} };
  const api = load('controllers/adminController.js', mocks); const res = response();
  await api.getUsers({ collegeId: 'A', user: { role: 'faculty' }, query: { role: 'student' } }, res, error => { throw error; });
  assert.equal(membershipQuery.collegeId, 'A'); assert.equal(membershipQuery.status, 'active'); assert.equal(membershipQuery.role, 'student'); assert.deepEqual(Array.from(userQuery._id.$in), ['studentA']); assert.equal(res.data.users.length, 1);
});
test('student direct exam ID lookup is scoped to the active college', async () => {
  let lookup;
  const chain = { populate() { return this; }, then(resolve) { return Promise.resolve(null).then(resolve); } };
  const mocks = { '../models/Exam': { findOne: query => { lookup = query; return chain; } }, '../models/Question': {}, '../models/CodingProblem': {}, '../models/ExamAttempt': {}, '../models/CodingSubmission': {}, '../models/Result': {}, '../models/Certificate': {}, '../models/ExamAssignment': {}, './examAssignmentController': {}, '../utils/createNotifications': async () => {}, crypto: require('node:crypto'), '../utils/resultRelease': require('../utils/resultRelease') };
  const res = response(); await load('controllers/examController.js', mocks).getExamById({ collegeId: 'A', user: { _id: 'studentA', role: 'student' }, params: { id: 'examB' } }, res, error => { throw error; });
  assert.equal(lookup.collegeId, 'A'); assert.equal(res.code, 404); assert.equal(res.data.exam, undefined);
});

test('Super Admin can manage colleges after deleting the last active workspace', async () => {
  const f = authFixture([], { suspended: true }); f.user.role = 'admin'; let proceeded = false;
  await f.api.protect({ headers: { authorization: 'Bearer token' }, baseUrl: '/api/colleges', path: '/' }, response(), () => { proceeded = true; }); assert(proceeded);
  const res = response(); await f.api.protect({ headers: { authorization: 'Bearer token' }, baseUrl: '/api/exams', path: '/' }, res, () => { throw Error('College data needs a context'); }); assert.equal(res.code, 403);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, mocks) { const module = { exports: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { module, exports: module.exports, console, Date, require(name) { if (name in mocks) return mocks[name]; throw Error(name); } }); return module.exports; }
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }
function fixture(activeAttempt = false) {
  let saves = 0, userCreates = 0, deletedUsers = [], collegeQueries = [], collegeCreateData = null;
  const college = { _id: 'A', name: 'College A', isActive: true, settings: { allowSelfRegistration: true }, save: async () => { saves++; }, toObject() { return { _id: this._id, name: this.name }; } };
  const chain = { select() { return this; }, sort() { return this; }, populate() { return this; }, then(resolve) { return Promise.resolve([college]).then(resolve); } };
  const mocks = { '../models/College': { find: query => { collegeQueries.push(query); return chain; }, findOne: async () => college, findById: async () => college, create: async data => { collegeCreateData = data; return { ...data, _id: 'A' }; }, findByIdAndDelete: async () => {} }, '../models/Membership': { findOneAndUpdate: async () => {}, create: async data => data, deleteMany: async () => {}, find: () => ({ populate: async () => [{ collegeId: 'A', userId: { name: 'Admin A', email: 'a@example.com' } }] }) }, '../models/User': { findByIdAndUpdate: async () => {}, findOne: async () => null, create: async data => { userCreates++; return { ...data, _id: 'adminA', toObject() { return { ...this }; } }; }, findByIdAndDelete: async id => { deletedUsers.push(id); } }, '../models/ExamAttempt': { exists: async () => activeAttempt } };
  return { mocks, college, saves: () => saves, userCreates: () => userCreates, deletedUsers, collegeQueries, collegeCreateData: () => collegeCreateData };
}
test('public colleges include only institutions accepting open student registrations', async () => {
  const f = fixture(); const res = response();
  await load('controllers/collegeController.js', f.mocks).getPublicColleges({}, res, error => { throw error; });
  assert.equal(f.collegeQueries[0].isActive, true);
  assert.equal(f.collegeQueries[0]['settings.allowSelfRegistration'], true);
  assert.equal(f.collegeQueries[0]['settings.requireInviteCode'].$ne, true);
  assert.equal(res.data.colleges.length, 1);
});
test('college creation no longer requires or creates administrator credentials', async () => {
  const f = fixture(); const res = response();
  await load('controllers/collegeController.js', f.mocks).createCollege({ body: { name: 'College A', code: 'ca' }, user: { _id: 'superadmin' } }, res, error => { throw error; });
  assert.equal(res.code, 201); assert.equal(f.userCreates(), 0); assert.equal(res.data.college.code, 'CA'); assert.equal(res.data.collegeAdmin, undefined); assert.equal(f.collegeCreateData().settings, undefined);
});
test('super admin cannot configure student registration when creating or editing a college', async () => {
  const f = fixture(); const api = load('controllers/collegeController.js', f.mocks);
  const createRes = response();
  await api.createCollege({ body: { name: 'College A', code: 'ca', settings: { allowSelfRegistration: false } }, user: { _id: 'superadmin' } }, createRes, error => { throw error; });
  assert.equal(createRes.code, 403);
  assert.equal(f.collegeCreateData(), null);
  const updateRes = response();
  await api.updateCollege({ params: { id: 'A' }, user: { role: 'admin' }, body: { settings: { allowSelfRegistration: false } } }, updateRes, error => { throw error; });
  assert.equal(updateRes.code, 403);
  assert.equal(f.college.settings.allowSelfRegistration, true);
  assert.equal(f.saves(), 0);
});
test('college delete removes access while preserving linked academic records', async () => {
  const f = fixture(); const res = response();
  await load('controllers/collegeController.js', f.mocks).deleteCollege({ user: { role: 'admin' }, params: { id: 'A' } }, res, error => { throw error; });
  assert.equal(res.code, 200); assert.equal(f.college.isDeleted, true); assert.equal(f.college.isActive, false); assert.equal(f.college.settings.allowSelfRegistration, false); assert(f.college.deletedAt); assert.equal(f.saves(), 1); assert.equal(f.deletedUsers.length, 0);
});
test('college deletion is blocked during an active exam and for non-superadmins', async () => {
  const f = fixture(true); const api = load('controllers/collegeController.js', f.mocks);
  for (const [role, expected] of [['admin', 409], ['college_admin', 403], ['faculty', 403]]) { const res = response(); await api.deleteCollege({ user: { role }, params: { id: 'A' } }, res, error => { throw error; }); assert.equal(res.code, expected); } assert.equal(f.saves(), 0);
});
test('deleted colleges are hidden and existing admins appear on their college card', async () => {
  const f = fixture(); const res = response(); await load('controllers/collegeController.js', f.mocks).getColleges({}, res, error => { throw error; });
  assert.equal(f.collegeQueries[0].isDeleted.$ne, true); assert.equal(res.data.colleges[0].admins[0].name, 'Admin A');
});
test('deleted college cannot be reactivated through update', async () => {
  const f = fixture(); f.college.isDeleted = true; const res = response(); await load('controllers/collegeController.js', f.mocks).updateCollege({ params: { id: 'A' }, user: { role: 'admin' }, body: { isActive: true } }, res, error => { throw error; }); assert.equal(res.code, 404); assert.equal(f.saves(), 0);
});
function adminFixture() { const f = fixture(); Object.assign(f.mocks, { '../models/Student': {}, '../models/Faculty': {}, '../models/Course': {}, '../models/Category': {}, '../models/Exam': {}, '../models/Result': {}, '../models/AuditLog': {}, '../models/FormSchema': {}, '../models/Group': {}, '../utils/sendEmail': async () => {}, bcryptjs: { hash: async password => 'hashed-' + password }, './../models/College': f.mocks['../models/College'] }); return f; }
const adminReq = { user: { _id: 'superadmin' }, body: { name: 'Admin A', email: 'a@example.com', password: 'secret123', collegeId: 'A' } };
test('separate admin action creates college-scoped account without returning password', async () => {
  const f = adminFixture(); const res = response(); await load('controllers/adminController.js', f.mocks).createCollegeAdmin(adminReq, res, error => { throw error; }); assert.equal(res.code, 201); assert.equal(res.data.user.activeCollegeId, 'A'); assert.equal(res.data.user.collegeIds[0], 'A'); assert.equal(res.data.user.password, undefined); assert.equal(res.data.membership.collegeId, 'A');
});
test('admin creation rejects deleted/inactive colleges and short passwords', async () => {
  for (const mode of ['deleted', 'inactive', 'short']) { const f = adminFixture(); if (mode === 'deleted') f.college.isDeleted = true; if (mode === 'inactive') f.college.isActive = false; const res = response(); await load('controllers/adminController.js', f.mocks).createCollegeAdmin({ ...adminReq, body: { ...adminReq.body, password: mode === 'short' ? '123' : 'secret123' } }, res, error => { throw error; }); assert.equal(res.code, mode === 'deleted' ? 404 : 400); assert.equal(f.userCreates(), 0); }
});
test('failed membership creation rolls back the new administrator account', async () => {
  const f = adminFixture(); f.mocks['../models/Membership'].create = async () => { throw Error('membership failed'); }; let error; await load('controllers/adminController.js', f.mocks).createCollegeAdmin(adminReq, response(), value => { error = value; }); assert(error); assert.deepEqual(f.deletedUsers, ['adminA']);
});
test('super admin can delete college administrator', async () => {
  const f = adminFixture();
  const deletedMemberships = [];
  f.mocks['../models/Membership'].findOne = () => ({
    populate: async () => ({
      _id: 'm1',
      collegeId: 'A',
      role: 'college_admin',
      userId: { _id: 'adminA', collegeIds: ['A'], activeCollegeId: 'A' },
    }),
  });
  f.mocks['../models/Membership'].findByIdAndDelete = async (id) => { deletedMemberships.push(id); };
  f.mocks['../models/Membership'].find = () => Promise.resolve([]);
  const res = response();
  await load('controllers/adminController.js', f.mocks).deleteCollegeAdmin({ user: { _id: 'superadmin', role: 'admin' }, params: { id: 'm1' } }, res, error => { throw error; });
  assert.equal(res.code, 200);
  assert.deepEqual(deletedMemberships, ['m1']);
  assert.deepEqual(f.deletedUsers, ['adminA']);
});
test('delete college administrator rejects non-superadmin and self-deletion', async () => {
  const f = adminFixture();
  f.mocks['../models/Membership'].findOne = () => ({
    populate: async () => ({
      _id: 'm1',
      collegeId: 'A',
      role: 'college_admin',
      userId: { _id: 'superadmin' },
    }),
  });
  const resNonAdmin = response();
  await load('controllers/adminController.js', f.mocks).deleteCollegeAdmin({ user: { _id: 'faculty1', role: 'faculty' }, params: { id: 'm1' } }, resNonAdmin, error => { throw error; });
  assert.equal(resNonAdmin.code, 403);
  const resSelf = response();
  await load('controllers/adminController.js', f.mocks).deleteCollegeAdmin({ user: { _id: 'superadmin', role: 'admin' }, params: { id: 'm1' } }, resSelf, error => { throw error; });
  assert.equal(resSelf.code, 400);
});


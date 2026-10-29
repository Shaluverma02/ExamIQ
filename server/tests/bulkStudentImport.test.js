const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const XLSX = require('xlsx');

function createFixture(fileName, rows) {
  const module = { exports: {} };
  const users = new Map();
  const students = [];
  const memberships = [];
  const auditLogs = [];
  let nextId = 0;
  const mocks = {
    '../models/User': {
      exists: async ({ email }) => users.has(email),
      create: async (data) => {
        if (users.has(data.email)) {
          const error = new Error('Duplicate email');
          error.code = 11000;
          throw error;
        }
        const user = { _id: `user-${++nextId}`, ...data };
        users.set(data.email, user);
        return user;
      },
      findByIdAndDelete: async (id) => {
        for (const [email, user] of users) if (user._id === id) users.delete(email);
      },
    },
    '../models/Student': {
      exists: async ({ rollNumber }) => students.some((student) => student.rollNumber === rollNumber),
      create: async (data) => { students.push(data); return data; },
      deleteMany: async ({ userId }) => {
        for (let index = students.length - 1; index >= 0; index -= 1) {
          if (students[index].userId === userId) students.splice(index, 1);
        }
      },
    },
    '../models/Faculty': {},
    '../models/Course': {},
    '../models/Category': {},
    '../models/Exam': {},
    '../models/Result': {},
    '../models/AuditLog': { create: async (data) => auditLogs.push(data) },
    '../models/FormSchema': {},
    '../models/Membership': {
      create: async (data) => memberships.push(data),
      deleteMany: async ({ userId }) => {
        for (let index = memberships.length - 1; index >= 0; index -= 1) {
          if (memberships[index].userId === userId) memberships.splice(index, 1);
        }
      },
    },
    '../models/Group': {},
    '../utils/sendEmail': async () => {},
    bcryptjs: { hash: async (password) => `hashed:${password}` },
    './../models/College': { findById: async () => ({ name: 'Example College', isActive: true, isDeleted: false }) },
    xlsx: XLSX,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'controllers', 'adminController.js'), 'utf8'), {
    module,
    exports: module.exports,
    console,
    Date,
    Buffer,
    require(name) {
      if (name in mocks) return mocks[name];
      throw Error(name);
    },
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Students');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: fileName.endsWith('.csv') ? 'csv' : 'xlsx' });
  const req = {
    collegeId: 'college-1',
    membershipRole: 'college_admin',
    user: { _id: 'admin-1' },
    ip: '127.0.0.1',
    file: { originalname: fileName, buffer },
  };
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
  return { api: module.exports, req, res, users, students, memberships, auditLogs };
}

test('bulk student import creates college-scoped accounts from an Excel file', async () => {
  const fixture = createFixture('students.xlsx', [
    { name: 'Student One', email: 'ONE@example.test', password: 'pass123', phone: '1234567890', rollNumber: 'R-1', course: 'BTech' },
    { name: 'Student Two', email: 'two@example.test', password: 'pass456', rollNumber: 'R-2', course: 'BCA' },
  ]);
  let forwardedError;

  await fixture.api.importStudents(fixture.req, fixture.res, (error) => { forwardedError = error; });

  assert.equal(forwardedError, undefined);
  assert.equal(fixture.res.code, 200);
  assert.equal(fixture.res.data.importedCount, 2);
  assert.equal(fixture.res.data.failedCount, 0);
  assert.equal(fixture.users.get('one@example.test').password, 'hashed:pass123');
  assert.deepEqual(fixture.students.map((student) => student.collegeId), ['college-1', 'college-1']);
  assert.equal(fixture.memberships.length, 2);
  assert.equal(fixture.auditLogs.length, 2);
  assert.equal(JSON.stringify(fixture.res.data).includes('pass123'), false);
});

test('bulk student import reports row validation and duplicate errors without stopping valid rows', async () => {
  const fixture = createFixture('students.csv', [
    { name: 'Student One', email: 'one@example.test', password: 'pass123', rollNumber: 'R-1' },
    { name: 'Student Duplicate', email: 'ONE@example.test', password: 'pass123', rollNumber: 'R-2' },
    { name: '', email: 'invalid@example.test', password: 'pass123', rollNumber: 'R-3' },
    { name: 'Student Two', email: 'two@example.test', password: 'pass456', rollNumber: 'R-4' },
  ]);
  let forwardedError;

  await fixture.api.importStudents(fixture.req, fixture.res, (error) => { forwardedError = error; });

  assert.equal(forwardedError, undefined);
  assert.equal(fixture.res.data.importedCount, 2);
  assert.equal(fixture.res.data.failedCount, 2);
  assert.equal(fixture.res.data.results[1].error, 'Email is repeated in this file');
  assert.match(fixture.res.data.results[2].error, /Name is required/);
  assert.equal(fixture.users.size, 2);
});

test('bulk student import rejects unsupported file types and missing required columns', async () => {
  const unsupported = createFixture('students.json', [{ name: 'Student', email: 's@example.test', password: 'pass123' }]);
  await unsupported.api.importStudents(unsupported.req, unsupported.res, (error) => { throw error; });
  assert.equal(unsupported.res.code, 400);
  assert.match(unsupported.res.data.message, /Only \.csv and \.xlsx/);

  const missingColumns = createFixture('students.csv', [{ fullName: 'Student', email: 's@example.test' }]);
  await missingColumns.api.importStudents(missingColumns.req, missingColumns.res, (error) => { throw error; });
  assert.equal(missingColumns.res.code, 400);
  assert.match(missingColumns.res.data.message, /password/);
});

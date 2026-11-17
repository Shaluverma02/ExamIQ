const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const loadController = (mocks) => {
  const module = { exports: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../controllers/examAssignmentController.js'), 'utf8'),
    {
      exports: module.exports,
      module,
      require: (name) => (name in mocks ? mocks[name] : {}),
      console,
      Date,
      Set,
      Map,
      JSON,
      String,
      Array,
      Boolean,
      Number,
      process,
    }
  );
  return module.exports;
};

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.data = data;
    return this;
  },
});

const createAssignment = async (exam, body) => {
  let created;
  const assigned = { _id: 'assignment-id' };
  const populated = {
    populate() {
      return this;
    },
  };
  const mocks = {
    '../models/Exam': { findOne: async () => exam },
    '../models/ExamAssignment': {
      find: async () => [],
      create: async (data) => {
        created = data;
        return assigned;
      },
      findById: () => populated,
    },
    '../models/Student': {
      find: () => ({ select: async () => [{ userId: 'student-id' }] }),
    },
    '../models/Group': {},
    '../models/ExamAttempt': {},
    '../utils/createNotifications': async () => {},
    '../utils/assignmentStatus': () => ({}),
  };
  const res = response();
  await loadController(mocks).createAssignment({
    body: { examId: 'exam-id', studentIds: ['student-id'], ...body },
    user: { _id: 'faculty-id', role: 'faculty' },
  }, res, (error) => {
    throw error;
  });
  return { created, res };
};

test('assignment inherits the exam schedule, duration, and retake limit when omitted', async () => {
  const exam = {
    _id: 'exam-id',
    facultyId: 'faculty-id',
    startDate: new Date('2026-11-18T10:00:00.000Z'),
    endDate: new Date('2026-11-18T12:00:00.000Z'),
    duration: 45,
    allowRetake: true,
    maxAttempts: 4,
    title: 'Saved exam',
  };
  const { created, res } = await createAssignment(exam, {});

  assert.equal(res.statusCode, 201);
  assert.equal(created.startDate, exam.startDate);
  assert.equal(created.endDate, exam.endDate);
  assert.equal(created.duration, 45);
  assert.equal(created.attemptsAllowed, 4);
});

test('assignment preserves unlimited exam attempts when no limit is provided', async () => {
  const exam = {
    _id: 'exam-id',
    facultyId: 'faculty-id',
    startDate: new Date('2026-11-18T10:00:00.000Z'),
    endDate: new Date('2026-11-18T12:00:00.000Z'),
    duration: 45,
    allowRetake: true,
    maxAttempts: 0,
    title: 'Unlimited exam',
  };
  const { created, res } = await createAssignment(exam, {});

  assert.equal(res.statusCode, 201);
  assert.equal(created.attemptsAllowed, 0);
});

test('disabled exam retakes default to one assignment attempt', async () => {
  const exam = {
    _id: 'exam-id',
    facultyId: 'faculty-id',
    startDate: new Date('2026-11-18T10:00:00.000Z'),
    endDate: new Date('2026-11-18T12:00:00.000Z'),
    duration: 45,
    allowRetake: false,
    maxAttempts: 4,
    title: 'Single-attempt exam',
  };
  const { created, res } = await createAssignment(exam, {});

  assert.equal(res.statusCode, 201);
  assert.equal(created.attemptsAllowed, 1);
});

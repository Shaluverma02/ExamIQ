const test = require('node:test');
const assert = require('node:assert/strict');
const getAssignmentStatus = require('../utils/assignmentStatus');

const now = new Date('2026-10-05T12:00:00.000Z');
const future = new Date('2026-10-06T12:00:00.000Z');
const past = new Date('2026-10-04T12:00:00.000Z');

test('scheduled assignment remains upcoming until its opening time', () => {
  const result = getAssignmentStatus({ now, startDate: future, endDate: future, attemptsRemaining: 1 });
  assert.equal(result.computedStatus, 'upcoming');
  assert.equal(result.isUpcoming, true);
});

test('started attempt can be resumed while its assignment is open', () => {
  const result = getAssignmentStatus({ now, startDate: past, endDate: future, attemptStatus: 'started', attemptsRemaining: 1 });
  assert.equal(result.computedStatus, 'in_progress');
});

test('completed attempt takes precedence over elapsed schedule', () => {
  const result = getAssignmentStatus({ now, startDate: past, endDate: past, attemptStatus: 'evaluated', attemptsRemaining: 0 });
  assert.equal(result.computedStatus, 'completed');
});

test('expired assignment cannot be resumed', () => {
  const result = getAssignmentStatus({ now, startDate: past, endDate: past, attemptStatus: 'started', attemptsRemaining: 1 });
  assert.equal(result.computedStatus, 'expired');
  assert.equal(result.isInProgress, false);
});

test('exam and notification controllers load with their model dependencies', () => {
  assert.doesNotThrow(() => require('../controllers/examController'));
  assert.doesNotThrow(() => require('../controllers/examAssignmentController'));
  assert.doesNotThrow(() => require('../controllers/notificationController'));
});

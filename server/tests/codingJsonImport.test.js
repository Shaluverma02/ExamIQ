const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const mongoose = require('mongoose');
const TestCase = require('../models/TestCase');

const loadController = () => {
  const savedProblems = [];
  const savedTestCases = [];
  const mocks = {
    '../models/Question': {
      find: () => ({ select: async () => [] }),
      insertMany: async (items) => items,
    },
    '../models/CodingProblem': {
      create: async (data) => {
        const problem = { _id: `coding-${savedProblems.length + 1}`, ...data };
        savedProblems.push(problem);
        return problem;
      },
    },
    '../models/TestCase': {
      insertMany: async (items) => {
        savedTestCases.push(...items);
        return items;
      },
    },
    '../utils/questionSections': require('../utils/questionSections'),
  };
  const module = { exports: {} };

  vm.runInNewContext(
    fs.readFileSync(require.resolve('../controllers/questionController'), 'utf8'),
    {
      module,
      exports: module.exports,
      console,
      require(name) {
        if (name in mocks) return mocks[name];
        throw new Error(`Unexpected dependency: ${name}`);
      },
    }
  );

  return { controller: module.exports, savedProblems, savedTestCases };
};

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const importFile = async (controller, contents, body = {}) => {
  const res = response();
  await controller.importQuestionsJson({
    body,
    file: { originalname: 'coding-problems.json', buffer: Buffer.from(JSON.stringify(contents)) },
    user: { _id: 'faculty-a' },
    collegeId: 'college-a',
  }, res, (error) => { throw error; });
  return res;
};

test('imports coding problems using the coding JSON template format and saves test cases', async () => {
  const { controller, savedProblems, savedTestCases } = loadController();
  const problem = {
    type: 'coding',
    title: 'Two Sum',
    description: 'Return the indices of two values that add up to the target.',
    difficulty: 'easy',
    section: 'general',
    category: 'Data Structures',
    topic: 'Arrays',
    marks: 5,
    timeLimit: 2,
    memoryLimit: 128,
    inputFormat: 'N, the array, and the target',
    outputFormat: 'Two indices separated by a space',
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true },
    ],
  };

  const res = await importFile(controller, [problem]);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.imported, 1);
  assert.equal(res.body.invalidCount, 0);
  assert.equal(savedProblems.length, 1);
  assert.equal(savedProblems[0].title, problem.title);
  assert.equal(savedProblems[0].category, problem.category);
  assert.equal(savedProblems[0].collegeId, 'college-a');
  assert.equal(savedProblems[0].createdBy, 'faculty-a');
  assert.equal(savedProblems[0].testCases, undefined);
  assert.equal(savedTestCases.length, 2);
  assert.equal(savedTestCases[0].input, problem.testCases[0].input);
  assert.equal(savedTestCases[0].expectedOutput, '0 1');
  assert.equal(savedTestCases[0].isHidden, false);
  assert.equal(savedTestCases[1].isHidden, true);
  assert.equal(savedTestCases[1].order, 2);
});

test('reports malformed coding test cases during validation instead of attempting a save', async () => {
  const { controller, savedProblems, savedTestCases } = loadController();
  const res = await importFile(controller, [{
    type: 'coding',
    title: 'Broken test case',
    description: 'A problem with incomplete expected output.',
    testCases: [{ input: '1' }],
  }], { validateOnly: 'true' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.invalidCount, 1);
  assert.equal(res.body.imported, 0);
  assert.match(res.body.errors[0].message, /requires input and expectedOutput/);
  assert.equal(savedProblems.length, 0);
  assert.equal(savedTestCases.length, 0);
});

test('accepts output as a legacy alias for expectedOutput', async () => {
  const { controller, savedTestCases } = loadController();
  const res = await importFile(controller, [{
    type: 'coding',
    title: 'Legacy output key',
    description: 'Supports the previous test case output key.',
    testCases: [{ input: 'input', output: 'result' }],
  }]);

  assert.equal(res.body.imported, 1);
  assert.equal(savedTestCases[0].expectedOutput, 'result');
});

test('allows an explicitly empty expected output but still requires the field', async () => {
  const codingProblemId = new mongoose.Types.ObjectId();
  const emptyOutput = new TestCase({ codingProblemId, input: '0\n', expectedOutput: '' });
  await assert.doesNotReject(emptyOutput.validate());

  const missingOutput = new TestCase({ codingProblemId, input: '0\n' });
  await assert.rejects(missingOutput.validate(), /expectedOutput.*required/i);
});

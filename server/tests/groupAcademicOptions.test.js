const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const collegeId = 'college-a';
const courseId = 'course-a';
const categoryId = 'category-a';

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

const loadController = (overrides = {}) => {
  const calls = { courseQuery: null, categoryQuery: null, createdGroup: null };
  const courses = overrides.courses || [{ _id: courseId, name: 'Computer Science', code: 'CS' }];
  const categories = overrides.categories || [{ _id: categoryId, name: 'Programming', courseId: { _id: courseId, name: 'Computer Science', code: 'CS' } }];
  const selectedCourse = Object.hasOwn(overrides, 'selectedCourse')
    ? overrides.selectedCourse
    : { _id: courseId, name: 'Computer Science', code: 'CS' };
  const selectedCategory = Object.hasOwn(overrides, 'selectedCategory')
    ? overrides.selectedCategory
    : { _id: categoryId, name: 'Programming', courseId };
  const mocks = {
    '../models/Group': {
      findOne: async () => overrides.group || null,
      create: async (data) => {
        calls.createdGroup = data;
        return { _id: 'group-a', ...data };
      },
    },
    '../models/Student': {},
    '../models/User': {},
    '../models/ExamAssignment': {},
    '../models/Result': {},
    '../models/Course': {
      find(query) {
        calls.courseQuery = query;
        return {
          select() { return this; },
          sort: async () => courses,
        };
      },
      findOne: async (query) => {
        calls.courseQuery = query;
        return selectedCourse;
      },
    },
    '../models/Category': {
      find(query) {
        calls.categoryQuery = query;
        return {
          select() { return this; },
          populate() { return this; },
          sort: async () => categories,
        };
      },
      findOne: async (query) => {
        calls.categoryQuery = query;
        return selectedCategory;
      },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../controllers/groupController.js'), 'utf8'),
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
  return { controller: module.exports, calls };
};

test('academic options are scoped to the active college', async () => {
  const { controller, calls } = loadController();
  const res = response();

  await controller.getAcademicOptions({ collegeId }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 200);
  assert.equal(calls.courseQuery.collegeId, collegeId);
  assert.equal(calls.categoryQuery.collegeId, collegeId);
  assert.equal(res.body.courses.length, 1);
  assert.equal(res.body.categories[0].courseId._id, courseId);
});

test('group creation stores selected course and branch category without a department', async () => {
  const { controller, calls } = loadController();
  const res = response();

  await controller.createGroup({
    collegeId,
    college: { name: 'College A' },
    user: { _id: 'user-a' },
    body: {
      name: 'CS Batch 1',
      code: 'CS1',
      courseId,
      categoryId,
      department: 'Software Engineering',
    },
  }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 201);
  assert.equal(calls.createdGroup.course, 'Computer Science');
  assert.equal(calls.createdGroup.courseId, courseId);
  assert.equal(calls.createdGroup.category, 'Programming');
  assert.equal(calls.createdGroup.categoryId, categoryId);
  assert.equal(calls.createdGroup.department, undefined);
});

test('group creation rejects a category that does not belong to the selected course', async () => {
  const { controller, calls } = loadController({ selectedCategory: null });
  const res = response();

  await controller.createGroup({
    collegeId,
    college: { name: 'College A' },
    user: { _id: 'user-a' },
    body: { name: 'CS Batch 1', code: 'CS1', courseId, categoryId },
  }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 404);
  assert.equal(calls.createdGroup, null);
  assert.equal(calls.categoryQuery.courseId, courseId);
});

test('group creation rejects a course from another college', async () => {
  const { controller, calls } = loadController({ selectedCourse: null });
  const res = response();

  await controller.createGroup({
    collegeId,
    college: { name: 'College A' },
    user: { _id: 'user-a' },
    body: { name: 'CS Batch 1', code: 'CS1', courseId },
  }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 404);
  assert.equal(calls.courseQuery.collegeId, collegeId);
  assert.equal(calls.createdGroup, null);
});

test('group updates reject a course from another college', async () => {
  const group = {
    _id: 'group-a',
    college: 'College A',
    courseId,
    categoryId,
    save: async () => assert.fail('group should not be saved'),
  };
  const { controller, calls } = loadController({ group, selectedCourse: null });
  const res = response();

  await controller.updateGroup({
    params: { id: 'group-a' },
    collegeId,
    college: { name: 'College A' },
    body: { courseId },
  }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 404);
  assert.equal(calls.courseQuery.collegeId, collegeId);
});

test('group updates reject a category that belongs to a different course', async () => {
  const group = {
    _id: 'group-a',
    college: 'College A',
    courseId,
    categoryId,
    save: async () => assert.fail('group should not be saved'),
  };
  const { controller, calls } = loadController({ group, selectedCategory: null });
  const res = response();

  await controller.updateGroup({
    params: { id: 'group-a' },
    collegeId,
    college: { name: 'College A' },
    body: { courseId, categoryId },
  }, res, (error) => { throw error; });

  assert.equal(res.statusCode, 404);
  assert.equal(calls.categoryQuery.courseId, courseId);
});

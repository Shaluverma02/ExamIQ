const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadAdminController(mocks) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'controllers', 'adminController.js'), 'utf8'), {
    module,
    exports: module.exports,
    console,
    Date,
    require(name) {
      if (name in mocks) return mocks[name];
      throw Error(name);
    },
  });
  return module.exports;
}

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

const courseId = 'a'.repeat(24);
const categoryId = 'b'.repeat(24);

function fixture({ course = { _id: courseId }, category = null } = {}) {
  const createdCategories = [];
  let courseQuery;
  let categoryQuery;
  const mocks = {
    '../models/User': {},
    '../models/Student': {},
    '../models/Faculty': {},
    '../models/Course': {
      findOne: async (query) => {
        courseQuery = query;
        return course;
      },
    },
    '../models/Category': {
      create: async (data) => {
        const created = { _id: categoryId, ...data };
        createdCategories.push(created);
        return created;
      },
      findOne: async (query) => {
        categoryQuery = query;
        return category;
      },
    },
    '../models/Exam': {},
    '../models/Result': {},
    '../models/AuditLog': {},
    '../models/FormSchema': {},
    '../models/Membership': {},
    '../models/Group': {},
    '../utils/sendEmail': async () => {},
    bcryptjs: {},
    './../models/College': {},
  };

  return {
    api: loadAdminController(mocks),
    createdCategories,
    getCourseQuery: () => courseQuery,
    getCategoryQuery: () => categoryQuery,
  };
}

const request = {
  collegeId: 'college-a',
  user: { _id: 'admin-a' },
};

test('category creation requires a course', async () => {
  const f = fixture();
  const res = response();

  await f.api.createCategory({ ...request, body: { name: 'Computer Science' } }, res, (error) => { throw error; });

  assert.equal(res.code, 400);
  assert.equal(f.createdCategories.length, 0);
});

test('category creation only accepts courses from the active college', async () => {
  const f = fixture({ course: null });
  const res = response();

  await f.api.createCategory({ ...request, body: { name: 'Computer Science', courseId: 'c'.repeat(24) } }, res, (error) => { throw error; });

  assert.equal(res.code, 404);
  assert.equal(f.getCourseQuery()._id, 'c'.repeat(24));
  assert.equal(f.getCourseQuery().collegeId, 'college-a');
  assert.equal(f.createdCategories.length, 0);
});

test('category creation saves its course and college mapping', async () => {
  const f = fixture();
  const res = response();

  await f.api.createCategory({ ...request, body: { name: ' Computer Science ', courseId } }, res, (error) => { throw error; });

  assert.equal(res.code, 201);
  assert.equal(res.data.category.name, 'Computer Science');
  assert.equal(res.data.category.collegeId, 'college-a');
  assert.equal(res.data.category.courseId, courseId);
});

test('existing categories can be mapped to courses within their college', async () => {
  const category = {
    _id: categoryId,
    save: async () => { category.saved = true; },
  };
  const f = fixture({ category });
  const res = response();

  await f.api.assignCategoryCourse({
    ...request,
    params: { id: categoryId },
    body: { courseId },
  }, res, (error) => { throw error; });

  assert.equal(res.code, 200);
  assert.equal(f.getCategoryQuery()._id, categoryId);
  assert.equal(f.getCategoryQuery().collegeId, 'college-a');
  assert.equal(category.courseId, courseId);
  assert.equal(category.saved, true);
});

test('existing categories cannot be mapped to courses from another college', async () => {
  const category = { _id: categoryId, save: async () => { category.saved = true; } };
  const f = fixture({ category, course: null });
  const res = response();

  await f.api.assignCategoryCourse({
    ...request,
    params: { id: categoryId },
    body: { courseId },
  }, res, (error) => { throw error; });

  assert.equal(res.code, 404);
  assert.equal(category.courseId, undefined);
  assert.equal(category.saved, undefined);
});

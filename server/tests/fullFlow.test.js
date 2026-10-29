const test = require('node:test');
const assert = require('node:assert/strict');

test('real HTTP and MongoDB application flows', { skip: process.env.RUN_FLOW_TESTS !== 'true', timeout: 120000 }, async t => {
  require('../config/env');
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const crypto = require('node:crypto');
  const User = require('../models/User');
  const College = require('../models/College');
  const Membership = require('../models/Membership');
  const Student = require('../models/Student');
  const Faculty = require('../models/Faculty');
  process.env.NODE_ENV = 'test';
  const app = require('../app');
  const dbName = `examiq_flow_test_${crypto.randomBytes(8).toString('hex')}`;
  const phoneSetting = process.env.REQUIRE_PHONE_VERIFICATION;
  process.env.REQUIRE_PHONE_VERIFICATION = 'false';
  let http;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db', { dbName });
    http = app.listen(0, '127.0.0.1');
    await new Promise(resolve => http.once('listening', resolve));
    const base = `http://127.0.0.1:${http.address().port}/api`;
    const request = async (method, route, data, token, expected = 200, collegeId) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (collegeId) headers['X-College-Id'] = collegeId;
      const response = await fetch(base + route, { method, headers, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('json') ? await response.json() : { raw: await response.arrayBuffer() };
      assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
      return result;
    };
    const pass = 'FlowTest@3846';
    const college = await College.create({ name: 'Flow Test College', code: 'FLOW' });
    const other = await College.create({ name: 'Other College', code: 'OTHER' });
    const fixture = async (role, target = college) => {
      const user = await User.create({ name: `Test ${role}`, email: `${role}@flow.test`, password: await bcrypt.hash(pass, 4), role, isEmailVerified: true, isPhoneVerified: true, collegeIds: [target._id], activeCollegeId: target._id });
      await Membership.create({ userId: user._id, collegeId: target._id, role, status: 'active' });
      if (role === 'faculty') await Faculty.create({ userId: user._id, collegeId: target._id });
      return user;
    };
    const admin = await fixture('admin');
    const faculty = await fixture('faculty');
    await fixture('recruiter');
    let adminToken, facultyToken, studentToken, recruiterToken, studentId, questionId, examId, assignmentId, resultId, collegeAdminToken;
    const check = (name, fn) => t.test(name, fn);
    await check('health and public institution list', async () => {
      await request('GET', '/health');
      const data = await request('GET', '/colleges/public');
      assert.equal(data.colleges.length, 2);
    });
    await check('missing session and forged session are rejected', async () => {
      await request('GET', '/auth/me', undefined, undefined, 401);
      await request('GET', '/auth/me', undefined, 'demo-admin-token', 401);
    });
    await check('demo credentials no longer create accounts', async () => {
      await request('POST', '/auth/login', { email: 'admin@examiq.com', password: 'Admin@123' }, undefined, 401);
      assert.equal(await User.countDocuments({ email: 'admin@examiq.com' }), 0);
    });
    await check('login input rejects objects and invalid email', async () => {
      await request('POST', '/auth/login', { email: { $ne: null }, password: pass }, undefined, 400);
      await request('POST', '/auth/login', { email: 'wrong', password: pass }, undefined, 400);
      await request('POST', '/auth/login', { email: admin.email, password: {} }, undefined, 400);
      await request('POST', '/auth/login', { email: admin.email, password: 'incorrect' }, undefined, 401);
    });
    await check('real role logins and email normalization', async () => {
      adminToken = (await request('POST', '/auth/login', { email: ' ADMIN@FLOW.TEST ', password: pass })).token;
      facultyToken = (await request('POST', '/auth/login', { email: faculty.email, password: pass })).token;
      recruiterToken = (await request('POST', '/auth/login', { email: 'recruiter@flow.test', password: pass })).token;
      assert.equal((await request('GET', '/auth/me', undefined, adminToken)).user.role, 'admin');
    });
    const registration = { name: 'Flow Student', email: 'student@flow.test', password: pass, collegeId: String(college._id) };
    await check('registration rejects weak passwords, invalid colleges and privileged roles', async () => {
      await request('POST', '/auth/register', { ...registration, password: 'abc' }, undefined, 400);
      await request('POST', '/auth/register', { ...registration, collegeId: 'bad' }, undefined, 400);
      await request('POST', '/auth/register', { ...registration, role: 'admin' }, undefined, 403);
      await College.updateOne({ _id: other._id }, { isActive: false });
      await request('POST', '/auth/register', { ...registration, collegeId: String(other._id) }, undefined, 400);
      await College.updateOne({ _id: other._id }, { isActive: true, 'settings.allowSelfRegistration': false });
      const openColleges = await request('GET', '/colleges/public');
      assert.deepEqual(openColleges.colleges.map(item => item._id), [String(college._id)]);
      await request('POST', '/auth/register', { ...registration, collegeId: String(other._id) }, undefined, 400);
      assert.equal(await User.countDocuments({ email: registration.email }), 0);
    });
    await check('student registration, duplicate protection and profile session', async () => {
      const data = await request('POST', '/auth/register', registration, undefined, 201);
      studentToken = data.token; studentId = data.user._id;
      assert.equal(data.user.password, undefined);
      await request('POST', '/auth/register', { ...registration, email: ' STUDENT@FLOW.TEST ' }, undefined, 400);
      const me = await request('GET', '/auth/me', undefined, studentToken);
      assert.equal(me.profile.collegeId, String(college._id));
    });
    await check('student cannot access administrative data or another college', async () => {
      await request('GET', '/admin/users', undefined, studentToken, 403);
      await request('GET', '/colleges', undefined, studentToken, 403);
      await request('GET', '/auth/me', undefined, studentToken, 403, String(other._id));
    });
    await check('profile changes persist and remain in the selected college', async () => {
      await request('PUT', '/auth/profile', { name: ' ', skills: {} }, studentToken, 400);
      await request('PUT', '/auth/profile', { name: 'Updated Student', phone: '+919876543210', skills: ['JavaScript'], course: 'Computer Science' }, studentToken);
      const data = await request('GET', '/auth/me', undefined, studentToken);
      assert.equal(data.user.name, 'Updated Student');
      assert.equal(data.profile.course, 'Computer Science');
      assert.equal(data.profile.collegeId, String(college._id));
      await request('PUT', '/auth/profile', { name: 'Profile Only Update' }, studentToken);
      assert.deepEqual((await request('GET', '/auth/me', undefined, studentToken)).profile.skills, ['JavaScript']);
      const directory = await request('GET', '/admin/users?search=Computer%20Science', undefined, adminToken);
      assert(directory.users.some(user => user._id === studentId));
      const firstPage = await request('GET', '/admin/users?page=1&limit=1', undefined, adminToken);
      assert.equal(firstPage.users.length, 1);
      assert(firstPage.totalPages >= 1);
    });
    await check('super admin creates college administrator', async () => {
      await request('POST', '/admin/college-admins', { name: 'Invalid', email: 'not-an-email', password: pass, collegeId: String(college._id) }, adminToken, 400);
      const data = await request('POST', '/admin/college-admins', { name: 'College Admin', email: 'collegeadmin@flow.test', password: pass, collegeId: String(college._id) }, adminToken, 201);
      assert.equal(data.user.password, undefined);
      collegeAdminToken = (await request('POST', '/auth/login', { email: 'collegeadmin@flow.test', password: pass })).token;
    });
    await check('college admin provisions faculty with profile, login and enforced college/role scope', async () => {
      const payload = { name: 'New Faculty', email: ' NEWFACULTY@FLOW.TEST ', password: pass, department: 'Computer Science', designation: 'Lecturer', employeeId: 'FAC-101', collegeId: String(other._id), role: 'admin' };
      await request('POST', '/admin/faculty', payload, studentToken, 403);
      await request('POST', '/admin/faculty', payload, facultyToken, 403);
      await request('POST', '/admin/faculty', payload, adminToken, 403);
      await request('POST', '/admin/faculty', { ...payload, email: 'bad' }, collegeAdminToken, 400);
      await request('POST', '/admin/faculty', { ...payload, password: 'abc' }, collegeAdminToken, 400);
      const data = await request('POST', '/admin/faculty', payload, collegeAdminToken, 201);
      assert.equal(data.user.role, 'faculty'); assert.equal(data.user.password, undefined);
      assert.equal(data.user.activeCollegeId, String(college._id));
      await request('POST', '/admin/faculty', payload, collegeAdminToken, 409);
      await request('POST', '/admin/faculty', { ...payload, email: 'other@flow.test' }, collegeAdminToken, 409);
      const login = await request('POST', '/auth/login', { email: 'newfaculty@flow.test', password: pass });
      const me = await request('GET', '/auth/me', undefined, login.token);
      assert.equal(me.profile.department, 'Computer Science');
      assert.equal(me.profile.employeeId, 'FAC-101');
      assert.equal(me.profile.collegeId, String(college._id));
      const directory = await request('GET', '/admin/users?role=faculty', undefined, collegeAdminToken);
      assert(directory.users.some(user => user._id === data.user._id));
    });
    await check('college admin creates student accounts and sees only college activity', async () => {
      const payload = { name: 'Added Student', email: 'addedstudent@flow.test', password: pass, rollNumber: 'NEW-01', course: 'Computer Science', collegeId: String(other._id), role: 'admin' };
      await request('POST', '/admin/students', payload, facultyToken, 403);
      await request('POST', '/admin/students', { ...payload, password: 'abc' }, collegeAdminToken, 400);
      const data = await request('POST', '/admin/students', payload, collegeAdminToken, 201);
      assert.equal(data.user.role, 'student'); assert.equal(data.user.password, undefined);
      assert.equal(data.user.activeCollegeId, String(college._id));
      await request('POST', '/admin/students', payload, collegeAdminToken, 409);
      await request('POST', '/admin/students', { ...payload, email: 'duplicateRoll@flow.test' }, collegeAdminToken, 409);
      const login = await request('POST', '/auth/login', { email: payload.email, password: pass });
      const me = await request('GET', '/auth/me', undefined, login.token);
      assert.equal(me.profile.rollNumber, 'NEW-01'); assert.equal(me.profile.course, payload.course);
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({ collegeId: other._id, action: 'OTHER_COLLEGE', resource: 'User' });
      const logs = await request('GET', '/admin/audit-logs', undefined, collegeAdminToken);
      assert(logs.logs.some(log => log.action === 'CREATE_STUDENT'));
      assert(!logs.logs.some(log => log.action === 'OTHER_COLLEGE'));
      await request('GET', '/admin/audit-logs', undefined, studentToken, 403);
    });
    await check('college admin bulk-imports students from a CSV file', async () => {
      const csv = [
        'name,email,password,phone,course,branch,rollNumber,semester',
        'Bulk Student One,bulk-one@flow.test,FlowPass@3846,1234567890,Computer Science,CSE,BULK-01,2',
        'Bulk Student Two,bulk-two@flow.test,FlowPass@3846,,Computer Science,CSE,BULK-02,2',
      ].join('\n');
      const form = new FormData();
      form.append('file', new Blob([csv], { type: 'text/csv' }), 'students.csv');
      const response = await fetch(`${base}/admin/students/import`, {
        method: 'POST',
        headers: {
          Authorization: ['Bearer', collegeAdminToken].join(' '),
          'X-College-Id': String(college._id),
        },
        body: form,
      });
      const data = await response.json();
      assert.equal(response.status, 200, JSON.stringify(data));
      assert.equal(data.importedCount, 2);
      assert.equal(data.failedCount, 0);
      assert.equal(JSON.stringify(data).includes('FlowPass@3846'), false);
      const login = await request('POST', '/auth/login', { email: 'bulk-one@flow.test', password: 'FlowPass@3846' });
      assert.equal((await request('GET', '/auth/me', undefined, login.token)).profile.rollNumber, 'BULK-01');
    });
    await check('college admin manages own settings but cannot change college identity or activation', async () => {
      const current = await request('GET', '/colleges/current', undefined, collegeAdminToken);
      assert.equal(current.college._id, String(college._id));
      await request('PUT', '/colleges/' + college._id, { contactEmail: 'office@flow.test', address: 'College Campus', settings: { allowSelfRegistration: false } }, collegeAdminToken);
      const updated = await request('GET', '/colleges/current', undefined, collegeAdminToken);
      assert.equal(updated.college.contactEmail, 'office@flow.test');
      assert.equal(updated.college.settings.allowSelfRegistration, false);
      await request('PUT', '/colleges/' + college._id, { contactEmail: 'invalid' }, collegeAdminToken, 400);
      await request('PUT', '/colleges/' + college._id, { isActive: false }, collegeAdminToken, 403);
      await request('PUT', '/colleges/' + other._id, { address: 'Unassigned' }, collegeAdminToken, 403);
      await request('PUT', '/colleges/' + college._id, { settings: { allowSelfRegistration: true } }, collegeAdminToken);
    });
    await check('college admin cannot grant super admin or disable administrators', async () => {
      await request('PUT', `/admin/users/${studentId}/role`, { role: 'admin' }, collegeAdminToken, 403);
      await request('PUT', `/admin/users/${admin._id}/toggle-status`, {}, collegeAdminToken, 403);
      await request('PUT', `/admin/users/${admin._id}/toggle-status`, {}, adminToken, 400);
      await request('PUT', `/admin/users/${admin._id}/role`, { role: 'student' }, adminToken, 400);
    });
    await check('college admin creates categories and courses', async () => {
      const course = await request('POST', '/admin/courses', { name: 'BTech', code: 'BTECH' }, collegeAdminToken, 201);
      const category = await request('POST', '/admin/categories', { name: 'Computer Science', courseId: course.course._id }, collegeAdminToken, 201);
      assert.equal(category.category.courseId, course.course._id);
      assert.equal((await request('GET', '/admin/categories', undefined, collegeAdminToken)).categories.length, 1);
      assert.equal((await request('GET', '/admin/courses', undefined, collegeAdminToken)).courses.length, 1);
    });
    await check('group creation, duplicate validation, roster and update', async () => {
      const data = await request('POST', '/groups', { name: 'Flow Batch', code: 'FLOWBATCH', students: [studentId] }, adminToken, 201);
      await request('POST', '/groups', { name: 'Duplicate', code: 'FLOWBATCH' }, adminToken, 409);
      const detail = await request('GET', `/groups/${data.group._id}`, undefined, adminToken);
      assert.equal(detail.group.students.length, 1);
      await request('PUT', `/groups/${data.group._id}`, { name: 'Updated Batch' }, adminToken);
    });
    await check('question validation rejects empty options and invalid scoring', async () => {
      await request('POST', '/questions', { questionText: 'Invalid', options: [] }, facultyToken, 400);
      await request('POST', '/questions', { questionText: 'Invalid', options: [{ optionText: 'A' }, { optionText: 'B' }] }, facultyToken, 400);
      await request('POST', '/questions', { questionText: 'Invalid', marks: -1, options: [{ optionText: 'A', isCorrect: true }, { optionText: 'B' }] }, facultyToken, 400);
    });
    await check('faculty creates question and students cannot retrieve answer keys', async () => {
      const data = await request('POST', '/questions', { questionText: 'What is 2 + 2?', marks: 10, section: 'aptitude', questionType: 'single', options: [{ optionText: '4', isCorrect: true }, { optionText: '5', isCorrect: false }] }, facultyToken, 201);
      questionId = data.question._id;
      await request('GET', `/questions/${questionId}`, undefined, studentToken, 403);
    });
    await check('question edits preserve ownership and question type rules', async () => {
      await request('PUT', `/questions/${questionId}`, { questionText: 'What is two plus two?', createdBy: String(admin._id) }, facultyToken);
      assert.equal((await request('GET', `/questions/${questionId}`, undefined, facultyToken)).question.createdBy, String(faculty._id));
      await request('PUT', `/questions/${questionId}`, { options: [{ optionText: '4', isCorrect: true }, { optionText: '5', isCorrect: true }] }, facultyToken, 400);
    });
    const dates = { startDate: new Date(Date.now() - 60000).toISOString(), endDate: new Date(Date.now() + 3600000).toISOString() };
    const exam = { title: 'Flow Assessment', duration: 30, totalMarks: 10, passingMarks: 5, questions: [], ...dates, status: 'published', resultReleaseMode: 'immediate', maxAttempts: 1 };
    await check('exam validation rejects negative duration and reversed dates', async () => {
      await request('POST', '/exams', { ...exam, duration: -1 }, facultyToken, 400);
      await request('POST', '/exams', { ...exam, endDate: dates.startDate }, facultyToken, 400);
    });
    await check('faculty creates and assigns published assessment', async () => {
      examId = (await request('POST', '/exams', { ...exam, questions: [questionId] }, facultyToken, 201)).exam._id;
      await request('PUT', `/exams/${examId}`, { endDate: new Date(Date.now() - 3600000).toISOString() }, facultyToken, 400);
      await request('PUT', `/exams/${examId}`, { passingMarks: 11 }, facultyToken, 400);
      const data = await request('POST', '/exam-assignments', { examId, studentIds: [studentId], attemptsAllowed: 1, ...dates }, facultyToken, 201);
      assignmentId = data.assignment._id;
      await request('POST', `/exam-assignments/${assignmentId}/publish`, {}, facultyToken);
      const exams = await request('GET', '/exams', undefined, studentToken);
      assert(exams.exams.some(item => item._id === examId));
    });
    await check('start, resume and sanitized examination questions', async () => {
      const first = await request('POST', `/exams/${examId}/start`, {}, studentToken);
      const second = await request('POST', `/exams/${examId}/start`, {}, studentToken);
      assert.equal(first.attempt._id, second.attempt._id);
      assert.equal(first.exam.questions[0].options[0].isCorrect, undefined);
      assert.equal(first.exam.questions[0].explanation, undefined);
      await request('POST', '/proctor/heartbeat', { examId, status: 'Active', violationCount: 0 }, studentToken);
      const sessions = await request('GET', `/proctor/live-sessions/${examId}`, undefined, facultyToken);
      assert(sessions.sessions.length > 0);
      await request('POST', '/proctor/heartbeat', { examId }, facultyToken, 403);
      await request('PUT', `/exams/${examId}`, { duration: 31 }, facultyToken, 409);
      await request('DELETE', `/exams/${examId}`, undefined, facultyToken, 409);
    });
    await check('invalid answer rejected and valid answer saved', async () => {
      await request('POST', `/exams/${examId}/answer`, { questionId, selectedOptions: ['invalid'] }, studentToken, 400);
      await request('POST', `/exams/${examId}/answer`, { questionId, selectedOptions: ['4'] }, studentToken);
    });
    await check('assessment scoring, released results and retake limit', async () => {
      const data = await request('POST', `/exams/${examId}/submit`, {}, studentToken);
      resultId = data.result?._id;
      const results = await request('GET', '/results', undefined, studentToken);
      assert(results.results.length > 0);
      const result = results.results.find(item => item.examId?._id === examId || item.examId === examId);
      assert(result); resultId = result._id;
      assert.equal(result.percentage, 100);
      await request('GET', `/results/${resultId}`, undefined, studentToken);
      await request('POST', `/exams/${examId}/start`, {}, studentToken, 403);
    });
    await check('certificates verify publicly and results export as a spreadsheet', async () => {
      const certs = await request('GET', '/certificates', undefined, studentToken);
      assert.equal(certs.certificates.length, 1);
      await request('GET', `/certificates/verify/${certs.certificates[0].certificateId}`);
      await request('GET', '/certificates/verify/invalid', undefined, undefined, 404);
      const exported = await request('GET', `/results/export/excel?examId=${examId}`, undefined, facultyToken);
      assert(exported.raw.byteLength > 100);
      await request('GET', `/assessments/${examId}/result-statistics`, undefined, facultyToken);
      await request('GET', `/assessments/${examId}/students/${studentId}/attempts`, undefined, facultyToken);
    });
    await check('notifications can be read and marked read', async () => {
      const data = await request('GET', '/notifications', undefined, studentToken);
      assert(data.notifications.length > 0);
      await request('PUT', `/notifications/${data.notifications[0]._id}/read`, {}, studentToken);
      await request('PUT', '/notifications/read-all', {}, studentToken);
    });
    await check('JavaScript trial execution, required source and unsupported language', async () => {
      await request('POST', '/coding/run', { language: 123, sourceCode: 'code' }, studentToken, 400);
      await request('POST', '/coding/run', { language: 'javascript', sourceCode: '' }, studentToken, 400);
      const run = await request('POST', '/coding/run', { language: 'javascript', sourceCode: "console.log('flow-ok')" }, studentToken);
      assert.equal(run.result.output.trim(), 'flow-ok');
      assert.equal(run.result.status, 'Accepted');
      const invalid = await request('POST', '/coding/run', { language: 'unknown', sourceCode: 'test' }, studentToken);
      assert.equal(invalid.result.status, 'Compilation Error');
    });
    await check('coding problem creation, hidden test protection and judged submission', async () => {
      const data = await request('POST', '/coding', { title: 'Echo', slug: 'flow-echo', description: 'Print input', marks: 10, allowedLanguages: ['javascript'], testCases: [{ input: 'hello', expectedOutput: 'hello', isHidden: true }] }, facultyToken, 201);
      const problemId = data.problem._id;
      const detail = await request('GET', `/coding/${problemId}`, undefined, studentToken);
      assert(!JSON.stringify(detail).includes('expectedOutput'));
      const submission = await request('POST', '/coding/submit', { problemId, language: 'javascript', sourceCode: "console.log(require('fs').readFileSync(0, 'utf8').trim())" }, studentToken);
      assert.equal(submission.submission.score, 10);
      assert.equal(submission.submission.testResults[0].input, 'Hidden');
      await request('PUT', `/coding/${problemId}`, { description: 'Echo the input', createdBy: String(admin._id) }, facultyToken);
      const stored = await require('../models/CodingProblem').findById(problemId);
      assert.equal(String(stored.createdBy), String(faculty._id));
      const anotherFaculty = await User.create({ name: 'Other Faculty', email: 'otherfaculty@flow.test', password: await bcrypt.hash(pass, 4), role: 'faculty', isEmailVerified: true, collegeIds: [college._id], activeCollegeId: college._id });
      await Membership.create({ userId: anotherFaculty._id, collegeId: college._id, role: 'faculty', status: 'active' });
      const otherToken = (await request('POST', '/auth/login', { email: anotherFaculty.email, password: pass })).token;
      await request('PUT', `/coding/${problemId}`, { title: 'Hijacked' }, otherToken, 403);
      await request('DELETE', `/coding/${problemId}`, undefined, otherToken, 403);
      const unused = (await request('POST', '/exams', { ...exam, title: 'Ownership Check' }, facultyToken, 201)).exam;
      await request('DELETE', `/exams/${unused._id}`, undefined, otherToken, 403);
    });
    await check('interview, language assessment, study roadmap and monitoring reads', async () => {
      await request('GET', '/ai/interview/topics', undefined, studentToken);
      await request('GET', '/ai/versant/assessment', undefined, studentToken);
      await request('POST', '/ai/study-roadmap', {}, studentToken);
      await request('GET', `/assessments/${examId}/live-monitor`, undefined, facultyToken);
      await request('GET', `/assessments/${examId}/plagiarism`, undefined, facultyToken);
    });
    await check('read endpoints for admin, faculty, students and recruiters', async () => {
      for (const route of ['/admin/analytics', '/admin/users', '/admin/audit-logs', '/colleges', '/admin/college-admins', '/groups']) await request('GET', route, undefined, adminToken);
      for (const route of ['/questions', '/coding', '/exam-assignments/faculty', '/results', '/notifications']) await request('GET', route, undefined, facultyToken);
      for (const route of ['/exam-assignments/student', '/leaderboard', '/certificates', '/notifications', '/coding']) await request('GET', route, undefined, studentToken);
      for (const route of ['/recruiter/overview', '/recruiter/drives', '/recruiter/candidates', '/recruiter/reports']) await request('GET', route, undefined, recruiterToken);
    });
    await check('recruiter drive creation and eligibility validation', async () => {
      const data = await request('POST', '/recruiter/drives', { name: 'Flow Hiring Drive', assessmentType: 'coding' }, recruiterToken, 201);
      await request('PUT', `/recruiter/drives/${data.drive._id}`, { eligibility: { minimumScore: 101 } }, recruiterToken, 400);
      await request('PUT', `/recruiter/drives/${data.drive._id}`, { eligibility: { minimumScore: 75, minimumCgpa: 7 } }, recruiterToken);
    });
    await check('password change requires a session, correct current password and matching valid password', async () => {
      const payload = { currentPassword: pass, newPassword: 'ChangedFlow@123', confirmPassword: 'ChangedFlow@123' };
      await request('PUT', '/auth/change-password', payload, undefined, 401);
      for (const invalid of [
        { currentPassword: 'wrong' },
        { newPassword: 'abc', confirmPassword: 'abc' },
        { confirmPassword: 'Mismatch@123' },
        { newPassword: pass, confirmPassword: pass },
        { currentPassword: { $ne: null } },
        { newPassword: 'é'.repeat(40), confirmPassword: 'é'.repeat(40) },
      ]) await request('PUT', '/auth/change-password', { ...payload, ...invalid }, studentToken, 400);
      await request('GET', '/auth/me', undefined, studentToken);
      await request('POST', '/auth/login', { email: registration.email, password: pass });
    });
    await check('all roles can change their own password, keep their current session and revoke older sessions', async () => {
      const roles = [
        ['admin@flow.test', adminToken],
        ['faculty@flow.test', facultyToken],
        [registration.email, studentToken],
        ['recruiter@flow.test', recruiterToken],
        ['collegeadmin@flow.test', collegeAdminToken],
      ];
      for (let index = 0; index < roles.length; index++) {
        const [email, oldToken] = roles[index];
        const changed = await request('PUT', '/auth/change-password', { currentPassword: pass, newPassword: 'ChangedFlow@123', confirmPassword: 'ChangedFlow@123', userId: String(admin._id) }, oldToken);
        assert(changed.token); assert.equal(changed.user.password, undefined);
        await request('GET', '/auth/me', undefined, oldToken, 401);
        await request('GET', '/auth/me', undefined, changed.token);
        await request('POST', '/auth/login', { email, password: pass }, undefined, 401);
        await request('POST', '/auth/login', { email, password: 'ChangedFlow@123' });
        const restored = await request('PUT', '/auth/change-password', { currentPassword: 'ChangedFlow@123', newPassword: pass, confirmPassword: pass }, changed.token);
        if (index === 2) studentToken = restored.token;
      }
    });
    await check('invalid reset payload rejected and password reset requires sign in', async () => {
      await request('POST', '/auth/reset-password/invalid', { password: 'x' }, undefined, 400);
      const reset = crypto.randomBytes(20).toString('hex');
      await User.updateOne({ _id: studentId }, { resetPasswordToken: crypto.createHash('sha256').update(reset).digest('hex'), resetPasswordExpire: Date.now() + 60000 });
      const data = await request('POST', `/auth/reset-password/${reset}`, { password: 'UpdatedFlow@123' });
      assert.equal(data.token, undefined);
      await request('POST', '/auth/login', { email: registration.email, password: pass }, undefined, 401);
      await request('POST', '/auth/login', { email: registration.email, password: 'UpdatedFlow@123' });
      await request('POST', `/auth/reset-password/${reset}`, { password: pass }, undefined, 400);
    });
    await check('disabled accounts cannot use password login or magic login', async () => {
      const magic = crypto.randomBytes(24).toString('hex');
      await User.updateOne({ _id: studentId }, { isActive: false, magicToken: crypto.createHash('sha256').update(magic).digest('hex'), magicTokenExpire: Date.now() + 60000 });
      await request('POST', '/auth/login', { email: registration.email, password: 'UpdatedFlow@123' }, undefined, 403);
      await request('GET', `/auth/magic-login?token=${magic}`, undefined, undefined, 403);
      await request('GET', '/auth/me', undefined, studentToken, 403);
    });
  } finally {
    if (http) await new Promise(resolve => http.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && dbName.startsWith('examiq_flow_test_')) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (phoneSetting === undefined) delete process.env.REQUIRE_PHONE_VERIFICATION;
    else process.env.REQUIRE_PHONE_VERIFICATION = phoneSetting;
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
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

const loadController = (user, dependencies = {}) => {
  const mocks = {
    '../models/User': {
      findOne(query) {
        this.query = query;
        return {
          select(selection) {
            this.selection = selection;
            return Promise.resolve(user);
          },
        };
      },
    },
    ...dependencies,
  };
  const module = { exports: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../controllers/authController.js'), 'utf8'),
    {
      module,
      exports: module.exports,
      Buffer,
      Date,
      console,
      process: { env: { REQUIRE_EMAIL_VERIFICATION: 'true', REQUIRE_PHONE_VERIFICATION: 'true' } },
      require(name) {
        if (name === 'crypto') return crypto;
        if (name in mocks) return mocks[name];
        return {};
      },
    }
  );
  return module.exports;
};

const createPendingUser = () => ({
  isEmailVerified: false,
  isPhoneVerified: false,
  emailVerificationCodeHash: hashCode('123456'),
  emailVerificationExpire: new Date(Date.now() + 60_000),
  phoneVerificationCodeHash: hashCode('654321'),
  phoneVerificationExpire: new Date(Date.now() + 60_000),
  saveCount: 0,
  async save() {
    this.saveCount += 1;
  },
});

test('registration verification accepts both valid codes and clears their hashes', async () => {
  const user = createPendingUser();
  const controller = loadController(user);
  const res = response();

  await controller.verifyRegistration(
    { body: { email: ' STUDENT@EXAMPLE.COM ', emailCode: '123456', phoneCode: '654321' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(user.isEmailVerified, true);
  assert.equal(user.isPhoneVerified, true);
  assert.equal(user.emailVerificationCodeHash, undefined);
  assert.equal(user.phoneVerificationCodeHash, undefined);
  assert.equal(user.saveCount, 1);
});

test('registration verification rejects one wrong code without partially verifying the account', async () => {
  const user = createPendingUser();
  const controller = loadController(user);
  const res = response();

  await controller.verifyRegistration(
    { body: { email: 'student@example.com', emailCode: '123456', phoneCode: '000000' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid or expired mobile verification code');
  assert.equal(user.isEmailVerified, false);
  assert.equal(user.isPhoneVerified, false);
  assert.equal(user.saveCount, 0);
});

test('registration verification rejects expired codes', async () => {
  const user = createPendingUser();
  user.emailVerificationExpire = new Date(Date.now() - 1);
  const controller = loadController(user);
  const res = response();

  await controller.verifyRegistration(
    { body: { email: 'student@example.com', emailCode: '123456', phoneCode: '654321' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid or expired email verification code');
  assert.equal(user.saveCount, 0);
});

test('login is blocked until required email verification is complete', async () => {
  const user = {
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    phone: '+15555550123',
    password: 'hashed-password',
  };
  const controller = loadController(user, {
    bcryptjs: { compare: async () => true },
  });
  const res = response();

  await controller.login(
    { body: { email: 'STUDENT@EXAMPLE.COM', password: 'password' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'EMAIL_VERIFICATION_REQUIRED');
  assert.equal(res.body.emailVerificationRequired, true);
  assert.equal(res.body.phoneVerificationRequired, true);
});

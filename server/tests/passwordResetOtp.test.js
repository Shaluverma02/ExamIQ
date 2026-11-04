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

const smtpEnv = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '587',
  SMTP_USER: 'test-user',
  SMTP_PASS: 'test-password',
  SMTP_FROM: 'no-reply@example.test',
};

const loadController = ({ user, sendEmail = async () => {}, bcrypt = {}, env = {} }) => {
  const mocks = {
    '../models/User': {
      findOne() {
        return {
          select: async () => user,
          then(resolve, reject) {
            return Promise.resolve(user).then(resolve, reject);
          },
        };
      },
    },
    '../utils/sendEmail': sendEmail,
    bcryptjs: {
      genSalt: async () => 'test-salt',
      hash: async (value) => `hashed:${value}`,
      ...bcrypt,
    },
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
      process: { env },
      require(name) {
        if (name === 'crypto') return crypto;
        if (name in mocks) return mocks[name];
        return {};
      },
    }
  );
  return module.exports;
};

const createUser = (overrides = {}) => ({
  email: 'student@example.com',
  password: 'old-password-hash',
  tokenVersion: 2,
  resetPasswordCodeAttempts: 0,
  saveCount: 0,
  async save() {
    this.saveCount += 1;
  },
  ...overrides,
});

test('forgot password sends a short-lived code without disclosing whether the email exists', async () => {
  const user = createUser();
  let emailOptions;
  const controller = loadController({
    user,
    env: smtpEnv,
    sendEmail: async (options) => { emailOptions = options; },
  });
  const res = response();

  await controller.forgotPassword(
    { body: { email: ' STUDENT@EXAMPLE.COM ' } },
    res,
    (error) => { throw error; }
  );

  const code = emailOptions.message.match(/code is (\d{6})/)[1];
  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /If an account exists/);
  assert.equal(user.resetPasswordCodeHash, hashCode(code));
  assert.ok(new Date(user.resetPasswordCodeExpire).getTime() > Date.now());
  assert.equal(user.resetPasswordCodeAttempts, 0);
});

test('forgot password returns the same response when no account matches', async () => {
  const controller = loadController({ user: null, env: smtpEnv });
  const res = response();

  await controller.forgotPassword(
    { body: { email: 'unknown@example.com' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /If an account exists/);
});

test('password reset rejects an invalid code and tracks failed attempts', async () => {
  const user = createUser({
    resetPasswordCodeHash: hashCode('123456'),
    resetPasswordCodeExpire: new Date(Date.now() + 60_000),
  });
  const controller = loadController({ user, env: smtpEnv });
  const res = response();

  await controller.resetPasswordWithCode(
    { body: { email: user.email, code: '000000', password: 'new-password', confirmPassword: 'new-password' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(user.resetPasswordCodeAttempts, 1);
  assert.equal(user.password, 'old-password-hash');
});

test('password reset changes the password and invalidates the code and existing sessions', async () => {
  const user = createUser({
    resetPasswordCodeHash: hashCode('123456'),
    resetPasswordCodeExpire: new Date(Date.now() + 60_000),
  });
  const controller = loadController({ user, env: smtpEnv });
  const res = response();

  await controller.resetPasswordWithCode(
    { body: { email: user.email, code: '123456', password: 'new-password', confirmPassword: 'new-password' } },
    res,
    (error) => { throw error; }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(user.password, 'hashed:new-password');
  assert.equal(user.tokenVersion, 3);
  assert.equal(user.resetPasswordCodeHash, undefined);
  assert.equal(user.resetPasswordCodeExpire, undefined);
  assert.equal(user.resetPasswordCodeAttempts, 0);
});

test('password reset code is cleared after five failed attempts', async () => {
  const user = createUser({
    resetPasswordCodeHash: hashCode('123456'),
    resetPasswordCodeExpire: new Date(Date.now() + 60_000),
  });
  const controller = loadController({ user, env: smtpEnv });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = response();
    await controller.resetPasswordWithCode(
      { body: { email: user.email, code: '000000', password: 'new-password', confirmPassword: 'new-password' } },
      res,
      (error) => { throw error; }
    );
    assert.equal(res.statusCode, 400);
  }

  assert.equal(user.resetPasswordCodeHash, undefined);
  assert.equal(user.resetPasswordCodeExpire, undefined);
  assert.equal(user.resetPasswordCodeAttempts, 0);
});

test('public password reset is disabled when SMTP is not configured', async () => {
  const user = createUser({
    resetPasswordCodeHash: hashCode('123456'),
    resetPasswordCodeExpire: new Date(Date.now() + 60_000),
  });
  let emailSent = false;
  const controller = loadController({
    user,
    sendEmail: async () => { emailSent = true; },
  });
  const forgotResponse = response();
  await controller.forgotPassword(
    { body: { email: user.email } },
    forgotResponse,
    (error) => { throw error; }
  );
  assert.equal(forgotResponse.statusCode, 503);
  assert.match(forgotResponse.body.message, /contact your institution administrator/i);
  assert.equal(emailSent, false);

  const resetResponse = response();
  await controller.resetPasswordWithCode(
    { body: { email: user.email, code: '123456', password: 'new-password' } },
    resetResponse,
    (error) => { throw error; }
  );
  assert.equal(resetResponse.statusCode, 503);
  assert.equal(user.password, 'old-password-hash');
});

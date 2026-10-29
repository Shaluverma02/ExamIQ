const { spawn } = require('node:child_process');
const path = require('node:path');

const child = spawn(process.execPath, ['--test'], {
  cwd: path.resolve(__dirname, '../server'),
  stdio: 'inherit',
  env: { ...process.env, RUN_FLOW_TESTS: 'true' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });

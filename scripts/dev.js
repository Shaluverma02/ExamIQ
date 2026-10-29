const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const tasks = [
  ['server', 'node_modules/nodemon/bin/nodemon.js', ['--watch', '.', '--watch', '../.env', '--ext', 'js,mjs,cjs,json,env', 'server.js']],
  ['client', 'node_modules/vite/bin/vite.js', []],
];

for (const [directory, entry] of tasks) {
  if (!fs.existsSync(path.join(root, directory, entry))) {
    console.error('Dependencies missing. Run npm run setup first.');
    process.exit(1);
  }
}

const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  }
}

for (const [directory, entry, args] of tasks) {
  const child = spawn(process.execPath, [path.join(root, directory, entry), ...args], {
    cwd: path.join(root, directory),
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`${directory} startup failed: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => { if (!stopping) stop(code || 0); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

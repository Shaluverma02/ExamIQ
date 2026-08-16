const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Executes source code in target language against input string safely with timeout bounds.
 */
const runCode = async ({ language, sourceCode, input = '', timeLimit = 3000, memoryLimit = 128 }) => {
  const fileId = crypto.randomBytes(8).toString('hex');
  const startTime = Date.now();

  let fileName = '';
  let compileCmd = '';
  let runCmd = '';
  let cleanupFiles = [];

  const sanitizedInput = input.toString();

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      fileName = `${fileId}.js`;
      const jsPath = path.join(TEMP_DIR, fileName);
      fs.writeFileSync(jsPath, sourceCode);
      cleanupFiles.push(jsPath);
      runCmd = `node "${jsPath}"`;
      break;

    case 'python':
    case 'py':
      fileName = `${fileId}.py`;
      const pyPath = path.join(TEMP_DIR, fileName);
      fs.writeFileSync(pyPath, sourceCode);
      cleanupFiles.push(pyPath);
      runCmd = `python "${pyPath}"`;
      break;

    case 'cpp':
    case 'c++':
      fileName = `${fileId}.cpp`;
      const cppPath = path.join(TEMP_DIR, fileName);
      const exePathCpp = path.join(TEMP_DIR, `${fileId}.exe`);
      fs.writeFileSync(cppPath, sourceCode);
      cleanupFiles.push(cppPath, exePathCpp);
      compileCmd = `g++ "${cppPath}" -o "${exePathCpp}"`;
      runCmd = `"${exePathCpp}"`;
      break;

    case 'c':
      fileName = `${fileId}.c`;
      const cPath = path.join(TEMP_DIR, fileName);
      const exePathC = path.join(TEMP_DIR, `${fileId}.exe`);
      fs.writeFileSync(cPath, sourceCode);
      cleanupFiles.push(cPath, exePathC);
      compileCmd = `gcc "${cPath}" -o "${exePathC}"`;
      runCmd = `"${exePathC}"`;
      break;

    case 'java':
      // Extract class name or default to Main
      const classNameMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = classNameMatch ? classNameMatch[1] : 'Main';
      const javaDir = path.join(TEMP_DIR, fileId);
      fs.mkdirSync(javaDir, { recursive: true });
      const javaPath = path.join(javaDir, `${className}.java`);
      fs.writeFileSync(javaPath, sourceCode);
      cleanupFiles.push(javaDir);
      compileCmd = `javac "${javaPath}"`;
      runCmd = `java -cp "${javaDir}" ${className}`;
      break;

    default:
      return {
        status: 'Compilation Error',
        output: '',
        errorMessage: `Unsupported programming language: ${language}`,
        executionTime: 0,
      };
  }

  try {
    // 1. Compilation phase if required
    if (compileCmd) {
      const compileResult = await new Promise((resolve) => {
        exec(compileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              errorMessage: stderr || stdout || error.message,
            });
          } else {
            resolve({ success: true });
          }
        });
      });

      if (!compileResult.success) {
        cleanFiles(cleanupFiles);
        return {
          status: 'Compilation Error',
          output: '',
          errorMessage: compileResult.errorMessage,
          executionTime: Date.now() - startTime,
        };
      }
    }

    // 2. Execution phase with stdin piping and timeout limit
    const execResult = await new Promise((resolve) => {
      const child = exec(
        runCmd,
        { timeout: timeLimit, maxBuffer: 1024 * 1024 * 5 }, // 5MB output cap
        (error, stdout, stderr) => {
          const executionTime = Date.now() - startTime;
          if (error) {
            if (error.killed || error.signal === 'SIGTERM') {
              resolve({
                status: 'Time Limit Exceeded',
                output: stdout || '',
                errorMessage: `Execution timed out after ${timeLimit}ms`,
                executionTime,
              });
            } else {
              resolve({
                status: 'Runtime Error',
                output: stdout || '',
                errorMessage: stderr || error.message,
                executionTime,
              });
            }
          } else {
            resolve({
              status: 'Accepted',
              output: stdout ? stdout.trim() : '',
              errorMessage: stderr ? stderr.trim() : '',
              executionTime,
            });
          }
        }
      );

      if (sanitizedInput && child.stdin) {
        child.stdin.write(sanitizedInput + '\n');
        child.stdin.end();
      }
    });

    cleanFiles(cleanupFiles);
    return execResult;
  } catch (err) {
    cleanFiles(cleanupFiles);
    return {
      status: 'Internal Judge Error',
      output: '',
      errorMessage: err.message,
      executionTime: Date.now() - startTime,
    };
  }
};

// Helper function to remove temporary generated files
const cleanFiles = (paths) => {
  paths.forEach((p) => {
    try {
      if (fs.existsSync(p)) {
        if (fs.lstatSync(p).isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
      }
    } catch (e) {
      // ignore deletion errors
    }
  });
};

module.exports = { runCode };

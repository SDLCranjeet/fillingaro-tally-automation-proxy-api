const { execFile } = require('child_process');
const { AHK_EXE_PATH, AHK_TIMEOUT_MS } = require('../config');
const { parseAhkResult } = require('./parseAhkResult');

// Starts the AHK script with the given arguments, waits for it to exit, and resolves with its JSON result line
// execFile starts AutoHotkey directly (no shell), so values are passed as-is
const runAhk = (args) =>
  new Promise((resolve, reject) => {
    const child = execFile(AHK_EXE_PATH, args, { timeout: AHK_TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
      const result = parseAhkResult(stdout);
      if (error) {
        console.log(`[AHK] exited with error (code ${error.code}), stderr: ${stderr.trim() || '-'}`);
        // Non-zero exit: the script reported an error via Report(..., 1)
        return reject(new Error(result?.message || error.message));
      }
      console.log(`[AHK] exited OK, last output line: ${stdout.trim().split(/\r?\n/).pop()}`);
      if (!result) {
        return reject(new Error('AHK script finished without a result'));
      }
      resolve(result);
    });
    console.log(`[AHK] started pid=${child.pid}: ${AHK_EXE_PATH} ${args.join(' ')}`);
  });

module.exports = { runAhk };

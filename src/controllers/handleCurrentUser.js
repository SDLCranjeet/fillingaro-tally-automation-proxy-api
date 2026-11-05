const { execFile } = require('child_process');
const { sendJson } = require('../http/sendJson');

const run = (file, args) =>
  new Promise((resolve) => {
    execFile(file, args, { timeout: 15 * 1000, windowsHide: true }, (error, stdout) =>
      resolve({ error, stdout: stdout || '' })
    );
  });

// Step 1: netstat -ano  ->  PID listening on port 9000
const findPid9000 = (stdout) => {
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^TCP\s+\S+[:.]9000\s+\S+\s+LISTENING\s+(\d+)$/i);
    if (m) return m[1];
  }
  return null;
};

// Step 2: tasklist /V /FO CSV for that PID  ->  { sessionId, sessionName, imageName }
const findSessionInfo = (stdout) => {
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.startsWith('"')) continue;
    const cols = line.slice(1, -1).split('","');
    // cols: [ImageName, PID, SessionName, Session#, MemUsage, Status, UserName, CPUTime, WindowTitle]
    const sessionId = parseInt(cols[3], 10);
    if (!isNaN(sessionId)) return { sessionId, sessionName: cols[2] || null, imageName: cols[0] || null };
  }
  return null;
};

// Step 3: query user  ->  full session row for a given session ID
// Output (header skipped): ">USERNAME  SESSIONNAME  ID  STATE  IDLE  LOGON"
// SESSIONNAME is blank when disconnected, so ID is the first all-digit token after username.
const findSessionRow = (stdout, targetSessionId) => {
  const lines = stdout.split(/\r?\n/).slice(1);
  for (const raw of lines) {
    const isActive = raw.startsWith('>');
    const line = raw.replace(/^>/, '').trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    let idIdx = -1;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i])) { idIdx = i; break; }
    }
    if (idIdx === -1) continue;
    if (parseInt(parts[idIdx], 10) === targetSessionId) {
      return {
        username: parts[0],
        sessionName: idIdx > 1 ? parts[1] : null,
        sessionId: targetSessionId,
        state: parts[idIdx + 1] || null,
        isActive,
      };
    }
  }
  return null;
};

// Returns full session info for the RDP user that has Tally open on port 9000.
// Uses netstat -> tasklist -> query user: all native commands, works from a service/Session 0.
const getRdpUserForPort9000 = async () => {
  const [netstat, quser] = await Promise.all([
    run('netstat.exe', ['-ano', '-p', 'TCP']),
    run('query.exe', ['user']),
  ]);

  const pid = findPid9000(netstat.stdout);
  console.log(`[current-user] port 9000 PID: ${pid}`);
  if (!pid) return null;

  const tasklist = await run('tasklist.exe', ['/V', '/FO', 'CSV', '/NH', '/FI', `PID eq ${pid}`]);
  const sessionInfo = findSessionInfo(tasklist.stdout);
  console.log(`[current-user] session info:`, sessionInfo);
  if (!sessionInfo) return null;

  const row = findSessionRow(quser.stdout, sessionInfo.sessionId);
  console.log(`[current-user] session row:`, row);
  if (!row) return null;

  return {
    username: row.username,
    sessionId: row.sessionId,
    sessionName: row.sessionName || sessionInfo.sessionName,
    state: row.state,
    isActive: row.isActive,
    pid: Number(pid),
    tallyProcess: sessionInfo.imageName,
  };
};

// Answers GET /system/current-user
const handleCurrentUser = async (req, res) => {
  const data = await getRdpUserForPort9000();
  return sendJson(res, 200, { status: 'Success', data });
};

module.exports = { handleCurrentUser };

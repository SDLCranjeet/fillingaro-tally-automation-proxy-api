const { execFile } = require('child_process');

const run = (file, args) =>
  new Promise((resolve) => {
    execFile(file, args, { timeout: 30 * 1000, windowsHide: true }, (error, stdout) =>
      resolve({ error, stdout: stdout || '' })
    );
  });

// Splits one tasklist CSV row: "a","b","c"
const parseCsvRow = (line) => line.slice(1, -1).split('","');

// quser lines: " USERNAME  SESSIONNAME  ID  STATE  IDLE TIME  LOGON TIME", current session prefixed with ">".
// SESSIONNAME is blank for disconnected sessions, so the ID is the first all-digit token after the username.
const parseQuser = (stdout) => {
  const bySession = {};
  for (const line of stdout.split(/\r?\n/).slice(1)) {
    const tokens = line.replace(/^>/, '').trim().split(/\s+/);
    const idIndex = tokens.findIndex((t, i) => i > 0 && /^\d+$/.test(t));
    if (idIndex < 1) continue;
    bySession[tokens[idIndex]] = { userName: tokens[0], state: tokens[idIndex + 1] || null };
  }
  return bySession;
};

// netstat lines: "  TCP    0.0.0.0:9000    0.0.0.0:0    LISTENING    7452"
// Returns the PID (string) listening on a given port, or null.
const findPidOnPort = (stdout, port) => {
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/);
    if (m && Number(m[1]) === port) return m[2];
  }
  return null;
};

// netstat lines: "  TCP    0.0.0.0:9000    0.0.0.0:0    LISTENING    7452" -> { "7452": [9000] }
const parseListeningPorts = (stdout) => {
  const byPid = {};
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/);
    if (!m) continue;
    const port = Number(m[1]);
    byPid[m[2]] = byPid[m[2]] || [];
    if (!byPid[m[2]].includes(port)) byPid[m[2]].push(port);
  }
  return byPid;
};

// Lists every running tally.exe with the Windows user and RDP session that owns it.
// tasklist shows "N/A" as the user for other users' processes unless the bridge runs
// elevated, so the user is then resolved from quser by session id.
//
// port9000 uses a PID-first lookup (netstat → tasklist by PID) so it works for any
// Tally executable name (tally.exe, TallyPrime.EXE, etc.).
const getTallySessions = async () => {
  const [tallyTasks, users, netstat] = await Promise.all([
    run('tasklist.exe', ['/V', '/FO', 'CSV', '/NH', '/FI', 'IMAGENAME eq tally.exe']),
    run('quser.exe', []),
    run('netstat.exe', ['-ano', '-p', 'TCP']),
  ]);

  // quser exits non-zero when no one is logged on; its stdout is still usable
  const sessions = parseQuser(users.stdout);
  const portsByPid = parseListeningPorts(netstat.stdout);

  const parseTaskRow = (line, allPortsByPid) => {
    const cols = parseCsvRow(line);
    const [, pid, sessionName, sessionId, memory, status, user, , windowTitle] = cols;
    const fromQuser = sessions[sessionId];
    const userName = user && user !== 'N/A' ? user.split('\\').pop() : fromQuser?.userName || null;
    const ports = allPortsByPid[pid] || [];
    const titlePort = (windowTitle || '').match(/:(\d+)\s*$/);
    return {
      pid: Number(pid),
      userName,
      sessionId: Number(sessionId),
      sessionName,
      sessionState: fromQuser?.state || null,
      status,
      memory,
      windowTitle: windowTitle && windowTitle !== 'N/A' ? windowTitle : null,
      port: ports[0] ?? (titlePort ? Number(titlePort[1]) : null),
      ports,
    };
  };

  const processes = tallyTasks.stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith('"'))
    .map((line) => parseTaskRow(line, portsByPid));

  // PID-first port9000 lookup: works regardless of Tally's executable name.
  // 1. Find which PID netstat says is listening on 9000.
  // 2. If that PID already appears in the tally.exe tasklist, reuse it.
  // 3. Otherwise query tasklist again for that specific PID (covers TallyPrime.EXE etc).
  let port9000 = null;
  const pid9000 = findPidOnPort(netstat.stdout, 9000);
  if (pid9000) {
    let proc = processes.find((p) => String(p.pid) === pid9000);
    if (!proc) {
      // Tally is running under a different executable name — query by PID directly
      const pidTask = await run('tasklist.exe', ['/V', '/FO', 'CSV', '/NH', '/FI', `PID eq ${pid9000}`]);
      const pidLine = pidTask.stdout.split(/\r?\n/).find((l) => l.startsWith('"'));
      if (pidLine) proc = parseTaskRow(pidLine, portsByPid);
    }
    if (proc) {
      port9000 = { port: 9000, userName: proc.userName, pid: proc.pid, sessionId: proc.sessionId };
    }
  }

  const loggedInUsers = Object.entries(sessions).map(([sessionId, s]) => ({
    userName: s.userName,
    sessionId: Number(sessionId),
    state: s.state,
    tallyOpen: processes.some((p) => p.sessionId === Number(sessionId)),
  }));

  return { count: processes.length, processes, loggedInUsers, port9000 };
};

module.exports = { getTallySessions };

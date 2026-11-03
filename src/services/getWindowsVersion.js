const os = require('os');
const { execFile } = require('child_process');
const { getTallySessions } = require('./getTallySessions');

// Runs systeminfo through cmd.exe and returns the OS name, OS version, hostname,
// the Windows user the bridge runs as, and the Windows users that have Tally open
const getWindowsVersion = async () => {
  const [stdout, sessions] = await Promise.all([
    new Promise((resolve, reject) => {
      execFile('cmd.exe', ['/d', '/c', 'systeminfo'], { timeout: 60 * 1000, windowsHide: true }, (error, out) =>
        error ? reject(error) : resolve(out)
      );
    }),
    getTallySessions().catch(() => null),
  ]);

  // Lines look like "OS Name:                   Microsoft Windows 11 Home"
  const valueOf = (label) => {
    const line = stdout.split(/\r?\n/).find((l) => l.startsWith(label));
    return line ? line.slice(line.indexOf(':') + 1).trim() : null;
  };

  return {
    osName: valueOf('OS Name'),
    osVersion: valueOf('OS Version'),
    hostname: os.hostname(),
    userName: os.userInfo().username,
    tallyUsers: sessions ? [...new Set(sessions.processes.map((p) => p.userName).filter(Boolean))] : null,
    loggedInUsers: sessions ? sessions.loggedInUsers.map((u) => u.userName) : null,
    port9000User: sessions?.port9000?.userName ?? null,
  };
};

module.exports = { getWindowsVersion };

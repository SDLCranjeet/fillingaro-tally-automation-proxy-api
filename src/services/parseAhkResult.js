// Last stdout line of the AHK script is a JSON result written by Report()
const parseAhkResult = (stdout = '') => {
  const lastLine = stdout.trim().split(/\r?\n/).pop();
  try {
    return JSON.parse(lastLine);
  } catch {
    return null;
  }
};

module.exports = { parseAhkResult };

const { sendJson } = require('../http/sendJson');
const { getTallySessions } = require('../services/getTallySessions');

// Answers GET /system/current-user
// Returns the Windows username of the RDP session that owns Tally on port 9000.
// Uses tasklist + quser + netstat only — no systeminfo, so it responds quickly.
const handleCurrentUser = async (req, res) => {
  const sessions = await getTallySessions();
  const username = sessions?.port9000?.userName ?? null;
  return sendJson(res, 200, { status: 'Success', username });
};

module.exports = { handleCurrentUser };

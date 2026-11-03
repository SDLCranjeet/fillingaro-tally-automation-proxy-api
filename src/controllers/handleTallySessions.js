const { sendJson } = require('../http/sendJson');
const { getTallySessions } = require('../services/getTallySessions');

// Answers GET /tally/sessions with each running tally.exe and the Windows user that owns it
const handleTallySessions = async (req, res) =>
  sendJson(res, 200, { status: 'Success', data: await getTallySessions() });

module.exports = { handleTallySessions };

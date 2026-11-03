const os = require('os');
const { sendJson } = require('../http/sendJson');

// Answers GET /health with this machine's hostname and platform, so you can confirm the bridge is up
const handleHealth = (req, res) =>
  sendJson(res, 200, { status: 'Success', data: { hostname: os.hostname(), platform: process.platform } });

module.exports = { handleHealth };

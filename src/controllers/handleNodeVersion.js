const { sendJson } = require('../http/sendJson');

// Answers GET /system/node-version with the Node version running the bridge
const handleNodeVersion = (req, res) =>
  sendJson(res, 200, {
    status: 'Success',
    data: { nodeVersion: process.version, platform: process.platform, arch: process.arch },
  });

module.exports = { handleNodeVersion };

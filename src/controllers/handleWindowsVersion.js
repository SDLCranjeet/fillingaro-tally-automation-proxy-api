const { sendJson } = require('../http/sendJson');
const { getWindowsVersion } = require('../services/getWindowsVersion');

// Answers GET /system/windows-version with the OS name, version and hostname
const handleWindowsVersion = async (req, res) =>
  sendJson(res, 200, { status: 'Success', data: await getWindowsVersion() });

module.exports = { handleWindowsVersion };

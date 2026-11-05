const http = require('http');
const { isAuthorized } = require('../middleware/isAuthorized');
const { sendJson } = require('../http/sendJson');
const { handleHealth } = require('../controllers/handleHealth');
const { handleNodeVersion } = require('../controllers/handleNodeVersion');
const { handleWindowsVersion } = require('../controllers/handleWindowsVersion');
const { handleCurrentUser } = require('../controllers/handleCurrentUser');
const { handleOpenTally } = require('../controllers/handleOpenTally');
const { handleTallySessions } = require('../controllers/handleTallySessions');

// Maps "METHOD /path" to the handler that serves it
const routes = {
  'GET /health': handleHealth,
  'GET /system/node-version': handleNodeVersion,
  'GET /system/windows-version': handleWindowsVersion,
  'GET /system/current-user': handleCurrentUser,
  'POST /tally/open': handleOpenTally,
  'GET /tally/sessions': handleTallySessions,
};

// Creates the HTTP server: checks the token on every request, then routes by method and path
const createBridgeServer = () =>
  http.createServer(async (req, res) => {
    try {
      console.log(`[BRIDGE] request from ${req.socket.remoteAddress}: ${req.method} ${req.url}`);
      if (!isAuthorized(req)) {
        console.log('[BRIDGE] rejected: bad or missing token');
        return sendJson(res, 401, { status: 'Failed', error: 'Unauthorized' });
      }

      const { pathname } = new URL(req.url, 'http://localhost');
      const handler = routes[`${req.method} ${pathname}`];
      if (!handler) {
        return sendJson(res, 404, { status: 'Failed', error: 'Not found' });
      }
      return await handler(req, res);
    } catch (error) {
      console.error('[automation-bridge]', error.message);
      return sendJson(res, error.statusCode || 500, { status: 'Failed', error: error.message });
    }
  });

module.exports = { createBridgeServer };

// Automation bridge: runs on the Windows RDP machine. Started from an
// interactive session so AutoHotkey can drive the desktop.
//
//   copy .env.example .env   (then set AUTOMATION_BRIDGE_TOKEN)
//   npm start
require('dotenv').config();

const { PORT, HOST } = require('./src/config');
const { createBridgeServer } = require('./src/server/createBridgeServer');

// Starts listening on 127.0.0.1:2002 (or AUTOMATION_BRIDGE_PORT)
createBridgeServer().listen(PORT, HOST, () => {
  console.log(`[automation-bridge] listening on http://${HOST}:${PORT}`);
});

// Settings read from .env (see .env.example). Throws at startup if the token is missing.
const PORT = Number(process.env.AUTOMATION_BRIDGE_PORT) || 2002;
// Loopback only: cloudflared runs on this machine and forwards to it
const HOST = '0.0.0.0';
const TOKEN = process.env.AUTOMATION_BRIDGE_TOKEN;
const AHK_EXE_PATH = process.env.AHK_EXE_PATH || 'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe';

// Script waits on prompts + ~6s per company, so allow plenty of time
const AHK_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;

if (!TOKEN) {
  throw new Error('AUTOMATION_BRIDGE_TOKEN is not set');
}

module.exports = {
  PORT,
  HOST,
  TOKEN,
  AHK_EXE_PATH,
  AHK_TIMEOUT_MS,
  MAX_BODY_BYTES,
};

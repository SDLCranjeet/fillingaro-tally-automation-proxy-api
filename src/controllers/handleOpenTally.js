const { readJsonBody } = require('../http/readJsonBody');
const { sendJson } = require('../http/sendJson');
const { validateOpenTallyPayload } = require('../validation/validateOpenTallyPayload');
const { runAhk } = require('../services/runAhk');

let tallyRunning = false;

// Handles POST /tally/open: reads and validates the payload, runs the AHK script (one at a time), and sends back its result
const handleOpenTally = async (req, res) => {
  const body = await readJsonBody(req);
  console.log(`[BRIDGE] payload received: ${JSON.stringify(body)}`);

  const error = validateOpenTallyPayload(body);
  if (error) {
    console.log(`[BRIDGE] validation failed: ${error}`);
    return sendJson(res, 400, { status: 'Failed', error });
  }
  console.log('[BRIDGE] validation passed');

  if (tallyRunning) {
    console.log('[BRIDGE] rejected: another run is in progress');
    return sendJson(res, 409, { status: 'Failed', error: 'A Tally run is already in progress on this machine' });
  }

  const { ahkPath, defaultCompanies, secondsPerCompany, tallyPath, dataPath, companies } = body;
  // Arg order must match LoadCompaniesOnStartup.ahk (A_Args[1..4], then companies)
  const args = [ahkPath, String(defaultCompanies), String(secondsPerCompany), tallyPath, dataPath, ...companies];

  tallyRunning = true;
  const startedAt = Date.now();
  try {
    const result = await runAhk(args);
    console.log(`[BRIDGE] AHK done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s, sending 200 back`);
    return sendJson(res, 200, { status: 'Success', data: result });
  } catch (runError) {
    console.log(`[BRIDGE] AHK failed: ${runError.message}, sending 500 back`);
    return sendJson(res, 500, { status: 'Failed', error: runError.message });
  } finally {
    tallyRunning = false;
  }
};

module.exports = { handleOpenTally };

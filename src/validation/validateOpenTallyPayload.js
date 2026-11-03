const { isValidCompanyName } = require('./isValidCompanyName');
const { isValidPath } = require('./isValidPath');
const { isValidTallyPath } = require('./isValidTallyPath');
const { isValidAhkPath } = require('./isValidAhkPath');
const { isFile } = require('./isFile');
const { isDirectory } = require('./isDirectory');

// Checks the /tally/open payload: numbers in range, AHK and Tally files and data folder exist, company names are safe. Returns an error message or null
const validateOpenTallyPayload = (body) => {
  if (!Number.isInteger(body.defaultCompanies) || body.defaultCompanies < 0 || body.defaultCompanies > 100) {
    return 'defaultCompanies must be a whole number between 0 and 100';
  }
  if (typeof body.secondsPerCompany !== 'number' || !(body.secondsPerCompany >= 0 && body.secondsPerCompany <= 60)) {
    return 'secondsPerCompany must be a number between 0 and 60';
  }
  if (!isValidAhkPath(body.ahkPath) || !isFile(body.ahkPath)) {
    return `AHK script "${body.ahkPath}" was not found on this machine`;
  }
  if (!isValidTallyPath(body.tallyPath) || !isFile(body.tallyPath)) {
    return `Tally path "${body.tallyPath}" was not found on this machine`;
  }
  if (!isValidPath(body.dataPath) || !isDirectory(body.dataPath)) {
    return `Data path "${body.dataPath}" was not found on this machine`;
  }
  if (
    !Array.isArray(body.companies) ||
    body.companies.length === 0 ||
    body.companies.length > 100 ||
    !body.companies.every(isValidCompanyName)
  ) {
    return 'companies must be 1 to 100 valid company names';
  }
  return null;
};

module.exports = { validateOpenTallyPayload };

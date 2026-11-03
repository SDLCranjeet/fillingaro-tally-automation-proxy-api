// Checks a company name is a non-empty string under 100 chars with no quotes, backslashes or line breaks
const isValidCompanyName = (name) =>
  typeof name === 'string' && name.length > 0 && name.length <= 100 && !/["\\\r\n]/.test(name);

module.exports = { isValidCompanyName };

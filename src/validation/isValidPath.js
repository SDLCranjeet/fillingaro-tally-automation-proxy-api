// Checks a path is a non-empty string under 260 chars with no quotes or line breaks
const isValidPath = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= 260 && !/["\r\n]/.test(value);

module.exports = { isValidPath };

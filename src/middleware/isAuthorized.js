const crypto = require('crypto');
const { TOKEN } = require('../config');

// Checks the Authorization header matches "Bearer <token>", comparing in constant time
const isAuthorized = (req) => {
  const expected = Buffer.from(`Bearer ${TOKEN}`);
  const given = Buffer.from(req.headers.authorization || '');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

module.exports = { isAuthorized };

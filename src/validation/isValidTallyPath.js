const path = require('path');
const { isValidPath } = require('./isValidPath');

// Checks the path is a valid path that ends in tally.exe
const isValidTallyPath = (value) =>
  isValidPath(value) && path.win32.basename(value).toLowerCase() === 'tally.exe';

module.exports = { isValidTallyPath };

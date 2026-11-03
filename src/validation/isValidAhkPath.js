const path = require('path');
const { isValidPath } = require('./isValidPath');

// Checks the path is a valid path that ends in .ahk
const isValidAhkPath = (value) =>
  isValidPath(value) && path.win32.extname(value).toLowerCase() === '.ahk';

module.exports = { isValidAhkPath };

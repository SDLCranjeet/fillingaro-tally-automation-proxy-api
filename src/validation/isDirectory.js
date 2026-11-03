const fs = require('fs');

// Checks a path exists on this machine and is a folder
const isDirectory = (value) => fs.existsSync(value) && fs.statSync(value).isDirectory();

module.exports = { isDirectory };

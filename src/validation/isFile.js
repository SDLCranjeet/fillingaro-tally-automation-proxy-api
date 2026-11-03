const fs = require('fs');

// Checks a path exists on this machine and is a file
const isFile = (value) => fs.existsSync(value) && fs.statSync(value).isFile();

module.exports = { isFile };

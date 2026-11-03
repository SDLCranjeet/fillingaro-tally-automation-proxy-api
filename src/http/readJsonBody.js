const { MAX_BODY_BYTES } = require('../config');

// Collects the request body chunk by chunk (max 64 KB) and parses it as JSON; an empty body becomes {}
const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        return reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
      }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(Object.assign(new Error('Body must be JSON'), { statusCode: 400 }));
      }
    });
  });

module.exports = { readJsonBody };

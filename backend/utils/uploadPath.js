const path = require('path');

// Use /tmp for serverless environments (Vercel), local uploads for development
const getUploadDir = () => {
  return process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
};

module.exports = getUploadDir;

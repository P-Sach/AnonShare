const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName:  { type: String, required: true },
  storageName:   { type: String, required: true },
  mimeType:      { type: String, required: true },
  size:          { type: Number, required: true },
  createdAt:     { type: Date,   default: Date.now },
  // TTL index: document will be removed when `expireAt` is reached
  expireAt:      { type: Date,   index: { expires: 0 } },
  passwordHash:  { type: String, default: null },
  maxDownloads:  { type: Number, default: null },
  downloadCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('File', fileSchema);

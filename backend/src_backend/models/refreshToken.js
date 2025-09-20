// backend/src/models/RefreshToken.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },      // sha256 of the opaque token
  expiresAt: { type: Date, required: true },
  createdByIp: String,
  revoked: { type: Boolean, default: false },
  revokedAt: Date,
  replacedByTokenHash: String,
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);

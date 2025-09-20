// backend/src/utils/token.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);

if (!JWT_SECRET) throw new Error('JWT_SECRET not set in env');

function generateAccessToken(user) {
  // user: mongoose doc or object with _id
  return jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// create an opaque refresh token and its metadata (token plaintext for cookie + hash for DB)
function createRefreshTokenPlaintext() {
  const token = crypto.randomBytes(64).toString('hex'); // 128 hex chars
  const tokenHash = sha256(token);
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expires };
}

module.exports = { generateAccessToken, createRefreshTokenPlaintext, sha256 };

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RefreshToken = require('../models/refreshToken');
const bcrypt = require('bcrypt');
const { generateAccessToken, createRefreshTokenPlaintext, sha256 } = require('../utils/token');

const COOKIE_NAME = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'PRODUCTION';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
};

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
    console.log("hello")
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const accessToken = generateAccessToken(user);

    const { token, tokenHash, expires } = createRefreshTokenPlaintext();
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt: expires,
      createdByIp: req.ip,
    });

    const maxAge = expires.getTime() - Date.now();
    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge });

    return res.json({ accessToken });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const incoming = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (!incoming) return res.status(401).json({ error: 'no refresh token' });

    const incomingHash = sha256(incoming);
    const tokenDoc = await RefreshToken.findOne({ tokenHash: incomingHash });

    if (!tokenDoc || tokenDoc.revoked || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({ error: 'invalid or expired refresh token' });
    }

    const { token: newTokenPlain, tokenHash: newTokenHash, expires: newExpires } = createRefreshTokenPlaintext();

    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedByTokenHash = newTokenHash;
    await tokenDoc.save();

    await RefreshToken.create({
      user: tokenDoc.user,
      tokenHash: newTokenHash,
      expiresAt: newExpires,
      createdByIp: req.ip,
    });

    const user = await require('../models/User').findById(tokenDoc.user);
    if (!user) return res.status(401).json({ error: 'user not found' });
    const accessToken = generateAccessToken(user);

    const maxAge = newExpires.getTime() - Date.now();
    res.cookie(COOKIE_NAME, newTokenPlain, { ...COOKIE_OPTIONS, maxAge });

    return res.json({ accessToken });
  } catch (err) {
    console.error('refresh error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const incoming = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (!incoming) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.json({ ok: true });
    }
    const incomingHash = sha256(incoming);
    const tokenDoc = await RefreshToken.findOne({ tokenHash: incomingHash });
    if (tokenDoc) {
      tokenDoc.revoked = true;
      tokenDoc.revokedAt = new Date();
      await tokenDoc.save();
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(500).json({ error: 'server error' });
  }
});

const authenticateJWT = require('../middleware/auth');
router.get('/me', authenticateJWT, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  return res.json({ id: user._id, email: user.email });
});

module.exports = router;

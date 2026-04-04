/**
 * BassFlow API — routes/auth.js
 * POST /api/auth/register  — create account
 * POST /api/auth/login     — get JWT
 * GET  /api/auth/me        — get current user
 */

'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, role = 'creator', genre, location } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();

  const exists = db.prepare('SELECT id FROM users WHERE email=? OR username=?').get(email, username);
  if (exists) {
    return res.status(409).json({ error: 'Email or username already taken' });
  }

  const hash = await bcrypt.hash(password, 10);

  const result = db.prepare(`
    INSERT INTO users (username,email,password,role,genre,location)
    VALUES (?,?,?,?,?,?)
  `).run(username, email, hash, role, genre || 'Mixed', location || null);

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
  const token = makeToken(user);

  return res.status(201).json({ token, user: sanitiseUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = makeToken(user);
  return res.json({ token, user: sanitiseUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(sanitiseUser(user));
});

function sanitiseUser(u) {
  const { password, ...rest } = u;
  return rest;
}

module.exports = router;

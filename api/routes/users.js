/**
 * BassFlow API — routes/users.js
 * GET  /api/users              — list all creators
 * GET  /api/users/:id          — public profile
 * PUT  /api/users/me           — update own profile [auth]
 * POST /api/users/:id/follow   — toggle follow [auth]
 */

'use strict';

const express = require('express');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function sanitise(u) {
  const { password, ...rest } = u;
  return rest;
}

// GET /api/users
router.get('/', (req, res) => {
  const db    = getDb();
  const { limit = 50, q } = req.query;
  let sql  = 'SELECT * FROM users WHERE 1=1';
  const args = [];
  if (q) { sql += ' AND (username LIKE ? OR bio LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY xp DESC LIMIT ?';
  args.push(Number(limit));
  const users = db.prepare(sql).all(...args).map(sanitise);
  return res.json({ users });
});

// GET /api/users/:id
router.get('/:id', optionalAuth, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const tracks = db.prepare('SELECT * FROM tracks WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(user.id);
  const mixes  = db.prepare('SELECT * FROM mixes  WHERE user_id=? ORDER BY created_at DESC LIMIT 10').all(user.id);

  let following = false;
  if (req.user) {
    const f = db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND followed_id=?').get(req.user.id, user.id);
    following = !!f;
  }

  return res.json({ user: sanitise(user), tracks, mixes, following });
});

// PUT /api/users/me
router.put('/me', requireAuth, (req, res) => {
  const db = getDb();
  const { bio, genre, location, avatar, soundcloud, mixcloud, youtube, instagram, website } = req.body;

  db.prepare(`
    UPDATE users SET
      bio       = COALESCE(?,bio),
      genre     = COALESCE(?,genre),
      location  = COALESCE(?,location),
      avatar    = COALESCE(?,avatar),
      soundcloud= COALESCE(?,soundcloud),
      mixcloud  = COALESCE(?,mixcloud),
      youtube   = COALESCE(?,youtube),
      instagram = COALESCE(?,instagram),
      website   = COALESCE(?,website)
    WHERE id=?
  `).run(bio, genre, location, avatar, soundcloud, mixcloud, youtube, instagram, website, req.user.id);

  return res.json({ user: sanitise(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
});

// POST /api/users/:id/follow
router.post('/:id/follow', requireAuth, (req, res) => {
  const db      = getDb();
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

  const target = db.prepare('SELECT id FROM users WHERE id=?').get(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND followed_id=?').get(req.user.id, targetId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id=? AND followed_id=?').run(req.user.id, targetId);
    db.prepare('UPDATE users SET followers=followers-1 WHERE id=?').run(targetId);
    db.prepare('UPDATE users SET following=following-1 WHERE id=?').run(req.user.id);
    return res.json({ following: false });
  } else {
    db.prepare('INSERT INTO follows (follower_id,followed_id) VALUES (?,?)').run(req.user.id, targetId);
    db.prepare('UPDATE users SET followers=followers+1 WHERE id=?').run(targetId);
    db.prepare('UPDATE users SET following=following+1 WHERE id=?').run(req.user.id);
    return res.json({ following: true });
  }
});

module.exports = router;

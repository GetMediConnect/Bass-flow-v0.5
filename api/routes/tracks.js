/**
 * BassFlow API — routes/tracks.js
 * GET    /api/tracks              — list (genre, q, limit, offset)
 * GET    /api/tracks/:id          — single track + comments
 * POST   /api/tracks              — create [auth]
 * PUT    /api/tracks/:id          — update [auth + owner]
 * DELETE /api/tracks/:id          — delete [auth + owner]
 * POST   /api/tracks/:id/like     — toggle like [auth]
 * POST   /api/tracks/:id/comments — add comment [auth]
 * POST   /api/tracks/:id/play     — increment play count
 */

'use strict';

const express = require('express');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tracks
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { genre, q, limit = 50, offset = 0, sort = 'likes' } = req.query;

  const allowed = ['likes', 'plays', 'created_at', 'bpm'];
  const order   = allowed.includes(sort) ? sort : 'likes';

  let sql    = 'SELECT * FROM tracks WHERE 1=1';
  const args = [];

  if (genre && genre !== 'all') { sql += ' AND genre=?'; args.push(genre); }
  if (q)                        { sql += ' AND (title LIKE ? OR artist LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }

  sql += ` ORDER BY ${order} DESC LIMIT ? OFFSET ?`;
  args.push(Number(limit), Number(offset));

  const tracks = db.prepare(sql).all(...args);

  // Attach liked flag for authenticated user
  if (req.user) {
    const liked = db.prepare('SELECT track_id FROM likes WHERE user_id=?').all(req.user.id);
    const likedSet = new Set(liked.map(l => l.track_id));
    tracks.forEach(t => { t.liked = likedSet.has(t.id); });
  }

  return res.json({ tracks, total: tracks.length });
});

// GET /api/tracks/:id
router.get('/:id', optionalAuth, (req, res) => {
  const db    = getDb();
  const track = db.prepare('SELECT * FROM tracks WHERE id=?').get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar FROM comments c
    JOIN users u ON u.id=c.user_id
    WHERE c.track_id=? ORDER BY c.created_at DESC LIMIT 50
  `).all(track.id);

  if (req.user) {
    const like = db.prepare('SELECT 1 FROM likes WHERE user_id=? AND track_id=?').get(req.user.id, track.id);
    track.liked = !!like;
  }

  return res.json({ track, comments });
});

// POST /api/tracks
router.post('/', requireAuth, (req, res) => {
  const { title, artist, genre = 'dnb', bpm = 174, key_note, audio_url, artwork_url, color } = req.body;
  if (!title || !artist) return res.status(400).json({ error: 'title and artist are required' });

  const db     = getDb();
  const result = db.prepare(`
    INSERT INTO tracks (title,artist,genre,bpm,key_note,audio_url,artwork_url,color,user_id)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(title, artist, genre, bpm, key_note || null, audio_url || null, artwork_url || null, color || '#0a0a0f', req.user.id);

  const track = db.prepare('SELECT * FROM tracks WHERE id=?').get(result.lastInsertRowid);
  return res.status(201).json({ track });
});

// PUT /api/tracks/:id
router.put('/:id', requireAuth, (req, res) => {
  const db    = getDb();
  const track = db.prepare('SELECT * FROM tracks WHERE id=?').get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  if (track.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, artist, genre, bpm, key_note, artwork_url, color } = req.body;
  db.prepare(`
    UPDATE tracks SET title=COALESCE(?,title), artist=COALESCE(?,artist),
    genre=COALESCE(?,genre), bpm=COALESCE(?,bpm), key_note=COALESCE(?,key_note),
    artwork_url=COALESCE(?,artwork_url), color=COALESCE(?,color) WHERE id=?
  `).run(title, artist, genre, bpm, key_note, artwork_url, color, track.id);

  return res.json({ track: db.prepare('SELECT * FROM tracks WHERE id=?').get(track.id) });
});

// DELETE /api/tracks/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db    = getDb();
  const track = db.prepare('SELECT * FROM tracks WHERE id=?').get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  if (track.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM tracks WHERE id=?').run(track.id);
  return res.json({ message: 'Track deleted' });
});

// POST /api/tracks/:id/like
router.post('/:id/like', requireAuth, (req, res) => {
  const db    = getDb();
  const track = db.prepare('SELECT * FROM tracks WHERE id=?').get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  const existing = db.prepare('SELECT 1 FROM likes WHERE user_id=? AND track_id=?').get(req.user.id, track.id);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id=? AND track_id=?').run(req.user.id, track.id);
    db.prepare('UPDATE tracks SET likes=likes-1 WHERE id=?').run(track.id);
    return res.json({ liked: false, likes: track.likes - 1 });
  } else {
    db.prepare('INSERT INTO likes (user_id,track_id) VALUES (?,?)').run(req.user.id, track.id);
    db.prepare('UPDATE tracks SET likes=likes+1 WHERE id=?').run(track.id);
    return res.json({ liked: true, likes: track.likes + 1 });
  }
});

// POST /api/tracks/:id/comments
router.post('/:id/comments', requireAuth, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Comment body is required' });

  const db    = getDb();
  const track = db.prepare('SELECT id FROM tracks WHERE id=?').get(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  const result  = db.prepare('INSERT INTO comments (track_id,user_id,body) VALUES (?,?,?)').run(track.id, req.user.id, body.trim());
  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar FROM comments c
    JOIN users u ON u.id=c.user_id WHERE c.id=?
  `).get(result.lastInsertRowid);

  return res.status(201).json({ comment });
});

// POST /api/tracks/:id/play
router.post('/:id/play', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE tracks SET plays=plays+1 WHERE id=?').run(req.params.id);
  return res.json({ ok: true });
});

module.exports = router;

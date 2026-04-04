/**
 * BassFlow API — routes/mixes.js
 * GET    /api/mixes      — list
 * POST   /api/mixes      — create [auth]
 * DELETE /api/mixes/:id  — delete [auth + owner]
 */

'use strict';

const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/mixes
router.get('/', (req, res) => {
  const db = getDb();
  const { genre, limit = 20 } = req.query;
  let sql  = 'SELECT * FROM mixes WHERE 1=1';
  const args = [];
  if (genre && genre !== 'all') { sql += ' AND genre=?'; args.push(genre); }
  sql += ' ORDER BY plays DESC LIMIT ?';
  args.push(Number(limit));
  return res.json({ mixes: db.prepare(sql).all(...args) });
});

// POST /api/mixes
router.post('/', requireAuth, (req, res) => {
  const { title, dj, duration, genre = 'dnb', tracklist, audio_url } = req.body;
  if (!title || !dj) return res.status(400).json({ error: 'title and dj are required' });

  const db     = getDb();
  const result = db.prepare(`
    INSERT INTO mixes (title,dj,duration,genre,tracklist,audio_url,user_id)
    VALUES (?,?,?,?,?,?,?)
  `).run(title, dj, duration || '0:00', genre, tracklist || null, audio_url || null, req.user.id);

  return res.status(201).json({ mix: db.prepare('SELECT * FROM mixes WHERE id=?').get(result.lastInsertRowid) });
});

// DELETE /api/mixes/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db  = getDb();
  const mix = db.prepare('SELECT * FROM mixes WHERE id=?').get(req.params.id);
  if (!mix) return res.status(404).json({ error: 'Mix not found' });
  if (mix.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM mixes WHERE id=?').run(mix.id);
  return res.json({ message: 'Mix deleted' });
});

module.exports = router;

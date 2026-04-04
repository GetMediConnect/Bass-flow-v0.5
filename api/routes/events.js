/**
 * BassFlow API — routes/events.js
 * GET    /api/events      — list upcoming
 * POST   /api/events      — create [auth]
 * PUT    /api/events/:id  — update [auth + owner]
 * DELETE /api/events/:id  — delete [auth + owner]
 */

'use strict';

const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/events
router.get('/', (req, res) => {
  const db = getDb();
  const { country, limit = 20 } = req.query;
  let sql  = "SELECT * FROM events WHERE date >= date('now')";
  const args = [];
  if (country) { sql += ' AND country=?'; args.push(country); }
  sql += ' ORDER BY date ASC LIMIT ?';
  args.push(Number(limit));
  return res.json({ events: db.prepare(sql).all(...args) });
});

// POST /api/events
router.post('/', requireAuth, (req, res) => {
  const { title, venue, city, country = 'UK', date, tags, description, ticket_url } = req.body;
  if (!title || !venue || !date) return res.status(400).json({ error: 'title, venue and date are required' });

  const db     = getDb();
  const result = db.prepare(`
    INSERT INTO events (title,venue,city,country,date,tags,description,ticket_url,user_id)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(title, venue, city || null, country, date, tags || null, description || null, ticket_url || null, req.user.id);

  return res.status(201).json({ event: db.prepare('SELECT * FROM events WHERE id=?').get(result.lastInsertRowid) });
});

// PUT /api/events/:id
router.put('/:id', requireAuth, (req, res) => {
  const db    = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, venue, city, country, date, tags, description, ticket_url } = req.body;
  db.prepare(`
    UPDATE events SET title=COALESCE(?,title),venue=COALESCE(?,venue),city=COALESCE(?,city),
    country=COALESCE(?,country),date=COALESCE(?,date),tags=COALESCE(?,tags),
    description=COALESCE(?,description),ticket_url=COALESCE(?,ticket_url) WHERE id=?
  `).run(title, venue, city, country, date, tags, description, ticket_url, event.id);

  return res.json({ event: db.prepare('SELECT * FROM events WHERE id=?').get(event.id) });
});

// DELETE /api/events/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db    = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM events WHERE id=?').run(event.id);
  return res.json({ message: 'Event deleted' });
});

module.exports = router;

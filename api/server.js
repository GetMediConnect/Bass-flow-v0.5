/**
 * BassFlow API — server.js
 * Main Express application
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { getDb, seedDatabase } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static assets (serve V6 from repo root) ───────────────────────────────────
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, {
  index: 'bassflow_v6.html',
  extensions: ['html'],
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/tracks', require('./routes/tracks'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/mixes',  require('./routes/mixes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', version: '6.0.0', timestamp: new Date().toISOString() })
);

// ── 404 fallback (SPA) ────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT, 'bassflow_v6.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start() {
  // Initialise DB (creates schema + seeds if empty)
  getDb();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`\n🎵  BassFlow API v6  running on  http://localhost:${PORT}`);
    console.log(`📊  API Health →     http://localhost:${PORT}/api/health`);
    console.log(`🌐  Frontend →       http://localhost:${PORT}\n`);
  });
}

start().catch(console.error);

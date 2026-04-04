/**
 * BassFlow API — db.js
 * SQLite database setup, schema creation and seed data
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'bassflow.db');

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'creator',
      avatar      TEXT    DEFAULT NULL,
      bio         TEXT    DEFAULT NULL,
      genre       TEXT    DEFAULT 'Mixed',
      location    TEXT    DEFAULT NULL,
      soundcloud  TEXT    DEFAULT NULL,
      mixcloud    TEXT    DEFAULT NULL,
      youtube     TEXT    DEFAULT NULL,
      instagram   TEXT    DEFAULT NULL,
      website     TEXT    DEFAULT NULL,
      xp          INTEGER NOT NULL DEFAULT 0,
      followers   INTEGER NOT NULL DEFAULT 0,
      following   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      artist      TEXT    NOT NULL,
      genre       TEXT    NOT NULL DEFAULT 'dnb',
      bpm         INTEGER DEFAULT 174,
      key_note    TEXT    DEFAULT NULL,
      duration    INTEGER DEFAULT 0,
      plays       INTEGER NOT NULL DEFAULT 0,
      likes       INTEGER NOT NULL DEFAULT 0,
      artwork_url TEXT    DEFAULT NULL,
      audio_url   TEXT    DEFAULT NULL,
      color       TEXT    DEFAULT '#1a0a00',
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mixes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      dj          TEXT    NOT NULL,
      duration    TEXT    DEFAULT '0:00',
      plays       INTEGER NOT NULL DEFAULT 0,
      genre       TEXT    DEFAULT 'dnb',
      tracklist   TEXT    DEFAULT NULL,
      banner_url  TEXT    DEFAULT NULL,
      audio_url   TEXT    DEFAULT NULL,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      venue       TEXT    NOT NULL,
      city        TEXT    DEFAULT NULL,
      country     TEXT    DEFAULT 'UK',
      date        TEXT    NOT NULL,
      tags        TEXT    DEFAULT NULL,
      ticket_url  TEXT    DEFAULT NULL,
      description TEXT    DEFAULT NULL,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (follower_id, followed_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_genre    ON tracks(genre);
    CREATE INDEX IF NOT EXISTS idx_tracks_user     ON tracks(user_id);
    CREATE INDEX IF NOT EXISTS idx_mixes_user      ON mixes(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date     ON events(date);
    CREATE INDEX IF NOT EXISTS idx_comments_track  ON comments(track_id);
  `);
}

async function seedDatabase() {
  const db = getDb();

  // Bail if already seeded
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  console.log('Seeding database…');

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (username,email,password,role,bio,genre,location,xp,followers)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);

  const users = [
    ['dj_maduki',    'maduki@bassflow.io',   hash('demo1234'), 'creator', 'Neurofunk & liquid DnB from the UK. Founder of BassFlow.', 'Neurofunk',  'London, UK',    8800, 4200],
    ['liquid_soul',  'liquid@bassflow.io',   hash('demo1234'), 'creator', 'Liquid vibes all day, every day.',                         'Liquid DnB', 'Berlin, DE',    3400, 3100],
    ['jungle_empress','jungle@bassflow.io',  hash('demo1234'), 'creator', 'Jungle & ragga DnB from Bristol.',                         'Jungle',     'Bristol, UK',   5500, 2700],
    ['neurobrain',   'neuro@bassflow.io',    hash('demo1234'), 'creator', 'Pure neurofunk.',                                          'Neurofunk',  'Amsterdam, NL', 1200, 1800],
    ['sub_zero',     'subzero@bassflow.io',  hash('demo1234'), 'creator', 'Techstep & dark DnB from Melbourne.',                      'Techstep',   'Melbourne, AU', 2100, 2200],
    ['mc_bassline',  'mc@bassflow.io',       hash('demo1234'), 'creator', 'Jump Up & Jungle from New York.',                          'Jump Up',    'New York, US',  5500, 3500],
    ['deep_current', 'deep@bassflow.io',     hash('demo1234'), 'creator', 'Liquid & ambient from Toronto.',                           'Liquid DnB', 'Toronto, CA',   900,  1400],
    ['velocity_crew','velocity@bassflow.io', hash('demo1234'), 'creator', 'Techstep & neuro from Tokyo.',                             'Techstep',   'Tokyo, JP',     2900, 2900],
  ];

  const userIds = {};
  for (const u of users) {
    const res = insertUser.run(...u);
    userIds[u[0]] = res.lastInsertRowid;
  }

  // Tracks
  const insertTrack = db.prepare(`
    INSERT INTO tracks (title,artist,genre,bpm,key_note,plays,likes,artwork_url,color,user_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);

  const tracks = [
    ['Shadow Protocol',     'DarkStep Inc.',   'neuro',    174, '8A',  12400, 4812, null, '#1a0a00', userIds['dj_maduki']],
    ['Liquid Sunrise',      'Oceanic Vibes',   'liquid',   170, '9A',   8200, 3204, null, '#000d1a', userIds['liquid_soul']],
    ['Ragga Warfare',       'JungleKing',      'jungle',   160, '6B',  15600, 5109, null, '#001a00', userIds['jungle_empress']],
    ['Neural Storm',        'Cortex Audio',    'neuro',    176, '8A',  19800, 6723, null, '#0d001a', userIds['neurobrain']],
    ['Bounce Factory',      'JumpCrew',        'jump-up',  172, '7A',  24100, 8841, null, '#1a1600', userIds['mc_bassline']],
    ['Cold Steel',          'TechMachine',     'techstep', 178, '11A',  9300, 3310, null, '#0d0d0d', userIds['sub_zero']],
    ['Glass Rivers',        'Serene DnB',      'liquid',   168, '10A',  7100, 2897, null, '#001526', userIds['deep_current']],
    ['Carnival Selector',   'JungleKing',      'jungle',   162, '5B',  13200, 4420, null, '#1a0d00', userIds['jungle_empress']],
    ['Synaptic Overload',   'Cortex Audio',    'neuro',    175, '8A',  16500, 5508, null, '#130017', userIds['neurobrain']],
    ['Bass Cannon Redux',   'HeavyWeight DnB', 'jump-up',  174, '7A',  28400, 9302, null, '#1a0000', userIds['mc_bassline']],
    ['Iron Meridian',       'TechMachine',     'techstep', 180, '11A',  8100, 2716, null, '#090909', userIds['sub_zero']],
    ['Velvet Underground',  'Oceanic Vibes',   'liquid',   170, '9A',  11200, 3987, null, '#00101a', userIds['liquid_soul']],
    ['Neural Collapse',     'DJ MADUKI',       'neuro',    174, '8A',  22000, 7100, null, '#150022', userIds['dj_maduki']],
    ['Tokyo Night Drive',   'Velocity Crew',   'techstep', 177, '3A',  10400, 3580, null, '#001133', userIds['velocity_crew']],
    ['Jungle Frequency',    'MC Bassline',     'jungle',   165, '4B',  17800, 6200, null, '#0a1a00', userIds['mc_bassline']],
    ['Deep Space Liquid',   'Deep Current',    'liquid',   169, '10A',  6300, 2100, null, '#000a15', userIds['deep_current']],
  ];

  for (const t of tracks) insertTrack.run(...t);

  // Mixes
  const insertMix = db.prepare(`
    INSERT INTO mixes (title,dj,duration,plays,genre,user_id)
    VALUES (?,?,?,?,?,?)
  `);

  const mixes = [
    ['Neuro Odyssey Vol. 7',     'DJ MADUKI',      '1:02:14', 48000, 'neuro',    userIds['dj_maduki']],
    ['Liquid Daydream Mix',       'Liquid Soul',    '58:42',   31000, 'liquid',   userIds['liquid_soul']],
    ['Jungle Warrior Selector',   'Jungle Empress', '1:15:08', 62000, 'jungle',   userIds['jungle_empress']],
    ['TechStep Domination',       'Sub Zero',       '1:08:55', 27000, 'techstep', userIds['sub_zero']],
    ['Jump Up Carnage',           'MC Bassline',    '52:30',   73000, 'jump-up',  userIds['mc_bassline']],
    ['Tokyo Bass Connection',     'Velocity Crew',  '1:10:20', 19000, 'techstep', userIds['velocity_crew']],
    ['Deep Liquid Sessions #4',   'Deep Current',   '1:05:00', 11000, 'liquid',   userIds['deep_current']],
    ['Neuro Blackout Vol. 2',     'NeuroBrain',     '1:00:00', 15000, 'neuro',    userIds['neurobrain']],
  ];

  for (const m of mixes) insertMix.run(...m);

  // Events
  const insertEvent = db.prepare(`
    INSERT INTO events (title,venue,city,country,date,tags)
    VALUES (?,?,?,?,?,?)
  `);

  const events = [
    ['Bass Inferno — Summer Edition', 'Fabric',          'London',    'UK',  '2026-06-14', 'Neuro,Techstep,DnB'],
    ['Jungle Fever Weekender',        'Printworks',       'London',    'UK',  '2026-06-21', 'Jungle,Ragga DnB'],
    ['Liquid Sessions Vol. 14',       'Tresor',           'Berlin',    'DE',  '2026-07-05', 'Liquid,Atmospheric'],
    ['Neural Frequency Festival',     'Melkweg',          'Amsterdam', 'NL',  '2026-07-12', 'Neuro,Sci-Fi DnB'],
    ['Jump Up Massive',               'Motion',           'Bristol',   'UK',  '2026-07-19', 'Jump Up,Party DnB'],
    ['Sub:Culture Open Air',          'Red Star Park',    'Melbourne', 'AU',  '2026-07-26', 'All Genres,Outdoor'],
    ['BassFlow Launch Party',         'Electric Brixton', 'London',    'UK',  '2026-08-02', 'All Genres,Special'],
    ['Neurofunk Nation 2026',         'Arena Wien',       'Vienna',    'AT',  '2026-08-16', 'Neuro,Techstep'],
  ];

  for (const e of events) insertEvent.run(...e);

  console.log('Database seeded successfully.');
}

// Run seed if called directly: node db.js --seed
if (require.main === module && process.argv.includes('--seed')) {
  seedDatabase().then(() => process.exit(0)).catch(console.error);
}

module.exports = { getDb, seedDatabase };

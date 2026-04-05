# 🎵 BassFlow v6 — Drum & Bass Creator Platform

> Cyberpunk-styled, AI-powered platform for DJs, producers and DnB music lovers worldwide.

## 🚀 Quick Start

### Frontend (static — open directly in browser)
```bash
open bassflow_v6.html
```

### Backend API (Express + SQLite)
```bash
cd api
npm install
npm start
# → http://localhost:3001
```

The frontend automatically calls `http://localhost:3001` for live data. Falls back to mock data when the API is offline.

## �� Project Structure

```
Bass-flow-v0.5/
├── bassflow_v6.html      ← Main PWA (single-file app)
├── index.html            ← Redirects to v6
├── manifest.json         ← PWA manifest
├── sw.js                 ← Service Worker (offline support)
├── api/
│   ├── server.js         ← Express server (port 3001)
│   ├── db.js             ← SQLite schema + seed data
│   ├── middleware/
│   │   └── auth.js       ← JWT middleware
│   └── routes/
│       ├── auth.js       ← POST /register, POST /login, GET /me
│       ├── tracks.js     ← CRUD + likes + comments + play count
│       ├── users.js      ← Profiles + follow/unfollow
│       ├── events.js     ← Events CRUD
│       └── mixes.js      ← Mixes CRUD
├── css/styles.css        ← Legacy CSS (v1 only)
├── js/app.js             ← Legacy JS (v1 only)
├── docs/
│   └── business/         ← All business PDFs / contracts
└── version_history.txt   ← Full changelog v1→v6
```

## 🔑 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account → JWT |
| POST | `/api/auth/login` | — | Sign in → JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/tracks` | opt | List tracks (genre, q, sort) |
| POST | `/api/tracks` | ✅ | Upload track |
| POST | `/api/tracks/:id/like` | ✅ | Toggle like |
| POST | `/api/tracks/:id/comments` | ✅ | Add comment |
| GET | `/api/users` | — | Leaderboard |
| POST | `/api/users/:id/follow` | ✅ | Toggle follow |
| GET | `/api/events` | — | Upcoming events |
| GET | `/api/mixes` | — | Mixes list |
| GET | `/api/health` | — | Health check |

## 🛠️ AI Tools (11 total)

1. **Web Audio Player** — WAV/MP3/FLAC player with canvas waveform + spectrum analyser + 8-band EQ
2. **BPM + Key Detector** — Beat detection with Camelot Wheel mapping
3. **Stem Separator** — Bass / Drums / Melody / Vocals isolation UI
4. **AI Mastering** — 8-band EQ with genre presets (Neurofunk, Liquid, Jump Up…)
5. **Cover Art Generator** — Canvas-rendered cyberpunk artwork (4 styles)
6. **AI Set Planner** — Key compatibility + energy arc + transition scoring
7. **Suno Prompt Builder** — Suno v4.5 metatag prompts
8. **Lyric Generator** — EN/PL MC chants & drops
9. **Mix Description** — SoundCloud/Mixcloud copy generator
10. **Voice Clone MC** *(Beta placeholder)*
11. **VR Event Builder** *(Experimental placeholder)*

## 📱 PWA

- Installable on Android, iOS, desktop Chrome
- Offline shell caching via Service Worker
- Manifest with theme colour and icons

## 🗄️ Database (SQLite)

Tables: `users`, `tracks`, `mixes`, `events`, `likes`, `follows`, `comments`

Seeded with 8 DJ profiles, 16 tracks, 8 mixes, 8 upcoming events.

## Version History

See [`version_history.txt`](version_history.txt) for full changelog (v1 → v6).

---

*BassFlow v6 · Built with Express + SQLite + Web Audio API · © MAD Developer Solutions UK*

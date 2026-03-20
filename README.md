# Bass Flow 🎵

> The one-stop platform for DJs and Drum & Bass music lovers.

## Overview

**Bass Flow** is a single-page web platform built for the Drum & Bass community — DJs, music fans, and event organisers alike. Everything you need is in one place:

| Feature | Description |
|---|---|
| 🎵 **Track Browsing** | Explore 50K+ DnB tracks filtered by sub-genre (Liquid, Neuro, Jump Up, Techstep, Jungle) |
| ▶ **In-browser Player** | Persistent player bar with play/pause, skip, progress scrubbing, and volume control |
| 🎧 **DJ Profiles** | Follow your favourite DJs and discover new talent |
| 📅 **Events** | Browse upcoming Drum & Bass events worldwide and grab tickets |
| 📼 **Mixes** | Full-length DJ sets available to stream |
| ⬆ **DJ Upload** | DJs can upload their own mixes directly to the platform |

## Running locally

No build step required — open `index.html` directly in any modern browser:

```bash
# Option 1 — just open the file
open index.html

# Option 2 — serve with any static server, e.g. Python
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Project structure

```
Bass-flow-/
├── index.html        # Single-page application entry point
├── css/
│   └── styles.css    # Dark DJ aesthetic with neon accents
├── js/
│   └── app.js        # Visualizer, player, data & interactive UI
└── README.md
```

## Tech stack

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid/flexbox, animations
- **Vanilla JavaScript** — no frameworks or build tools needed


/* =========================================================
   Bass Flow — app.js
   Interactive logic: visualizer, player, data, modals
   ========================================================= */

'use strict';

// ─── Sample data ──────────────────────────────────────────────────────────────

const TRACKS = [
  { id: 1,  title: 'Shadow Protocol',     artist: 'DarkStep Inc.',  genre: 'neuro',   bpm: 174, likes: 4812, artwork: '🟠', color: '#1a0a00' },
  { id: 2,  title: 'Liquid Sunrise',      artist: 'Oceanic Vibes',  genre: 'liquid',  bpm: 170, likes: 3204, artwork: '🔵', color: '#000d1a' },
  { id: 3,  title: 'Ragga Warfare',       artist: 'JungleKing',     genre: 'jungle',  bpm: 160, likes: 5109, artwork: '🟢', color: '#001a00' },
  { id: 4,  title: 'Neural Storm',        artist: 'Cortex Audio',   genre: 'neuro',   bpm: 176, likes: 6723, artwork: '🟣', color: '#0d001a' },
  { id: 5,  title: 'Bounce Factory',      artist: 'JumpCrew',       genre: 'jump-up', bpm: 172, likes: 8841, artwork: '🟡', color: '#1a1600' },
  { id: 6,  title: 'Cold Steel',          artist: 'TechMachine',    genre: 'techstep',bpm: 178, likes: 3310, artwork: '⚪', color: '#0d0d0d' },
  { id: 7,  title: 'Glass Rivers',        artist: 'Serene DnB',     genre: 'liquid',  bpm: 168, likes: 2897, artwork: '🔵', color: '#001526' },
  { id: 8,  title: 'Carnival Selector',   artist: 'JungleKing',     genre: 'jungle',  bpm: 162, likes: 4420, artwork: '🟤', color: '#1a0d00' },
  { id: 9,  title: 'Synaptic Overload',   artist: 'Cortex Audio',   genre: 'neuro',   bpm: 175, likes: 5508, artwork: '🟣', color: '#130017' },
  { id: 10, title: 'Bass Cannon Redux',   artist: 'HeavyWeight DnB',genre: 'jump-up', bpm: 174, likes: 9302, artwork: '🔴', color: '#1a0000' },
  { id: 11, title: 'Iron Meridian',       artist: 'TechMachine',    genre: 'techstep',bpm: 180, likes: 2716, artwork: '⚫', color: '#090909' },
  { id: 12, title: 'Velvet Underground',  artist: 'Oceanic Vibes',  genre: 'liquid',  bpm: 170, likes: 3987, artwork: '🔵', color: '#00101a' },
];

const DJS = [
  { id: 1,  name: 'DJ Pendulum',    location: 'London, UK',      genres: ['Neuro', 'Techstep'],  avatar: '🎧', followers: '42K', tracks: 89,  mixes: 34 },
  { id: 2,  name: 'Liquid Soul',    location: 'Berlin, DE',      genres: ['Liquid', 'DnB'],      avatar: '🎵', followers: '31K', tracks: 64,  mixes: 28 },
  { id: 3,  name: 'Jungle Empress', location: 'Bristol, UK',     genres: ['Jungle', 'Ragga'],    avatar: '🌴', followers: '27K', tracks: 112, mixes: 45 },
  { id: 4,  name: 'NeuroBrain',     location: 'Amsterdam, NL',   genres: ['Neurofunk'],          avatar: '🧠', followers: '18K', tracks: 55,  mixes: 21 },
  { id: 5,  name: 'Sub Zero',       location: 'Melbourne, AU',   genres: ['Techstep', 'Dark'],   avatar: '❄️', followers: '22K', tracks: 77,  mixes: 30 },
  { id: 6,  name: 'MC Bassline',    location: 'New York, US',    genres: ['Jump Up', 'Jungle'],  avatar: '🎤', followers: '35K', tracks: 93,  mixes: 38 },
  { id: 7,  name: 'Deep Current',   location: 'Toronto, CA',     genres: ['Liquid', 'Ambient'],  avatar: '🌊', followers: '14K', tracks: 41,  mixes: 17 },
  { id: 8,  name: 'Velocity Crew',  location: 'Tokyo, JP',       genres: ['Techstep', 'Neuro'],  avatar: '⚡', followers: '29K', tracks: 68,  mixes: 26 },
];

const EVENTS = [
  { day: '22', month: 'MAR', title: 'Bass Inferno — Spring Edition',  venue: 'Fabric, London UK',          tags: ['Neuro', 'Techstep', 'DnB'] },
  { day: '29', month: 'MAR', title: 'Jungle Fever Weekender',         venue: 'Printworks, London UK',       tags: ['Jungle', 'Ragga DnB'] },
  { day: '05', month: 'APR', title: 'Liquid Sessions Vol. 12',        venue: 'Tresor, Berlin DE',           tags: ['Liquid', 'Atmospheric'] },
  { day: '12', month: 'APR', title: 'Neural Frequency Festival',      venue: 'Melkweg, Amsterdam NL',       tags: ['Neuro', 'Sci-Fi DnB'] },
  { day: '19', month: 'APR', title: 'Jump Up Massive',                venue: 'Motion, Bristol UK',          tags: ['Jump Up', 'Party DnB'] },
  { day: '26', month: 'APR', title: 'Sub:Culture Open Air',           venue: 'Red Star Park, Melbourne AU', tags: ['All Genres', 'Outdoor'] },
];

const MIXES = [
  { title: 'Neuro Odyssey Vol. 7',       dj: 'DJ Pendulum',    duration: '1:02:14', plays: '48K', banner: '🧬', gradient: 'linear-gradient(135deg,#0d001a,#1a0033)' },
  { title: 'Liquid Daydream Mix',         dj: 'Liquid Soul',    duration: '58:42',   plays: '31K', banner: '🌊', gradient: 'linear-gradient(135deg,#001a2e,#002244)' },
  { title: 'Jungle Warrior Selector',     dj: 'Jungle Empress', duration: '1:15:08', plays: '62K', banner: '🌿', gradient: 'linear-gradient(135deg,#001a00,#003300)' },
  { title: 'TechStep Domination',         dj: 'Sub Zero',       duration: '1:08:55', plays: '27K', banner: '🤖', gradient: 'linear-gradient(135deg,#0a0a0a,#1a1a1a)' },
  { title: 'Jump Up Carnage',             dj: 'MC Bassline',    duration: '52:30',   plays: '73K', banner: '💥', gradient: 'linear-gradient(135deg,#1a0500,#330a00)' },
  { title: 'Tokyo Bass Connection',       dj: 'Velocity Crew',  duration: '1:10:20', plays: '19K', banner: '⚡', gradient: 'linear-gradient(135deg,#001133,#000d22)' },
];

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

// ─── State ────────────────────────────────────────────────────────────────────

let currentTrackId  = -1;   // ID of the currently selected track (from TRACKS[].id)
let currentPlaylist = TRACKS; // active track list (respects genre filter)
let isPlaying = false;
let progress = 0;
let progressTimer = null;
let selectedGenre = 'all';
let followedDJs = new Set();

// ─── Canvas Visualizer ────────────────────────────────────────────────────────

(function initVisualizer() {
  const canvas = $('visualizerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, bars;
  const BAR_COUNT = 80;
  const barData = Array.from({ length: BAR_COUNT }, () => ({
    h: Math.random() * 0.4 + 0.05,
    vel: (Math.random() - 0.5) * 0.008,
    target: Math.random() * 0.5,
  }));

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function tick() {
    ctx.clearRect(0, 0, W, H);
    const barW = W / BAR_COUNT;
    barData.forEach((b, i) => {
      b.h += (b.target - b.h) * 0.04 + b.vel;
      if (b.h < 0.02 || b.h > 0.9) b.vel *= -1;
      if (Math.random() < 0.015) b.target = Math.random() * (isPlaying ? 0.85 : 0.4) + 0.05;

      const x = i * barW;
      const barH = b.h * H;
      const y = H - barH;

      const grad = ctx.createLinearGradient(0, y, 0, H);
      grad.addColorStop(0, 'rgba(255,69,0,0.85)');
      grad.addColorStop(0.6, 'rgba(255,107,53,0.5)');
      grad.addColorStop(1, 'rgba(255,69,0,0.08)');

      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y, barW - 2, barH);
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ─── Render: Tracks ───────────────────────────────────────────────────────────

function renderTracks() {
  const grid = $('tracksGrid');
  if (!grid) return;
  const filtered = selectedGenre === 'all'
    ? TRACKS
    : TRACKS.filter((t) => t.genre === selectedGenre);

  // Keep the current playlist in sync with the active filter
  currentPlaylist = filtered;

  grid.innerHTML = '';
  filtered.forEach((track) => {
    const isActive = currentTrackId === track.id && isPlaying;
    const card = el('div', `track-card${isActive ? ' playing' : ''}`);
    card.innerHTML = `
      <div class="track-artwork" style="background:${track.color}">
        <span style="font-size:3.5rem">${track.artwork}</span>
        <div class="track-artwork-overlay">
          <div class="track-play-icon">${isActive ? '⏸' : '▶'}</div>
        </div>
      </div>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
        <div class="track-meta">
          <span class="track-genre">${track.genre}</span>
          <span class="track-likes">♥ ${track.likes.toLocaleString()}</span>
          <span class="track-bpm">${track.bpm} BPM</span>
        </div>
      </div>`;
    card.addEventListener('click', () => selectTrack(track.id));
    grid.appendChild(card);
  });
}

// ─── Render: DJs ──────────────────────────────────────────────────────────────

function renderDJs() {
  const grid = $('djGrid');
  if (!grid) return;
  DJS.forEach((dj) => {
    const card = el('div', 'dj-card');
    card.innerHTML = `
      <div class="dj-avatar" style="background:var(--bg-primary)">${dj.avatar}</div>
      <div class="dj-name">${dj.name}</div>
      <div class="dj-location">📍 ${dj.location}</div>
      <div class="dj-genres">
        ${dj.genres.map((g) => `<span class="dj-genre-tag">${g}</span>`).join('')}
      </div>
      <div class="dj-stats">
        <div class="dj-stat"><strong>${dj.followers}</strong>Followers</div>
        <div class="dj-stat"><strong>${dj.tracks}</strong>Tracks</div>
        <div class="dj-stat"><strong>${dj.mixes}</strong>Mixes</div>
      </div>
      <button class="dj-follow-btn" data-djid="${dj.id}">
        ${followedDJs.has(dj.id) ? '✓ Following' : '+ Follow'}
      </button>`;
    card.querySelector('.dj-follow-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFollow(dj.id, e.currentTarget);
    });
    grid.appendChild(card);
  });
}

function toggleFollow(djId, btn) {
  if (followedDJs.has(djId)) {
    followedDJs.delete(djId);
    btn.textContent = '+ Follow';
    btn.classList.remove('following');
  } else {
    followedDJs.add(djId);
    btn.textContent = '✓ Following';
    btn.classList.add('following');
  }
}

// ─── Render: Events ───────────────────────────────────────────────────────────

function renderEvents() {
  const list = $('eventsList');
  if (!list) return;
  EVENTS.forEach((evt) => {
    const card = el('div', 'event-card');
    card.innerHTML = `
      <div class="event-date">
        <div class="event-date-day">${evt.day}</div>
        <div class="event-date-mon">${evt.month}</div>
      </div>
      <div class="event-info">
        <h3>${evt.title}</h3>
        <div class="event-venue">📍 ${evt.venue}</div>
        <div class="event-tags">
          ${evt.tags.map((t) => `<span class="event-tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="event-action">
        <button class="btn btn-primary" style="font-size:0.82rem;padding:10px 20px">Get Tickets</button>
      </div>`;
    card.querySelector('.btn').addEventListener('click', () => showTicketModal(evt));
    list.appendChild(card);
  });
}

// ─── Render: Mixes ────────────────────────────────────────────────────────────

function renderMixes() {
  const grid = $('mixesGrid');
  if (!grid) return;
  MIXES.forEach((mix) => {
    const card = el('div', 'mix-card');
    card.innerHTML = `
      <div class="mix-banner" style="background:${mix.gradient}">
        <span>${mix.banner}</span>
        <span class="mix-duration-badge">${mix.duration}</span>
      </div>
      <div class="mix-info">
        <div class="mix-title">${mix.title}</div>
        <div class="mix-dj">by ${mix.dj}</div>
        <div class="mix-footer">
          <span class="mix-plays">▶ ${mix.plays} plays</span>
          <button class="mix-play-btn">▶ Play</button>
        </div>
      </div>`;
    card.querySelector('.mix-play-btn').addEventListener('click', () => {
      showToast(`🎵 Now streaming: ${mix.title}`);
    });
    grid.appendChild(card);
  });
}

// ─── Player ───────────────────────────────────────────────────────────────────

function selectTrack(trackId) {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return;
  currentTrackId = trackId;
  isPlaying = true;
  progress = 0;

  $('playerTitle').textContent  = track.title;
  $('playerArtist').textContent = track.artist;
  $('playerArtwork').textContent = track.artwork;
  $('playerArtwork').style.background = track.color;
  $('playBtn').innerHTML = '⏸';
  $('timeCurrent').textContent = '0:00';
  $('timeTotal').textContent = randomDuration();
  updateProgressBar();
  startProgressSim();
  renderTracks();
}

function startProgressSim() {
  clearInterval(progressTimer);
  const totalSec = 180 + Math.random() * 120;
  progressTimer = setInterval(() => {
    if (!isPlaying) return;
    progress = Math.min(progress + (100 / totalSec), 100);
    $('progressFill').style.width = progress + '%';
    const elapsed = Math.floor((progress / 100) * totalSec);
    $('timeCurrent').textContent = formatTime(elapsed);
    if (progress >= 100) {
      clearInterval(progressTimer);
      isPlaying = false;
      $('playBtn').innerHTML = '▶';
    }
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
function randomDuration() {
  const m = 3 + Math.floor(Math.random() * 4);
  const s = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${m}:${s}`;
}
function updateProgressBar() {
  $('progressFill').style.width = progress + '%';
}

$('playBtn').addEventListener('click', () => {
  if (currentTrackId === -1) {
    selectTrack(currentPlaylist[0].id);
    return;
  }
  isPlaying = !isPlaying;
  $('playBtn').innerHTML = isPlaying ? '⏸' : '▶';
  if (isPlaying) startProgressSim();
});

$('prevBtn').addEventListener('click', () => {
  const idx = currentPlaylist.findIndex((t) => t.id === currentTrackId);
  const prevIdx = Math.max(0, idx - 1);
  selectTrack(currentPlaylist[prevIdx].id);
});

$('nextBtn').addEventListener('click', () => {
  const idx = currentPlaylist.findIndex((t) => t.id === currentTrackId);
  const nextIdx = (idx + 1) % currentPlaylist.length;
  selectTrack(currentPlaylist[nextIdx].id);
});

$('progressBar').addEventListener('click', (e) => {
  const rect = $('progressBar').getBoundingClientRect();
  progress = ((e.clientX - rect.left) / rect.width) * 100;
  updateProgressBar();
});

// ─── Genre Tabs ───────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    selectedGenre = tab.dataset.genre;
    renderTracks();
  });
});

// ─── Navbar scroll effect & hamburger ─────────────────────────────────────────

window.addEventListener('scroll', () => {
  $('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

const hamburger = $('hamburger');
let mobileNav = null;
hamburger.addEventListener('click', () => {
  if (!mobileNav) {
    mobileNav = el('div', 'mobile-nav');
    mobileNav.innerHTML = `
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#tracks">Tracks</a></li>
        <li><a href="#djs">DJs</a></li>
        <li><a href="#events">Events</a></li>
        <li><a href="#mixes">Mixes</a></li>
      </ul>
      <button class="btn btn-primary nav-cta" id="mobileJoinBtn">Join the Movement</button>`;
    document.body.appendChild(mobileNav);
    mobileNav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
    mobileNav.querySelector('#mobileJoinBtn').addEventListener('click', () => {
      mobileNav.classList.remove('open');
      showJoinModal();
    });
  }
  mobileNav.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (mobileNav && mobileNav.classList.contains('open') &&
      !mobileNav.contains(e.target) && e.target !== hamburger) {
    mobileNav.classList.remove('open');
  }
});

// ─── Modals ───────────────────────────────────────────────────────────────────

function openModal(html) {
  $('modalBody').innerHTML = html;
  $('modalOverlay').classList.add('open');
}
function closeModal() {
  $('modalOverlay').classList.remove('open');
}

$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', (e) => {
  if (e.target === $('modalOverlay')) closeModal();
});

function showJoinModal() {
  openModal(`
    <h3>JOIN THE <span class="accent">MOVEMENT</span></h3>
    <p class="modal-sub">Create your free Bass Flow account and become part of the DnB community.</p>
    <div class="form-group"><label>Username</label><input type="text" placeholder="e.g. DJ YourName" /></div>
    <div class="form-group"><label>Email</label><input type="email" placeholder="you@example.com" /></div>
    <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••" /></div>
    <div class="form-group">
      <label>I am a…</label>
      <select>
        <option>Music Fan</option>
        <option>DJ / Producer</option>
        <option>Event Organiser</option>
        <option>Label / Agency</option>
      </select>
    </div>
    <button class="btn btn-primary" id="joinSubmitBtn">Create Account</button>`);
  $('joinSubmitBtn').addEventListener('click', () => {
    closeModal();
    showToast('🎉 Welcome to Bass Flow! Check your email to verify.');
  });
}

function showTicketModal(evt) {
  openModal(`
    <h3>GET <span class="accent">TICKETS</span></h3>
    <p class="modal-sub">${evt.title} — ${evt.venue}</p>
    <div class="form-group"><label>Ticket Type</label>
      <select><option>Early Bird — £15</option><option>Standard — £22</option><option>VIP — £40</option></select>
    </div>
    <div class="form-group"><label>Quantity</label>
      <select><option>1</option><option>2</option><option>3</option><option>4</option></select>
    </div>
    <div class="form-group"><label>Email</label><input type="email" placeholder="Confirmation sent here" /></div>
    <button class="btn btn-primary" id="ticketSubmitBtn">Proceed to Payment</button>`);
  $('ticketSubmitBtn').addEventListener('click', () => {
    closeModal();
    showToast(`🎟️ Tickets reserved for ${evt.title}!`);
  });
}

function showUploadModal() {
  openModal(`
    <h3>UPLOAD YOUR <span class="accent">MIX</span></h3>
    <p class="modal-sub">Share your Drum &amp; Bass set with the world.</p>
    <div class="form-group"><label>Mix Title</label><input type="text" placeholder="e.g. Liquid Sessions Vol. 1" /></div>
    <div class="form-group"><label>Genre</label>
      <select><option>Liquid DnB</option><option>Neuro</option><option>Jump Up</option><option>Techstep</option><option>Jungle</option><option>Other DnB</option></select>
    </div>
    <div class="form-group"><label>Description</label><textarea placeholder="Tell people what to expect…"></textarea></div>
    <div class="form-group"><label>Audio File (MP3/WAV)</label><input type="file" accept=".mp3,.wav" /></div>
    <button class="btn btn-primary" id="uploadSubmitBtn">Upload Mix</button>`);
  $('uploadSubmitBtn').addEventListener('click', () => {
    closeModal();
    showToast('🎵 Mix uploaded! It will appear on the platform shortly.');
  });
}

$('joinBtn').addEventListener('click', showJoinModal);
$('uploadBtn').addEventListener('click', showUploadModal);

// ─── Toast notifications ──────────────────────────────────────────────────────

function showToast(msg) {
  const toast = el('div', 'toast');
  toast.style.cssText = `
    position:fixed; bottom:${parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--player-h')) + 16}px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);
    padding:12px 24px; border-radius:50px; font-size:0.88rem; font-weight:600;
    z-index:3000; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation:fadeInUp 0.3s ease forwards;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── Init ────────────────────────────────────────────────────────────────────

renderTracks();
renderDJs();
renderEvents();
renderMixes();

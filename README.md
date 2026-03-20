# 🎛️ BassWave

Platforma społecznościowa dla Drum & Bass — upload, odkrywaj, komentuj.

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| State | Zustand (player + auth) |
| Data fetching | TanStack Query |
| Backend | Node.js + Express + TypeScript |
| Baza danych | PostgreSQL via Prisma ORM |
| Storage | Supabase Storage (audio + covers) |
| Auth | Supabase Auth + JWT |
| Hosting | Google Cloud Run |

---

## 🚀 Szybki start (lokalne dev)

### 1. Supabase (5 minut, bezpłatnie)

1. Wejdź na [supabase.com](https://supabase.com) → **New project**
2. Skopiuj z **Settings → Database → Connection string** → `DATABASE_URL` i `DIRECT_URL`
3. Skopiuj z **Settings → API** → `SUPABASE_URL` i `service_role` key
4. W **Storage** utwórz 2 buckety:
   - `tracks-audio` (Public: ✅)
   - `tracks-covers` (Public: ✅)

### 2. Konfiguracja środowiska

```bash
cp apps/api/.env.example apps/api/.env
# Uzupełnij DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

Wygeneruj JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Instalacja i migracja DB

```bash
npm install
npm run db:migrate        # tworzy tabele
npm run db:seed -w apps/api   # opcjonalnie – sample data
```

### 4. Uruchom

```bash
npm run dev               # API :3001 + Web :5173 równocześnie
# lub oddzielnie:
npm run dev:api
npm run dev:web
```

Otwórz: http://localhost:5173

---

## 🐳 Docker (lokalny pełny stack)

```bash
cp apps/api/.env.example .env   # uzupełnij zmienne Supabase
docker-compose up --build
```

Web: http://localhost:8080 | API: http://localhost:3001

---

## ☁️ Deploy na Google Cloud Run

```bash
chmod +x deploy.sh

# Eksportuj zmienne
export DATABASE_URL="..."
export DIRECT_URL="..."
export SUPABASE_URL="..."
export SUPABASE_SERVICE_KEY="..."
export JWT_SECRET="..."

# Deploy API + Web
./deploy.sh all

# Lub oddzielnie
./deploy.sh api
./deploy.sh web
```

Projekt GCP: `gen-lang-client-0354485869` | Region: `europe-west1`

---

## 📁 Struktura projektu

```
basswave/
├── apps/
│   ├── api/                    Node.js + Express API
│   │   ├── prisma/schema.prisma   Modele DB
│   │   └── src/
│   │       ├── routes/            auth / tracks / users / uploads
│   │       ├── middleware/        JWT auth + error handler
│   │       └── lib/               Prisma + Supabase klienty
│   └── web/                    React + Vite frontend
│       └── src/
│           ├── components/        PlayerBar, TrackCard, WaveformCanvas
│           ├── pages/             Home, Discover, Track, Artist, Upload, Auth
│           ├── hooks/             useAudioPlayer (Web Audio API)
│           └── lib/               api.ts, playerStore, authStore
├── docker-compose.yml
├── deploy.sh                   Cloud Run deploy script
└── package.json                Monorepo root
```

---

## 🔌 API Endpoints

```
POST /api/auth/register         Rejestracja
POST /api/auth/login            Logowanie

GET  /api/tracks                Lista (filtr: genre, country, q)
GET  /api/tracks/:id            Szczegóły tracku
POST /api/tracks                Utwórz track [auth]
DELETE /api/tracks/:id          Usuń [auth + owner]
POST /api/tracks/:id/like       Toggle lajk [auth]
POST /api/tracks/:id/comments   Dodaj komentarz [auth]

GET  /api/users/:username       Profil artysty
GET  /api/users/me/profile      Mój profil [auth]
POST /api/users/:id/follow      Toggle follow [auth]

POST /api/uploads/audio         Upload MP3/WAV → Supabase [auth]
POST /api/uploads/cover         Upload JPG/PNG → Supabase [auth]
```

---

## 🎯 Następne kroki

- [ ] Real-time komentarze (Supabase Realtime)
- [ ] BPM detection w przeglądarce (essentia.js-wasm)
- [ ] Strona labelu
- [ ] System powiadomień
- [ ] Panel analityki dla artystów
- [ ] Mobile app (React Native)
- [ ] Domena basswave.io 👀

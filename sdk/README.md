# BassFlow SDK

Official JavaScript/TypeScript client library for the **BassFlow Drum & Bass Platform API**.  
Works in **Node.js**, **browsers** (via `<script>` tag), and **bundlers** (Webpack, Vite, etc.).

---

## Installation

```bash
# From npm (once published)
npm install bassflow-sdk

# Or copy bassflow-sdk.js directly into your project
```

---

## Quick Start

### Browser (script tag)
```html
<script src="bassflow-sdk.js"></script>
<script>
  const bf = new BassFlowSDK({ baseURL: 'https://your-api.run.app' });

  // Register
  bf.auth.register({ username: 'DJ_MADUKI', email: 'dj@example.com', password: 'secret', genre: 'Neurofunk' })
    .then(({ token, user }) => {
      console.log('Registered!', user.username);
      return bf.tracks.list({ genre: 'Neurofunk', sort: 'likes', limit: 10 });
    })
    .then(({ tracks }) => console.log(tracks));
</script>
```

### Node.js (CommonJS)
```js
const { BassFlowSDK } = require('./bassflow-sdk');

const bf = new BassFlowSDK({ baseURL: 'http://localhost:3001' });

async function main() {
  const { token, user } = await bf.auth.login({ email: 'dj@example.com', password: 'secret' });
  console.log(`Signed in as ${user.username} (${user.xp} XP)`);

  const { tracks } = await bf.tracks.list({ sort: 'plays', limit: 5 });
  tracks.forEach(t => console.log(`${t.title} — ${t.plays} plays`));
}

main().catch(console.error);
```

---

## API Reference

### `new BassFlowSDK(options?)`

| Option     | Type     | Default                  | Description                  |
|------------|----------|--------------------------|------------------------------|
| `baseURL`  | `string` | `http://localhost:3001`  | API server URL               |
| `token`    | `string` | –                        | Initial JWT (optional)       |
| `timeout`  | `number` | `15000`                  | Request timeout (ms)         |

---

### `bf.auth`

| Method                                    | Returns           | Auth |
|-------------------------------------------|-------------------|------|
| `register({ username, email, password, genre? })` | `{ token, user }` | –    |
| `login({ email, password })`              | `{ token, user }` | –    |
| `me()`                                    | `User`            | ✅   |
| `logout()`                                | `void`            | –    |

---

### `bf.tracks`

| Method                            | Returns              | Auth |
|-----------------------------------|----------------------|------|
| `list({ genre?, q?, sort?, limit?, offset? })` | `{ tracks, total }` | –   |
| `get(id)`                         | `Track`              | –    |
| `create(track)`                   | `Track`              | ✅   |
| `update(id, fields)`              | `Track`              | ✅   |
| `delete(id)`                      | `{ success }`        | ✅   |
| `like(id)`                        | `{ liked, likes }`   | ✅   |
| `comments(id)`                    | `Comment[]`          | –    |
| `comment(id, body)`               | `Comment`            | ✅   |
| `play(id)`                        | `{ plays }`          | –    |

---

### `bf.users`

| Method              | Returns              | Auth |
|---------------------|----------------------|------|
| `list({ limit?, offset?, sort? })` | `{ users, total }` | –  |
| `get(id)`           | `User`               | –    |
| `follow(id)`        | `{ following }`      | ✅   |
| `update(fields)`    | `User`               | ✅   |

---

### `bf.events`

| Method                  | Returns               | Auth |
|-------------------------|-----------------------|------|
| `list({ limit?, upcoming? })` | `{ events, total }` | – |
| `get(id)`               | `Event`               | –    |
| `create(event)`         | `Event`               | ✅   |
| `update(id, fields)`    | `Event`               | ✅   |
| `delete(id)`            | `{ success }`         | ✅   |

---

### `bf.mixes`

| Method                  | Returns              | Auth |
|-------------------------|----------------------|------|
| `list({ genre?, limit? })` | `{ mixes, total }` | –  |
| `get(id)`               | `Mix`                | –    |
| `create(mix)`           | `Mix`                | ✅   |
| `update(id, fields)`    | `Mix`                | ✅   |
| `delete(id)`            | `{ success }`        | ✅   |

---

### Utility methods

```js
bf.ping()           // → Promise<boolean>  (true if API is reachable)
bf.setToken(token)  // manually set JWT
bf.clearToken()     // sign out
```

---

## Error Handling

All methods throw `BassFlowError` on failure:

```js
try {
  await bf.auth.login({ email: 'x', password: 'y' });
} catch (err) {
  if (err.name === 'BassFlowError') {
    console.log(err.message);  // human-readable message
    console.log(err.code);     // 'API_ERROR' | 'NETWORK' | 'TIMEOUT' | 'VALIDATION'
    console.log(err.status);   // HTTP status code (401, 404, etc.)
  }
}
```

---

## TypeScript

Full TypeScript definitions are included in `types.d.ts`:

```ts
import { BassFlowSDK, Track, User, BassFlowError } from 'bassflow-sdk';

const bf = new BassFlowSDK({ baseURL: 'http://localhost:3001' });
const { tracks }: { tracks: Track[] } = await bf.tracks.list();
```

---

*BassFlow SDK v1.0.0 · MIT License · © MAD Developer Solutions UK*

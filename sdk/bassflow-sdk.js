/**
 * BassFlow SDK v1.0.0
 * Official JavaScript/Node.js client for the BassFlow API
 * Works in browser (ESM/UMD) and Node.js (CJS)
 *
 * Usage (browser):
 *   <script src="bassflow-sdk.js"></script>
 *   const bf = new BassFlowSDK({ baseURL: 'https://your-api.run.app' });
 *
 * Usage (Node/ESM):
 *   const { BassFlowSDK } = require('bassflow-sdk');
 *   const bf = new BassFlowSDK({ baseURL: 'http://localhost:3001' });
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = { BassFlowSDK: factory() };          // CJS
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);                                   // AMD
  } else {
    root.BassFlowSDK = factory();                          // global browser
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  'use strict';

  /* ─────────────────────────────────────────────
     BassFlowSDK  — main class
  ───────────────────────────────────────────── */
  class BassFlowSDK {
    /**
     * @param {object} options
     * @param {string} [options.baseURL]   API base URL (default: http://localhost:3001)
     * @param {string} [options.token]     Initial JWT token (optional)
     * @param {number} [options.timeout]   Request timeout ms (default: 15000)
     */
    constructor(options = {}) {
      this.baseURL  = (options.baseURL || 'http://localhost:3001').replace(/\/$/, '');
      this.token    = options.token || null;
      this.timeout  = options.timeout || 15000;
      this.version  = '1.0.0';

      // Sub-modules
      this.auth     = new AuthModule(this);
      this.tracks   = new TracksModule(this);
      this.users    = new UsersModule(this);
      this.events   = new EventsModule(this);
      this.mixes    = new MixesModule(this);
    }

    /** @internal low-level fetch wrapper */
    async _request(method, path, { body, params, auth = false } = {}) {
      const url = new URL(this.baseURL + path);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) url.searchParams.set(k, v);
        });
      }

      const headers = { 'Content-Type': 'application/json' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), this.timeout);

      let response;
      try {
        response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(tid);
        if (err.name === 'AbortError') throw new BassFlowError('Request timed out', 'TIMEOUT');
        throw new BassFlowError('Network error — is the API server running?', 'NETWORK');
      }
      clearTimeout(tid);

      let data;
      const ct = response.headers.get('content-type') || '';
      try {
        data = ct.includes('json') ? await response.json() : { message: await response.text() };
      } catch (_) {
        data = {};
      }

      if (!response.ok) {
        throw new BassFlowError(
          data.error || data.message || `HTTP ${response.status}`,
          'API_ERROR',
          response.status,
          data
        );
      }
      return data;
    }

    get(path, opts)    { return this._request('GET',    path, opts); }
    post(path, opts)   { return this._request('POST',   path, opts); }
    patch(path, opts)  { return this._request('PATCH',  path, opts); }
    delete(path, opts) { return this._request('DELETE', path, opts); }

    /** Set JWT token (e.g. after login) */
    setToken(token) { this.token = token; return this; }

    /** Clear stored token (logout) */
    clearToken() { this.token = null; return this; }

    /** Quick health check — returns true if API is reachable */
    async ping() {
      try {
        await this.get('/api/health');
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  /* ─────────────────────────────────────────────
     AuthModule
  ───────────────────────────────────────────── */
  class AuthModule {
    constructor(sdk) { this._sdk = sdk; }

    /**
     * Register a new account
     * @param {{ username, email, password, genre? }} opts
     * @returns {{ token, user }}
     */
    async register({ username, email, password, genre } = {}) {
      if (!username || !email || !password) throw new BassFlowError('username, email, password required', 'VALIDATION');
      const data = await this._sdk.post('/api/auth/register', { body: { username, email, password, genre } });
      this._sdk.setToken(data.token);
      return data;
    }

    /**
     * Sign in with email + password
     * @param {{ email, password }} opts
     * @returns {{ token, user }}
     */
    async login({ email, password } = {}) {
      if (!email || !password) throw new BassFlowError('email and password required', 'VALIDATION');
      const data = await this._sdk.post('/api/auth/login', { body: { email, password } });
      this._sdk.setToken(data.token);
      return data;
    }

    /**
     * Get the currently authenticated user
     * @returns {User}
     */
    me() {
      return this._sdk.get('/api/auth/me');
    }

    /** Sign out (clears local token) */
    logout() {
      this._sdk.clearToken();
    }
  }

  /* ─────────────────────────────────────────────
     TracksModule
  ───────────────────────────────────────────── */
  class TracksModule {
    constructor(sdk) { this._sdk = sdk; }

    /**
     * List tracks
     * @param {{ genre?, q?, sort?, limit?, offset? }} opts
     */
    list(opts = {}) {
      return this._sdk.get('/api/tracks', { params: opts });
    }

    /**
     * Get a single track by ID
     * @param {string|number} id
     */
    get(id) {
      return this._sdk.get(`/api/tracks/${id}`);
    }

    /**
     * Create a new track
     * @param {{ title, genre, bpm?, key?, duration_sec?, audio_url?, cover_url?, tags? }} track
     */
    create(track) {
      return this._sdk.post('/api/tracks', { body: track });
    }

    /**
     * Update a track
     * @param {string|number} id
     * @param {object} fields
     */
    update(id, fields) {
      return this._sdk.patch(`/api/tracks/${id}`, { body: fields });
    }

    /**
     * Delete a track
     * @param {string|number} id
     */
    delete(id) {
      return this._sdk.delete(`/api/tracks/${id}`);
    }

    /**
     * Toggle like on a track
     * @param {string|number} id
     */
    like(id) {
      return this._sdk.post(`/api/tracks/${id}/like`);
    }

    /**
     * Get comments on a track
     * @param {string|number} id
     */
    comments(id) {
      return this._sdk.get(`/api/tracks/${id}/comments`);
    }

    /**
     * Post a comment on a track
     * @param {string|number} id
     * @param {string} body
     */
    comment(id, body) {
      return this._sdk.post(`/api/tracks/${id}/comments`, { body: { body } });
    }

    /**
     * Increment play count
     * @param {string|number} id
     */
    play(id) {
      return this._sdk.post(`/api/tracks/${id}/play`);
    }
  }

  /* ─────────────────────────────────────────────
     UsersModule
  ───────────────────────────────────────────── */
  class UsersModule {
    constructor(sdk) { this._sdk = sdk; }

    /**
     * List users / leaderboard
     * @param {{ limit?, offset?, sort? }} opts
     */
    list(opts = {}) {
      return this._sdk.get('/api/users', { params: opts });
    }

    /**
     * Get user profile by ID
     * @param {string|number} id
     */
    get(id) {
      return this._sdk.get(`/api/users/${id}`);
    }

    /**
     * Toggle follow/unfollow a user
     * @param {string|number} id
     */
    follow(id) {
      return this._sdk.post(`/api/users/${id}/follow`);
    }

    /**
     * Update current user's profile
     * @param {object} fields
     */
    update(fields) {
      return this._sdk.patch('/api/users/me', { body: fields });
    }
  }

  /* ─────────────────────────────────────────────
     EventsModule
  ───────────────────────────────────────────── */
  class EventsModule {
    constructor(sdk) { this._sdk = sdk; }

    /**
     * List events
     * @param {{ limit?, offset?, upcoming? }} opts
     */
    list(opts = {}) {
      return this._sdk.get('/api/events', { params: opts });
    }

    /** @param {string|number} id */
    get(id) {
      return this._sdk.get(`/api/events/${id}`);
    }

    /** @param {object} event */
    create(event) {
      return this._sdk.post('/api/events', { body: event });
    }

    /** @param {string|number} id @param {object} fields */
    update(id, fields) {
      return this._sdk.patch(`/api/events/${id}`, { body: fields });
    }

    /** @param {string|number} id */
    delete(id) {
      return this._sdk.delete(`/api/events/${id}`);
    }
  }

  /* ─────────────────────────────────────────────
     MixesModule
  ───────────────────────────────────────────── */
  class MixesModule {
    constructor(sdk) { this._sdk = sdk; }

    /** @param {{ genre?, limit?, offset? }} opts */
    list(opts = {}) {
      return this._sdk.get('/api/mixes', { params: opts });
    }

    /** @param {string|number} id */
    get(id) {
      return this._sdk.get(`/api/mixes/${id}`);
    }

    /** @param {object} mix */
    create(mix) {
      return this._sdk.post('/api/mixes', { body: mix });
    }

    /** @param {string|number} id @param {object} fields */
    update(id, fields) {
      return this._sdk.patch(`/api/mixes/${id}`, { body: fields });
    }

    /** @param {string|number} id */
    delete(id) {
      return this._sdk.delete(`/api/mixes/${id}`);
    }
  }

  /* ─────────────────────────────────────────────
     BassFlowError
  ───────────────────────────────────────────── */
  class BassFlowError extends Error {
    /**
     * @param {string} message
     * @param {string} code
     * @param {number} [status]
     * @param {object} [data]
     */
    constructor(message, code = 'UNKNOWN', status = 0, data = {}) {
      super(message);
      this.name   = 'BassFlowError';
      this.code   = code;
      this.status = status;
      this.data   = data;
    }
  }

  return BassFlowSDK;
});

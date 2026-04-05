# ─────────────────────────────────────────────
# BassFlow API — Production Docker Image
# Node 20 LTS, Alpine base
# ─────────────────────────────────────────────
FROM node:20-alpine

# Security: run as non-root
RUN addgroup -S bassflow && adduser -S bassflow -G bassflow

WORKDIR /app

# Install deps first (layer-cache friendly)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY --chown=bassflow:bassflow . .

# SQLite data directory persisted via volume mount
RUN mkdir -p /app/data && chown bassflow:bassflow /app/data

USER bassflow
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]

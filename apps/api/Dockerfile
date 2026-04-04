# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./apps/api/
COPY package*.json ./

# Install all deps (including dev — needed for tsc)
RUN npm install --workspace=apps/api

# Copy source
COPY apps/api ./apps/api

# Generate Prisma client and build TypeScript
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy only production deps
COPY apps/api/package*.json ./
RUN npm install --omit=dev

# Copy compiled output and Prisma client
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./node_modules/@prisma
COPY apps/api/prisma ./prisma

EXPOSE 3001

# Run DB migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

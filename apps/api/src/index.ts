import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter }   from './routes/auth';
import { usersRouter }  from './routes/users';
import { tracksRouter } from './routes/tracks';
import { setsRouter }   from './routes/sets';
import { errorHandler } from './middleware/error';
import { prisma }       from './lib/prisma';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Security / parsing ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: [
      process.env.WEB_URL ?? 'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/auth',   authRouter);
app.use('/users',  usersRouter);
app.use('/tracks', tracksRouter);
app.use('/sets',   setsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await prisma.$connect();
  console.log('✅ Database connected');

  app.listen(PORT, () => {
    console.log(`🎛️  BassFlow API running on http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

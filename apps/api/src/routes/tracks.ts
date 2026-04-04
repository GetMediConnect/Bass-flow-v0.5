import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabase, BUCKET_AUDIO } from '../lib/supabase';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { createError } from '../middleware/error';
import { uploadLimiter } from '../middleware/rateLimiter';
import { Genre } from '@prisma/client';

export const tracksRouter = Router();

// ─── Multer (memory storage — files forwarded directly to Supabase) ────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      // multer 2.x: pass an Error to reject with a message
      cb(Object.assign(new Error('Only audio files are accepted'), { code: 'INVALID_FILE_TYPE' }));
    }
  },
});

// ─── Camelot wheel mapping ─────────────────────────────────────────────────────
const CAMELOT: Record<string, string> = {
  'C major': '8B',  'G major': '9B',  'D major': '10B', 'A major': '11B',
  'E major': '12B', 'B major': '1B',  'F# major': '2B', 'Db major': '3B',
  'Ab major': '4B', 'Eb major': '5B', 'Bb major': '6B', 'F major': '7B',
  'A minor': '8A',  'E minor': '9A',  'B minor': '10A', 'F# minor': '11A',
  'C# minor': '12A','G# minor': '1A', 'Eb minor': '2A', 'Bb minor': '3A',
  'F minor': '4A',  'C minor': '5A',  'G minor': '6A',  'D minor': '7A',
};
const KEYS = Object.keys(CAMELOT);

/** Deterministic BPM estimation from audio ArrayBuffer (PCM zero-crossing rate heuristic).
 *
 * TODO: Replace this stub with a proper BPM detection library such as:
 *   - essentia.js  (https://essentia.upf.edu/essentia_js)
 *   - aubio        (via Python microservice)
 *   - librosa      (via Python microservice)
 * The current implementation is intentionally simple — it produces a
 * plausible DnB BPM (160–185) that is consistent for the same file
 * but is NOT a real BPM analyser.
 */
function estimateBPM(buffer: Buffer): number {
  // Sample every 1024 bytes as signed 16-bit PCM to count sign changes
  let crossings = 0;
  let prevSign = 0;
  const step = 2; // 16-bit samples
  for (let i = 0; i < Math.min(buffer.length - step, 1_000_000); i += step) {
    const sample = buffer.readInt16LE(i);
    const sign = sample >= 0 ? 1 : -1;
    if (prevSign !== 0 && sign !== prevSign) crossings++;
    prevSign = sign;
  }
  // Map crossing rate to plausible DnB BPM (170-180 range)
  const normalised = (crossings % 20) + 165;
  return Math.max(160, Math.min(185, normalised));
}

function pickKey(bpm: number): { musicalKey: string; camelot: string } {
  // Deterministic choice based on BPM — consistent for the same file
  const idx = bpm % KEYS.length;
  const musicalKey = KEYS[idx];
  return { musicalKey, camelot: CAMELOT[musicalKey] };
}

// ─── POST /tracks — upload audio ──────────────────────────────────────────────

const CreateTrackSchema = z.object({
  title:  z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  genre:  z.nativeEnum(Genre).optional().default(Genre.OTHER),
});

tracksRouter.post(
  '/',
  requireAuth,
  uploadLimiter,
  upload.single('audio'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw createError('No audio file provided', 400);

      const body = CreateTrackSchema.parse(req.body);

      // Upload to Supabase Storage
      const ext  = req.file.originalname.split('.').pop() ?? 'mp3';
      const path = `${req.user!.userId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_AUDIO)
        .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

      if (uploadErr) throw createError(`Storage upload failed: ${uploadErr.message}`, 502);

      const { data: publicData } = supabase.storage.from(BUCKET_AUDIO).getPublicUrl(path);
      const audioUrl = publicData.publicUrl;

      // Estimate BPM and key
      const bpm = estimateBPM(req.file.buffer);
      const { musicalKey, camelot } = pickKey(bpm);

      const track = await prisma.track.create({
        data: {
          title:      body.title,
          artist:     body.artist,
          genre:      body.genre,
          bpm,
          musicalKey,
          camelot,
          audioUrl,
          userId:     req.user!.userId,
        },
      });

      // Award XP for upload
      await prisma.user.update({
        where: { id: req.user!.userId },
        data:  { xp: { increment: 20 } },
      });

      res.status(201).json(track);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /tracks/:id/analyse — (re-)analyse BPM/key ─────────────────────────

tracksRouter.post(
  '/:id/analyse',
  requireAuth,
  upload.single('audio'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const track = await prisma.track.findUnique({ where: { id: req.params.id } });
      if (!track) throw createError('Track not found', 404);
      if (track.userId !== req.user!.userId) throw createError('Forbidden', 403);

      // If a new file was uploaded use it, otherwise re-analyse existing metadata
      let bpm: number;
      let musicalKey: string;
      let camelot: string;

      if (req.file) {
        bpm = estimateBPM(req.file.buffer);
        ({ musicalKey, camelot } = pickKey(bpm));
      } else {
        // Re-run on existing (stub — return existing or randomise slightly)
        bpm = track.bpm ?? estimateBPM(Buffer.alloc(0));
        ({ musicalKey, camelot } = pickKey(bpm));
      }

      const genre =
        bpm >= 175 ? Genre.NEURO
        : bpm >= 165 ? Genre.TECHSTEP
        : bpm >= 160 ? Genre.LIQUID
        : Genre.OTHER;

      const updated = await prisma.track.update({
        where: { id: track.id },
        data: { bpm, musicalKey, camelot, genre },
      });

      // Award XP
      await prisma.user.update({
        where: { id: req.user!.userId },
        data:  { xp: { increment: 15 } },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /tracks — list user's tracks (+ public) ──────────────────────────────

tracksRouter.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

      const where = req.user
        ? { userId: req.user.userId }
        : {}; // public: all tracks

      const [tracks, total] = await Promise.all([
        prisma.track.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: { select: { username: true, avatarUrl: true } },
            _count: { select: { likes: true } },
          },
        }),
        prisma.track.count({ where }),
      ]);

      res.json({ tracks, total, page, limit });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /tracks/:id ──────────────────────────────────────────────────────────

tracksRouter.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const track = await prisma.track.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true } },
        },
      });
      if (!track) throw createError('Track not found', 404);
      res.json(track);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /tracks/:id/like — toggle like ──────────────────────────────────────

tracksRouter.post(
  '/:id/like',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const track = await prisma.track.findUnique({ where: { id: req.params.id } });
      if (!track) throw createError('Track not found', 404);

      const existing = await prisma.like.findUnique({
        where: { userId_trackId: { userId: req.user!.userId, trackId: track.id } },
      });

      if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
        res.json({ liked: false });
      } else {
        await prisma.like.create({ data: { userId: req.user!.userId, trackId: track.id } });
        res.json({ liked: true });
      }
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /tracks/:id ───────────────────────────────────────────────────────

tracksRouter.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const track = await prisma.track.findUnique({ where: { id: req.params.id } });
      if (!track) throw createError('Track not found', 404);
      if (track.userId !== req.user!.userId) throw createError('Forbidden', 403);

      await prisma.track.delete({ where: { id: track.id } });

      // Best-effort: remove from Supabase Storage
      // Extract the object path from the public URL:
      //   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
      try {
        const parsed = new URL(track.audioUrl);
        const marker = `/object/public/${BUCKET_AUDIO}/`;
        const idx    = parsed.pathname.indexOf(marker);
        if (idx !== -1) {
          const storagePath = parsed.pathname.slice(idx + marker.length);
          await supabase.storage.from(BUCKET_AUDIO).remove([storagePath]);
        }
      } catch {
        // non-fatal — file will be cleaned up by storage lifecycle policy
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/error';

export const setsRouter = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SetTrackSchema = z.object({
  title:  z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  bpm:    z.number().int().min(100).max(300),
  key:    z.string().min(1).max(10), // Camelot key e.g. "8A"
  energy: z.number().int().min(1).max(10),
});

const UpsertSetSchema = z.object({
  name:   z.string().min(1).max(100),
  tracks: z.array(SetTrackSchema).min(1).max(50),
});

// ─── GET /sets — list user's sets ────────────────────────────────────────────

setsRouter.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sets = await prisma.dJSet.findMany({
        where:   { userId: req.user!.userId },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(sets);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /sets/:id ────────────────────────────────────────────────────────────

setsRouter.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const set = await prisma.dJSet.findUnique({ where: { id: req.params.id } });
      if (!set) throw createError('Set not found', 404);
      if (set.userId !== req.user!.userId) throw createError('Forbidden', 403);
      res.json(set);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /sets — create set ─────────────────────────────────────────────────

setsRouter.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = UpsertSetSchema.parse(req.body);

      const set = await prisma.dJSet.create({
        data: {
          name:   body.name,
          tracks: body.tracks,
          userId: req.user!.userId,
        },
      });

      await prisma.user.update({
        where: { id: req.user!.userId },
        data:  { xp: { increment: 25 } },
      });

      res.status(201).json(set);
    } catch (err) {
      next(err);
    }
  },
);

// ─── PUT /sets/:id — update set ──────────────────────────────────────────────

setsRouter.put(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.dJSet.findUnique({ where: { id: req.params.id } });
      if (!existing) throw createError('Set not found', 404);
      if (existing.userId !== req.user!.userId) throw createError('Forbidden', 403);

      const body = UpsertSetSchema.parse(req.body);

      const set = await prisma.dJSet.update({
        where: { id: req.params.id },
        data:  { name: body.name, tracks: body.tracks },
      });

      res.json(set);
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /sets/:id ─────────────────────────────────────────────────────────

setsRouter.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.dJSet.findUnique({ where: { id: req.params.id } });
      if (!existing) throw createError('Set not found', 404);
      if (existing.userId !== req.user!.userId) throw createError('Forbidden', 403);

      await prisma.dJSet.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

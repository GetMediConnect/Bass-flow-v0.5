import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/error';

export const usersRouter = Router();

// ─── GET /users/me — current user profile ─────────────────────────────────────

usersRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          username: true,
          email: true,
          xp: true,
          role: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { tracks: true, djSets: true, likes: true } },
        },
      });
      if (!user) throw createError('User not found', 404);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /users/me/xp — add XP ──────────────────────────────────────────────

const XpSchema = z.object({ amount: z.number().int().min(1).max(1000) });

usersRouter.patch(
  '/me/xp',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = XpSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { xp: { increment: amount } },
        select: { id: true, xp: true },
      });

      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /users/me — update bio / avatar ────────────────────────────────────

const ProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
});

usersRouter.patch(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = ProfileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          xp: true,
          role: true,
          bio: true,
          avatarUrl: true,
        },
      });

      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /users/leaderboard — top 20 by XP ────────────────────────────────────

usersRouter.get(
  '/leaderboard',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        take: 20,
        orderBy: { xp: 'desc' },
        select: {
          id: true,
          username: true,
          xp: true,
          role: true,
          bio: true,
          avatarUrl: true,
          _count: { select: { tracks: true } },
        },
      });

      res.json(users);
    } catch (err) {
      next(err);
    }
  },
);

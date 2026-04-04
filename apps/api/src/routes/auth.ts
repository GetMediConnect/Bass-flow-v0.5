import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../middleware/auth';
import { createError } from '../middleware/error';

export const authRouter = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /auth/register ──────────────────────────────────────────────────────

authRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = RegisterSchema.parse(req.body);

      // Check uniqueness
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: body.email }, { username: body.username }],
        },
      });
      if (existing) {
        throw createError(
          existing.email === body.email
            ? 'Email already in use'
            : 'Username already taken',
          409,
        );
      }

      const passwordHash = await bcrypt.hash(body.password, 12);

      const user = await prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash,
        },
        select: {
          id: true,
          username: true,
          email: true,
          xp: true,
          role: true,
          createdAt: true,
        },
      });

      const token = signToken({ userId: user.id, username: user.username, role: user.role });

      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/login ─────────────────────────────────────────────────────────

authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = LoginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
        select: {
          id: true,
          username: true,
          email: true,
          passwordHash: true,
          xp: true,
          role: true,
        },
      });

      if (!user) {
        throw createError('Invalid email or password', 401);
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        throw createError('Invalid email or password', 401);
      }

      const { passwordHash: _, ...safeUser } = user;
      const token = signToken({ userId: user.id, username: user.username, role: user.role });

      res.json({ token, user: safeUser });
    } catch (err) {
      next(err);
    }
  },
);

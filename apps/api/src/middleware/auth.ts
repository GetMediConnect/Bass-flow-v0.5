import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

// Extend Express Request to carry decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env variable is not set');
  return s;
};

/**
 * requireAuth — middleware that validates the Bearer JWT.
 * Attaches `req.user` on success, returns 401 on failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, secret()) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * optionalAuth — like requireAuth but does not reject if no token present.
 * Useful for public endpoints that behave differently when logged in.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), secret()) as JwtPayload;
      req.user = payload;
    } catch {
      // ignore invalid tokens on optional routes
    }
  }
  next();
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as string,
  });
}

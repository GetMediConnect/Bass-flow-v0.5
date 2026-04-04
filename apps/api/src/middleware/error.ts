import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Known operational errors with a statusCode
  if (isOperationalError(err)) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Unknown / unexpected errors
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}

interface OperationalError extends Error {
  statusCode: number;
}

function isOperationalError(err: unknown): err is OperationalError {
  return (
    err instanceof Error &&
    'statusCode' in err &&
    typeof (err as OperationalError).statusCode === 'number'
  );
}

export function createError(message: string, statusCode: number): OperationalError {
  const err = new Error(message) as OperationalError;
  err.statusCode = statusCode;
  return err;
}

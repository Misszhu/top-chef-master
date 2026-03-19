import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/api-response';

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _next = next;

  if (err instanceof ApiError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  console.error('Unhandled error:', err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal Server Error');
}


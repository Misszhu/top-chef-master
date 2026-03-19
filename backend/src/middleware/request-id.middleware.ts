import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const existing = req.headers['x-request-id'];
  res.locals.requestId =
    (typeof existing === 'string' && existing.trim()) || `req_${crypto.randomUUID().replace(/-/g, '')}`;
  res.setHeader('x-request-id', res.locals.requestId);
  next();
}


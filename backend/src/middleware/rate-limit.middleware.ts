import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { sendError } from '../utils/api-response';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** POST /auth/login：防暴力尝试 */
export const loginRateLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX, 30),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    return sendError(res, 429, 'RATE_LIMIT', '登录尝试过于频繁，请稍后再试');
  },
});

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * 对 /api/v1 下写方法限流（挂载在 `/api/v1` 上时 `req.path` 为剩余路径）。
 * 跳过 GET/OPTIONS；跳过 POST /auth/login（由 loginRateLimiter 单独限制）。
 */
export const apiWriteRateLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_WRITE_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_WRITE_MAX, 300),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (!WRITE_METHODS.has(req.method)) return true;
    const p = req.path || '';
    if (req.method === 'POST' && p === '/auth/login') return true;
    return false;
  },
  handler: (_req: Request, res: Response) => {
    return sendError(res, 429, 'RATE_LIMIT', '操作过于频繁，请稍后再试');
  },
});

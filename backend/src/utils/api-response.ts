import type { Response } from 'express';

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'FORBIDDEN'
  | 'ACCOUNT_BANNED'
  | 'VISIBILITY_DENIED'
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'DUPLICATE_COMMENT'
  | 'DUPLICATE_LIKE'
  | 'COMMENTS_DISABLED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export function sendSuccess<T>(res: Response, data: T, extraMeta?: Record<string, unknown>) {
  return res.json({
    data,
    meta: {
      requestId: res.locals.requestId,
      ts: Date.now(),
      ...extraMeta,
    },
  });
}

export function sendPagination<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  extraMeta?: Record<string, unknown>
) {
  return res.json({
    data,
    pagination,
    meta: {
      requestId: res.locals.requestId,
      ts: Date.now(),
      ...extraMeta,
    },
  });
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
) {
  return res.status(status).json({
    error: {
      code,
      message,
      details: details || {},
      requestId: res.locals.requestId,
    },
  });
}


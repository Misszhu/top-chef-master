import type { Response } from 'express';
import type { ApiMeta, ApiSuccessEnvelope, ApiErrorEnvelope } from '../types/api-envelope';

export type { ApiMeta, ApiSuccessEnvelope, ApiErrorEnvelope };

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
  | 'DUPLICATE_FAVORITE'
  | 'DUPLICATE_FOLLOW'
  | 'DUPLICATE_MENU_ITEM'
  | 'MENU_LIMIT'
  | 'MENU_ITEMS_LIMIT'
  | 'COMMENTS_DISABLED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT';

export type SendSuccessOptions = {
  /** 默认 200 */
  status?: number;
  /** 默认 ok */
  msg?: string;
  /** 合并进 meta（requestId、ts 由函数写入；分页场景请用 sendPagination） */
  extraMeta?: Record<string, unknown>;
};

function buildMeta(res: Response, extra?: Record<string, unknown>): ApiMeta {
  return {
    requestId: res.locals.requestId,
    ts: Date.now(),
    ...(extra || {}),
  };
}

export function sendSuccess<T>(res: Response, data: T, options?: SendSuccessOptions) {
  const status = options?.status ?? 200;
  const msg = options?.msg ?? 'ok';

  return res.status(status).json({
    statusCode: status,
    msg,
    data,
    meta: buildMeta(res, options?.extraMeta),
  });
}

export function sendPagination<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  options?: SendSuccessOptions
) {
  const status = options?.status ?? 200;
  const msg = options?.msg ?? 'ok';

  return res.status(status).json({
    statusCode: status,
    msg,
    data,
    meta: buildMeta(res, { ...options?.extraMeta, pagination }),
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
    statusCode: status,
    msg: message,
    data: null,
    error: {
      code,
      details: details || {},
      requestId: res.locals.requestId,
    },
  });
}


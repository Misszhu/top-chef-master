import { Request, Response } from 'express';
import { mealLogService } from '../services/meal-log.service';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

function parsePositiveInt(v: unknown, fallback: number, max: number): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export class MealLogController {
  async list(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const from = pickString(req.query.from) ?? '';
    const to = pickString(req.query.to) ?? '';
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const limit = parsePositiveInt(req.query.limit, 20, 50);
    try {
      const { data, total } = await mealLogService.list(userId, from, to, page, limit);
      return sendPagination(res, data, { page, limit, total });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('meal-logs list', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取饮食记录失败');
    }
  }

  async getOne(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '记录 id 无效');
    try {
      const data = await mealLogService.getById(id, userId);
      return sendSuccess(res, data);
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('meal-logs get', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取记录失败');
    }
  }

  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    try {
      const data = await mealLogService.create(userId, (req.body || {}) as Record<string, unknown>);
      return sendSuccess(res, data, { status: 201, msg: '已添加记录' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('meal-logs create', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '添加失败');
    }
  }

  async update(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '记录 id 无效');
    try {
      const data = await mealLogService.update(id, userId, (req.body || {}) as Record<string, unknown>);
      return sendSuccess(res, data, { msg: '已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('meal-logs update', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  }

  async remove(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '记录 id 无效');
    try {
      await mealLogService.remove(id, userId);
      return sendSuccess(res, { message: '删除成功' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('meal-logs delete', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  }
}

export const mealLogController = new MealLogController();

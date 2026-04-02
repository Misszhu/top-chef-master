import { Request, Response } from 'express';
import { favoriteService } from '../services/favorite.service';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

export class FavoriteController {
  async list(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');

    const limitStr = pickString(req.query.limit);
    const pageStr = pickString(req.query.page);
    const limitNum = limitStr ? parseInt(limitStr, 10) : 20;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;

    try {
      const { data, total } = await favoriteService.listFavorites(userId, limitNum, offsetNum);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (e) {
      console.error('favorites list', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取收藏列表失败');
    }
  }

  async status(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const dishId = pickParam(req.params.dishId);
    if (!isUuid(dishId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }
    try {
      const isFavorited = await favoriteService.isFavorited(userId, dishId);
      return sendSuccess(res, { isFavorited });
    } catch (e) {
      console.error('favorite status', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '查询失败');
    }
  }

  async add(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const dishId = pickParam(req.params.dishId);
    if (!isUuid(dishId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }
    try {
      await favoriteService.addFavorite(userId, dishId);
      return sendSuccess(res, { favorited: true }, { msg: '已收藏' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('favorite add', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '收藏失败');
    }
  }

  async remove(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const dishId = pickParam(req.params.dishId);
    if (!isUuid(dishId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }
    try {
      await favoriteService.removeFavorite(userId, dishId);
      return sendSuccess(res, { favorited: false }, { msg: '已取消收藏' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('favorite remove', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '取消收藏失败');
    }
  }
}

export const favoriteController = new FavoriteController();

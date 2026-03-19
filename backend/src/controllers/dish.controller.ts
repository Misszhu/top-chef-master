import { Request, Response } from 'express';
import { dishService } from '../services/dish.service';
import { DishQueryFilters } from '../models/dish.model';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';

export class DishController {
  async getAllDishes(req: Request, res: Response) {
    const { difficulty, tag, search, user_id, limit, page } = req.query;

    const filters: DishQueryFilters = {
      difficulty: difficulty as string,
      tag: tag as string,
      search: search as string,
      user_id: user_id as string,
    };

    const limitNum = limit ? parseInt(limit as string) : 20;
    const pageNum = page ? parseInt(page as string) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;

    try {
      const viewerId = req.user?.userId ?? null;
      const { data, total } = await dishService.getDishes(filters, limitNum, offsetNum, viewerId);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (error) {
      console.error('Error fetching dishes:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取列表失败');
    }
  }

  async getDishDetail(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const viewerId = req.user?.userId ?? null;
      const dish = await dishService.getDishById(id, viewerId);
      if (!dish) {
        return sendError(res, 404, 'NOT_FOUND', '菜谱不存在或无权限访问');
      }
      return sendSuccess(res, dish);
    } catch (error) {
      console.error('Error fetching dish detail:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取详情失败');
    }
  }

  async createDish(req: Request, res: Response) {
    const userId = req.user?.userId;
    const dishData = req.body;

    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    try {
      const dish = await dishService.createDish(userId, dishData);
      return res.status(201).json({ data: dish, meta: { requestId: res.locals.requestId, ts: Date.now() } });
    } catch (error) {
      console.error('Error creating dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '创建失败');
    }
  }

  async updateDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;
    const dishData = req.body;
    const ifMatchVersion = req.body?.ifMatchVersion as number | undefined;

    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    try {
      const dish = await dishService.updateDish(id, userId, dishData, ifMatchVersion);
      if (!dish) {
        return sendError(res, 404, 'NOT_FOUND', '菜谱不存在或无权限访问');
      }
      return sendSuccess(res, dish);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return sendError(res, error.status, error.code, error.message, error.details);
      }
      console.error('Error updating dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  }

  async deleteDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    try {
      const success = await dishService.deleteDish(id, userId);
      if (!success) {
        return sendError(res, 404, 'NOT_FOUND', '菜谱不存在或无权限访问');
      }
      return res.status(204).send();
    } catch (error: any) {
      if (error instanceof ApiError) {
        return sendError(res, error.status, error.code, error.message, error.details);
      }
      console.error('Error deleting dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  }

  async likeDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    try {
      const likeCount = await dishService.likeDish(id, userId);
      return sendSuccess(res, { liked: true, likeCount });
    } catch (error: any) {
      if (error instanceof ApiError) {
        return sendError(res, error.status, error.code, error.message, error.details);
      }
      console.error('Error liking dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '点赞失败');
    }
  }

  async unlikeDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    try {
      const likeCount = await dishService.unlikeDish(id, userId);
      return sendSuccess(res, { liked: false, likeCount });
    } catch (error) {
      console.error('Error unliking dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '取消点赞失败');
    }
  }
}

export const dishController = new DishController();

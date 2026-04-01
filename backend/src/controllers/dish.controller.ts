import { Request, Response } from 'express';
import fs from 'fs/promises';
import { dishService } from '../services/dish.service';
import { DishQueryFilters } from '../models/dish.model';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

export class DishController {
  async getAllDishes(req: Request, res: Response) {
    const { difficulty, tag, search, user_id, limit, page } = req.query;

    const difficultyStr = pickString(difficulty);
    const tagStr = pickString(tag);
    const searchStr = pickString(search);
    const userIdStr = pickString(user_id);

    const filters: DishQueryFilters = {
      difficulty: difficultyStr,
      tag: tagStr,
      search: searchStr,
      user_id: userIdStr,
    };

    const limitStr = pickString(limit);
    const pageStr = pickString(page);

    const limitNum = limitStr ? parseInt(limitStr, 10) : 20;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
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
    const { id: dishIdParam } = req.params;

    try {
      const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
      if (!dishId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
      }

      const viewerId = req.user?.userId ?? null;
      const dish = await dishService.getDishById(dishId, viewerId);
      if (!dish) {
        return sendError(res, 404, 'NOT_FOUND', '菜谱不存在或无权限访问');
      }
      return sendSuccess(res, dish);
    } catch (error) {
      console.error('Error fetching dish detail:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取详情失败');
    }
  }

  async uploadDishCover(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return sendError(res, 400, 'VALIDATION_ERROR', '请选择图片文件');
    }

    const dishIdParam = req.params.id;
    const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
    if (!dishId) {
      await fs.unlink(file.path).catch(() => undefined);
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }

    const rawVer = req.body?.ifMatchVersion;
    let ifMatchVersion: number | undefined;
    if (rawVer !== undefined && rawVer !== '') {
      const n = parseInt(String(rawVer), 10);
      if (Number.isNaN(n)) {
        await fs.unlink(file.path).catch(() => undefined);
        return sendError(res, 400, 'VALIDATION_ERROR', 'ifMatchVersion 无效');
      }
      ifMatchVersion = n;
    }

    const origin =
      process.env.API_PUBLIC_ORIGIN?.replace(/\/$/, '') ||
      `${req.protocol}://${req.get('host') || 'localhost'}`;
    const image_url = `${origin}/uploads/dishes/${file.filename}`;

    const cleanupFile = () => fs.unlink(file.path).catch(() => undefined);

    try {
      const dish = await dishService.updateDish(dishId, userId, { image_url }, ifMatchVersion);
      if (!dish) {
        await cleanupFile();
        return sendError(res, 404, 'NOT_FOUND', '菜谱不存在或无权限访问');
      }
      return sendSuccess(res, dish);
    } catch (error: any) {
      await cleanupFile();
      if (error instanceof ApiError) {
        return sendError(res, error.status, error.code, error.message, error.details);
      }
      console.error('Error uploading dish cover:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '上传失败');
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
    const { id: dishIdParam } = req.params;
    const userId = req.user?.userId;
    const dishData = req.body;
    const ifMatchVersion = req.body?.ifMatchVersion as number | undefined;

    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    try {
      const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
      if (!dishId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
      }

      const dish = await dishService.updateDish(dishId, userId, dishData, ifMatchVersion);
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
    const { id: dishIdParam } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }

    try {
      const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
      if (!dishId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
      }

      const success = await dishService.deleteDish(dishId, userId);
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
    const { id: dishIdParam } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    try {
      const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
      if (!dishId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
      }

      const likeCount = await dishService.likeDish(dishId, userId);
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
    const { id: dishIdParam } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    try {
      const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
      if (!dishId) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
      }

      const likeCount = await dishService.unlikeDish(dishId, userId);
      return sendSuccess(res, { liked: false, likeCount });
    } catch (error) {
      console.error('Error unliking dish:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '取消点赞失败');
    }
  }
}

export const dishController = new DishController();

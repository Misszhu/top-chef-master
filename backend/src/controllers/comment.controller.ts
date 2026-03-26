import type { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

export class CommentController {
  async listByDish(req: Request, res: Response) {
    const { id: dishIdParam } = req.params;
    const { limit, page } = req.query;

    const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
    if (!dishId) return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');

    const limitStr = pickString(limit);
    const pageStr = pickString(page);

    const limitNum = limitStr ? parseInt(limitStr, 10) : 10;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;

    try {
      const { data, total } = await commentService.listByDishId(dishId, limitNum, offsetNum);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (e) {
      console.error('Error listing comments:', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取评论失败');
    }
  }

  async upsertForDish(req: Request, res: Response) {
    const { id: dishIdParam } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');

    const dishId = Array.isArray(dishIdParam) ? dishIdParam[0] : dishIdParam;
    if (!dishId) return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');

    try {
      const comment = await commentService.upsertForDish(dishId, userId, req.body);
      return sendSuccess(res, comment);
    } catch (e: any) {
      if (e instanceof ApiError) return sendError(res, e.status, e.code, e.message, e.details);
      console.error('Error upserting comment:', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '发表评论失败');
    }
  }

  async updateById(req: Request, res: Response) {
    const { id: commentIdParam } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');

    const commentId = Array.isArray(commentIdParam) ? commentIdParam[0] : commentIdParam;
    if (!commentId) return sendError(res, 400, 'VALIDATION_ERROR', 'commentId 无效');

    try {
      const comment = await commentService.updateById(commentId, userId, req.body);
      return sendSuccess(res, comment);
    } catch (e: any) {
      if (e instanceof ApiError) return sendError(res, e.status, e.code, e.message, e.details);
      console.error('Error updating comment:', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新评论失败');
    }
  }

  async deleteById(req: Request, res: Response) {
    const { id: commentIdParam } = req.params;
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');

    const commentId = Array.isArray(commentIdParam) ? commentIdParam[0] : commentIdParam;
    if (!commentId) return sendError(res, 400, 'VALIDATION_ERROR', 'commentId 无效');

    try {
      await commentService.deleteById(commentId, userId);
      return res.status(204).send();
    } catch (e: any) {
      if (e instanceof ApiError) return sendError(res, e.status, e.code, e.message, e.details);
      console.error('Error deleting comment:', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除评论失败');
    }
  }
}

export const commentController = new CommentController();


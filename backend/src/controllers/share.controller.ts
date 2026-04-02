import { Request, Response } from 'express';
import { shareService } from '../services/share.service';
import { sendError, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';

export class ShareController {
  /** POST /shares { dishId, shareType? } */
  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }
    const body = req.body || {};
    const dishId = typeof body.dishId === 'string' ? body.dishId : typeof body.dish_id === 'string' ? body.dish_id : '';
    if (!isUuid(dishId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }
    const shareType = typeof body.shareType === 'string' ? body.shareType : body.share_type;
    try {
      const shareCount = await shareService.recordShare(dishId, userId, shareType);
      return sendSuccess(res, { shareCount }, { msg: '已记录分享' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('share create', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '记录分享失败');
    }
  }

  /** GET /shares/stats/:dishId */
  async getStats(req: Request, res: Response) {
    const dishId = pickParam(req.params.dishId);
    if (!isUuid(dishId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    }
    const viewerId = req.user?.userId ?? null;
    try {
      const stats = await shareService.getStatsForViewer(dishId, viewerId);
      return sendSuccess(res, stats);
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('share stats', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取统计失败');
    }
  }
}

export const shareController = new ShareController();

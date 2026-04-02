import { dishRepository } from '../repositories/dish.repository';
import { shareRepository } from '../repositories/share.repository';
import { ApiError } from '../utils/api-error';

export class ShareService {
  async recordShare(dishId: string, userId: string, shareType?: string | null): Promise<number> {
    const visible = await dishRepository.findVisibleById(dishId, userId);
    if (!visible) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    return shareRepository.recordShare(dishId, userId, shareType);
  }

  async getStatsForViewer(dishId: string, viewerId: string | null): Promise<{ shareCount: number; viewCount: number }> {
    const dish = await dishRepository.findVisibleById(dishId, viewerId);
    if (!dish) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    return {
      shareCount: Number(dish.share_count) || 0,
      viewCount: Number(dish.view_count) || 0,
    };
  }
}

export const shareService = new ShareService();

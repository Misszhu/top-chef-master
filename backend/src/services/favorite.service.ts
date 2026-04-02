import { favoriteRepository } from '../repositories/favorite.repository';
import { dishRepository } from '../repositories/dish.repository';
import { ApiError } from '../utils/api-error';
import type { Dish } from '../models/dish.model';

export class FavoriteService {
  async addFavorite(userId: string, dishId: string): Promise<void> {
    const visible = await dishRepository.findVisibleById(dishId, userId);
    if (!visible) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    try {
      await favoriteRepository.add(userId, dishId);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ApiError(409, 'DUPLICATE_FAVORITE', '已收藏');
      }
      throw e;
    }
  }

  /** 取消收藏；未收藏过也返回成功（幂等）；不校验菜谱可见性（避免菜被隐藏后无法取消收藏） */
  async removeFavorite(userId: string, dishId: string): Promise<void> {
    await favoriteRepository.remove(userId, dishId);
  }

  async listFavorites(userId: string, limit: number, offset: number): Promise<{ data: Dish[]; total: number }> {
    return favoriteRepository.findDishesWithTotal(userId, userId, limit, offset);
  }

  async isFavorited(userId: string, dishId: string): Promise<boolean> {
    return favoriteRepository.exists(userId, dishId);
  }
}

export const favoriteService = new FavoriteService();

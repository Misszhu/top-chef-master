import { dishRepository } from '../repositories/dish.repository';
import { Dish, DishCreateDTO, DishUpdateDTO, DishQueryFilters } from '../models/dish.model';
import { ApiError } from '../utils/api-error';

export class DishService {
  async getDishes(filters: DishQueryFilters, limit: number, offset: number, viewerId: string | null) {
    return dishRepository.findAllWithTotal(filters, limit, offset, viewerId);
  }

  async getDishById(id: string, viewerId: string | null): Promise<Dish | null> {
    const dish = await dishRepository.findVisibleById(id, viewerId);
    if (dish) {
      if (viewerId) {
        dish.liked_by_me = await dishRepository.isLikedByUser(id, viewerId);
      }
      // Async increment view count, don't wait for it
      dishRepository.incrementViewCount(id).catch(err => console.error('Error incrementing view count:', err));
    }
    return dish;
  }

  async createDish(user_id: string, dishData: DishCreateDTO): Promise<Dish> {
    return dishRepository.create(user_id, dishData);
  }

  async updateDish(id: string, user_id: string, dishData: DishUpdateDTO, ifMatchVersion?: number): Promise<Dish | null> {
    const existingDish = await dishRepository.findById(id);
    if (!existingDish) return null;
    
    if (existingDish.user_id !== user_id) {
      throw new ApiError(403, 'FORBIDDEN', '无权限操作');
    }
    
    const updated = await dishRepository.update(id, dishData, ifMatchVersion);
    if (!updated && ifMatchVersion !== undefined) {
      const latest = await dishRepository.findById(id);
      throw new ApiError(409, 'VERSION_CONFLICT', '数据已在其他端更新，请处理冲突后重试', {
        resource: 'dish',
        id,
        serverVersion: (latest as any)?.version,
        serverUpdatedAt: (latest as any)?.updated_at,
        serverSnapshot: latest,
      });
    }
    return updated;
  }

  async deleteDish(id: string, user_id: string): Promise<boolean> {
    const existingDish = await dishRepository.findById(id);
    if (!existingDish) return false;
    
    if (existingDish.user_id !== user_id) {
      throw new ApiError(403, 'FORBIDDEN', '无权限操作');
    }
    
    return dishRepository.delete(id);
  }

  async likeDish(dishId: string, userId: string): Promise<number> {
    const visible = await dishRepository.findVisibleById(dishId, userId);
    if (!visible) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    try {
      return await dishRepository.likeDish(dishId, userId);
    } catch (e: any) {
      if (e?.code === '23505') {
        // unique violation
        throw new ApiError(409, 'DUPLICATE_LIKE', '已点赞');
      }
      throw e;
    }
  }

  async unlikeDish(dishId: string, userId: string): Promise<number> {
    const visible = await dishRepository.findVisibleById(dishId, userId);
    if (!visible) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    return dishRepository.unlikeDish(dishId, userId);
  }
}

export const dishService = new DishService();

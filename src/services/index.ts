/**
 * 菜肴服务 - 业务逻辑层
 */

import { Dish, DishFormData, FilterOptions } from '../types';
import { StorageService } from './storage-service';
import { generateUUID } from '../utils/uuid';
import { STORAGE_KEYS } from '../utils/constants';

export class DishService {
  /**
   * 获取所有菜肴
   */
  static async getAllDishes(): Promise<Dish[]> {
    try {
      const dishes = await StorageService.getItem(STORAGE_KEYS.DISHES_LIST);
      return dishes || [];
    } catch (error) {
      console.error('Get all dishes error:', error);
      return [];
    }
  }

  /**
   * 根据 ID 获取菜肴
   */
  static async getDishById(id: string): Promise<Dish | null> {
    try {
      const dishes = await this.getAllDishes();
      return dishes.find(dish => dish.id === id) || null;
    } catch (error) {
      console.error('Get dish by id error:', error);
      return null;
    }
  }

  /**
   * 创建菜肴
   */
  static async createDish(dishData: DishFormData): Promise<Dish> {
    try {
      const dishes = await this.getAllDishes();
      const now = Date.now();

      const newDish: Dish = {
        id: generateUUID(),
        ...dishData,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };

      dishes.push(newDish);
      await StorageService.setItem(STORAGE_KEYS.DISHES_LIST, dishes);

      return newDish;
    } catch (error) {
      console.error('Create dish error:', error);
      throw new Error('Failed to create dish');
    }
  }

  /**
   * 更新菜肴
   */
  static async updateDish(id: string, updates: Partial<DishFormData>): Promise<Dish> {
    try {
      const dishes = await this.getAllDishes();
      const index = dishes.findIndex(dish => dish.id === id);

      if (index === -1) {
        throw new Error('Dish not found');
      }

      const updatedDish: Dish = {
        ...dishes[index],
        ...updates,
        updatedAt: Date.now(),
      };

      dishes[index] = updatedDish;
      await StorageService.setItem(STORAGE_KEYS.DISHES_LIST, dishes);

      return updatedDish;
    } catch (error) {
      console.error('Update dish error:', error);
      throw new Error('Failed to update dish');
    }
  }

  /**
   * 删除菜肴
   */
  static async deleteDish(id: string): Promise<void> {
    try {
      const dishes = await this.getAllDishes();
      const filteredDishes = dishes.filter(dish => dish.id !== id);
      await StorageService.setItem(STORAGE_KEYS.DISHES_LIST, filteredDishes);

      // 从收藏列表移除
      await this.removeFavorite(id);
    } catch (error) {
      console.error('Delete dish error:', error);
      throw new Error('Failed to delete dish');
    }
  }

  /**
   * 搜索菜肴
   */
  static async searchDishes(keyword: string): Promise<Dish[]> {
    try {
      const dishes = await this.getAllDishes();
      const lowerKeyword = keyword.toLowerCase();

      return dishes.filter(dish => {
        const nameMatch = dish.name.toLowerCase().includes(lowerKeyword);
        const tagMatch = dish.tags.some(tag => tag.toLowerCase().includes(lowerKeyword));
        const descMatch = dish.description.toLowerCase().includes(lowerKeyword);

        return nameMatch || tagMatch || descMatch;
      });
    } catch (error) {
      console.error('Search dishes error:', error);
      return [];
    }
  }

  /**
   * 按筛选条件获取菜肴
   */
  static async filterDishes(options: FilterOptions): Promise<Dish[]> {
    try {
      let dishes = await this.getAllDishes();

      // 按难度筛选
      if (options.difficulty) {
        dishes = dishes.filter(dish => dish.difficulty === options.difficulty);
      }

      // 按标签筛选
      if (options.tag) {
        dishes = dishes.filter(dish => dish.tags.includes(options.tag!));
      }

      // 按烹饪时间筛选
      if (options.cookingTime) {
        dishes = dishes.filter(dish => dish.cookingTime <= options.cookingTime!);
      }

      // 按搜索文本筛选
      if (options.searchText) {
        const searchResults = await this.searchDishes(options.searchText);
        const searchIds = new Set(searchResults.map(d => d.id));
        dishes = dishes.filter(dish => searchIds.has(dish.id));
      }

      // 只显示收藏
      if (options.onlyFavorites) {
        dishes = dishes.filter(dish => dish.isFavorite);
      }

      return dishes;
    } catch (error) {
      console.error('Filter dishes error:', error);
      return [];
    }
  }

  /**
   * 按标签获取菜肴
   */
  static async getDishesByTag(tag: string): Promise<Dish[]> {
    try {
      const dishes = await this.getAllDishes();
      return dishes.filter(dish => dish.tags.includes(tag));
    } catch (error) {
      console.error('Get dishes by tag error:', error);
      return [];
    }
  }

  /**
   * 按难度获取菜肴
   */
  static async getDishesByDifficulty(difficulty: string): Promise<Dish[]> {
    try {
      const dishes = await this.getAllDishes();
      return dishes.filter(dish => dish.difficulty === difficulty);
    } catch (error) {
      console.error('Get dishes by difficulty error:', error);
      return [];
    }
  }

  /**
   * 获取所有标签
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const dishes = await this.getAllDishes();
      const tagsSet = new Set<string>();

      dishes.forEach(dish => {
        dish.tags.forEach(tag => tagsSet.add(tag));
      });

      return Array.from(tagsSet).sort();
    } catch (error) {
      console.error('Get all tags error:', error);
      return [];
    }
  }

  /**
   * 添加到收藏
   */
  static async addFavorite(id: string): Promise<void> {
    try {
      const dish = await this.getDishById(id);
      if (!dish) throw new Error('Dish not found');

      const favorites = await StorageService.getItem(STORAGE_KEYS.FAVORITES_IDS) || [];
      if (!favorites.includes(id)) {
        favorites.push(id);
        await StorageService.setItem(STORAGE_KEYS.FAVORITES_IDS, favorites);
      }

      // 更新菜肴的 isFavorite 状态
      await this.updateDish(id, { ...dish, isFavorite: true });
    } catch (error) {
      console.error('Add favorite error:', error);
      throw new Error('Failed to add favorite');
    }
  }

  /**
   * 移除收藏
   */
  static async removeFavorite(id: string): Promise<void> {
    try {
      const favorites = await StorageService.getItem(STORAGE_KEYS.FAVORITES_IDS) || [];
      const filtered = favorites.filter((fav: string) => fav !== id);
      await StorageService.setItem(STORAGE_KEYS.FAVORITES_IDS, filtered);

      // 更新菜肴的 isFavorite 状态
      const dish = await this.getDishById(id);
      if (dish) {
        await this.updateDish(id, { ...dish, isFavorite: false });
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw new Error('Failed to remove favorite');
    }
  }

  /**
   * 切换收藏状态
   */
  static async toggleFavorite(id: string): Promise<boolean> {
    try {
      const dish = await this.getDishById(id);
      if (!dish) throw new Error('Dish not found');

      if (dish.isFavorite) {
        await this.removeFavorite(id);
      } else {
        await this.addFavorite(id);
      }

      return !dish.isFavorite;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw new Error('Failed to toggle favorite');
    }
  }

  /**
   * 获取所有收藏菜肴
   */
  static async getFavoriteDishes(): Promise<Dish[]> {
    try {
      const dishes = await this.getAllDishes();
      return dishes.filter(dish => dish.isFavorite);
    } catch (error) {
      console.error('Get favorite dishes error:', error);
      return [];
    }
  }

  /**
   * 获取统计信息
   */
  static async getStatistics(): Promise<{
    total: number;
    favoriteCount: number;
    byDifficulty: Record<string, number>;
  }> {
    try {
      const dishes = await this.getAllDishes();
      const stats = {
        total: dishes.length,
        favoriteCount: dishes.filter(d => d.isFavorite).length,
        byDifficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
      };

      dishes.forEach(dish => {
        stats.byDifficulty[dish.difficulty as keyof typeof stats.byDifficulty]++;
      });

      return stats;
    } catch (error) {
      console.error('Get statistics error:', error);
      return { total: 0, favoriteCount: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 } };
    }
  }
}

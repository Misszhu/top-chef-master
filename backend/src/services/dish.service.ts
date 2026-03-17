import { dishRepository } from '../repositories/dish.repository';
import { Dish, DishCreateDTO, DishUpdateDTO, DishQueryFilters } from '../models/dish.model';

export class DishService {
  async getDishes(filters: DishQueryFilters, limit: number, offset: number): Promise<Dish[]> {
    return dishRepository.findAll(filters, limit, offset);
  }

  async getDishById(id: number): Promise<Dish | null> {
    const dish = await dishRepository.findById(id);
    if (dish) {
      // Async increment view count, don't wait for it
      dishRepository.incrementViewCount(id).catch(err => console.error('Error incrementing view count:', err));
    }
    return dish;
  }

  async createDish(user_id: number, dishData: DishCreateDTO): Promise<Dish> {
    return dishRepository.create(user_id, dishData);
  }

  async updateDish(id: number, user_id: number, dishData: DishUpdateDTO): Promise<Dish | null> {
    const existingDish = await dishRepository.findById(id);
    if (!existingDish) return null;
    
    if (existingDish.user_id !== user_id) {
      throw new Error('Unauthorized to update this dish');
    }
    
    return dishRepository.update(id, dishData);
  }

  async deleteDish(id: number, user_id: number): Promise<boolean> {
    const existingDish = await dishRepository.findById(id);
    if (!existingDish) return false;
    
    if (existingDish.user_id !== user_id) {
      throw new Error('Unauthorized to delete this dish');
    }
    
    return dishRepository.delete(id);
  }
}

export const dishService = new DishService();

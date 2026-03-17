import { Request, Response } from 'express';
import { dishService } from '../services/dish.service';
import { DishQueryFilters } from '../models/dish.model';

export class DishController {
  async getAllDishes(req: Request, res: Response) {
    const { difficulty, tag_id, search, user_id, is_public, limit, offset } = req.query;

    const filters: DishQueryFilters = {
      difficulty: difficulty as string,
      tag_id: tag_id ? parseInt(tag_id as string) : undefined,
      search: search as string,
      user_id: user_id ? parseInt(user_id as string) : undefined,
      is_public: is_public !== undefined ? is_public === 'true' : true
    };

    const limitNum = limit ? parseInt(limit as string) : 20;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    try {
      const dishes = await dishService.getDishes(filters, limitNum, offsetNum);
      return res.json(dishes);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getDishDetail(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const dish = await dishService.getDishById(parseInt(id as string));
      if (!dish) {
        return res.status(404).json({ message: 'Dish not found' });
      }
      return res.json(dish);
    } catch (error) {
      console.error('Error fetching dish detail:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async createDish(req: Request, res: Response) {
    const userId = req.user?.userId;
    const dishData = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
      const dish = await dishService.createDish(userId, dishData);
      return res.status(201).json(dish);
    } catch (error) {
      console.error('Error creating dish:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;
    const dishData = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
      const dish = await dishService.updateDish(parseInt(id as string), userId, dishData);
      if (!dish) {
        return res.status(404).json({ message: 'Dish not found or unauthorized' });
      }
      return res.json(dish);
    } catch (error: any) {
      if (error.message === 'Unauthorized to update this dish') {
        return res.status(403).json({ message: error.message });
      }
      console.error('Error updating dish:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteDish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
      const success = await dishService.deleteDish(parseInt(id as string), userId);
      if (!success) {
        return res.status(404).json({ message: 'Dish not found or unauthorized' });
      }
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Unauthorized to delete this dish') {
        return res.status(403).json({ message: error.message });
      }
      console.error('Error deleting dish:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const dishController = new DishController();

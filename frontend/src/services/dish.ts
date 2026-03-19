import request from '../utils/request';
import { Dish, DishCreateDTO, DishQueryFilters } from '../types/dish';

export const getDishes = async (filters: DishQueryFilters = {}): Promise<Dish[]> => {
  const response = await request.get('/dishes', { params: filters });
  return response.data.data;
};

export const getDishById = async (id: string): Promise<Dish> => {
  const response = await request.get(`/dishes/${id}`);
  return response.data.data;
};

export const createDish = async (dishData: DishCreateDTO): Promise<Dish> => {
  const response = await request.post('/dishes', dishData);
  return response.data.data;
};

export const updateDish = async (id: string, dishData: Partial<DishCreateDTO>): Promise<Dish> => {
  const response = await request.put(`/dishes/${id}`, dishData);
  return response.data.data;
};

export const deleteDish = async (id: string): Promise<void> => {
  await request.delete(`/dishes/${id}`);
};

export const likeDish = async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await request.post(`/dishes/${id}/like`);
  return response.data.data;
};

export const unlikeDish = async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await request.delete(`/dishes/${id}/like`);
  return response.data.data;
};

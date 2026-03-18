import request from '../utils/request';
import { Dish, DishCreateDTO, DishQueryFilters } from '../types/dish';

export const getDishes = async (filters: DishQueryFilters = {}): Promise<Dish[]> => {
  const response = await request.get('/dishes', { params: filters });
  return response.data;
};

export const getDishById = async (id: number): Promise<Dish> => {
  const response = await request.get(`/dishes/${id}`);
  return response.data;
};

export const createDish = async (dishData: DishCreateDTO): Promise<Dish> => {
  const response = await request.post('/dishes', dishData);
  return response.data;
};

export const updateDish = async (id: number, dishData: Partial<DishCreateDTO>): Promise<Dish> => {
  const response = await request.put(`/dishes/${id}`, dishData);
  return response.data;
};

export const deleteDish = async (id: number): Promise<void> => {
  await request.delete(`/dishes/${id}`);
};

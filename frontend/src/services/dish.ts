import axios from 'axios';
import { Dish, DishCreateDTO, DishQueryFilters } from '../types/dish';

const API_URL = 'http://localhost:3000/api/dishes'; // TODO: Get from env

export const getDishes = async (filters: DishQueryFilters = {}): Promise<Dish[]> => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

export const getDishById = async (id: number): Promise<Dish> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createDish = async (dishData: DishCreateDTO, token: string): Promise<Dish> => {
  const response = await axios.post(API_URL, dishData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateDish = async (id: number, dishData: Partial<DishCreateDTO>, token: string): Promise<Dish> => {
  const response = await axios.put(`${API_URL}/${id}`, dishData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteDish = async (id: number, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

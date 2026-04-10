import Taro from '@tarojs/taro';
import request from '../utils/request';
import { getApiOrigin } from '../utils/api-origin';
import { Dish, DishCreateDTO, DishQueryFilters, DishesPage } from '../types/dish';

export const getDishes = async (filters: DishQueryFilters = {}): Promise<DishesPage> => {
  const response = await request.get('/dishes', { params: filters });
  const meta = response.data.meta ?? {};
  const pagination = meta.pagination ?? { page: 1, limit: 20, total: 0 };
  return {
    data: Array.isArray(response.data.data) ? response.data.data : [],
    pagination,
  };
};

export const getDishById = async (id: string): Promise<Dish> => {
  const response = await request.get(`/dishes/${id}`);
  return response.data.data;
};

export const createDish = async (dishData: DishCreateDTO): Promise<Dish> => {
  const response = await request.post('/dishes', dishData);
  return response.data.data;
};

export const uploadDishCover = (
  dishId: string,
  tempFilePath: string,
  ifMatchVersion: number
): Promise<Dish> => {
  return new Promise((resolve, reject) => {
    const token = Taro.getStorageSync('token')
    Taro.uploadFile({
      url: `${getApiOrigin()}/api/v1/dishes/${dishId}/image`,
      filePath: tempFilePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      formData: { ifMatchVersion: String(ifMatchVersion) },
      success: (res) => {
        try {
          const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (res.statusCode >= 200 && res.statusCode < 300 && body?.data) {
            resolve(body.data as Dish)
            return
          }
          const errMsg = typeof body?.msg === 'string' && body.msg ? body.msg : '上传失败'
          reject(Object.assign(new Error(errMsg), { response: { status: res.statusCode, data: body } }))
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => reject(err),
    })
  })
}

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

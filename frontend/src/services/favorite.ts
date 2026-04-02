import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'
import type { Dish } from '../types/dish'

export async function getFavorites(page = 1, limit = 20): Promise<{
  dishes: Dish[]
  pagination: { page: number; limit: number; total: number }
}> {
  const res = await request.get<ApiSuccessEnvelope<Dish[]>>('/favorites', { params: { page, limit } })
  const p = res.data.meta.pagination
  if (!p) {
    return { dishes: res.data.data, pagination: { page: 1, limit, total: res.data.data.length } }
  }
  return { dishes: res.data.data, pagination: p }
}

export async function addFavorite(dishId: string): Promise<void> {
  await request.post(`/favorites/${dishId}`)
}

export async function removeFavorite(dishId: string): Promise<void> {
  await request.delete(`/favorites/${dishId}`)
}

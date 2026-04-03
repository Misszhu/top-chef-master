import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'
import type { MealLogEntry } from '../types/meal-log'

export async function getMealLogs(
  from: string,
  to: string,
  page = 1,
  limit = 50
): Promise<{ entries: MealLogEntry[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<MealLogEntry[]>>('/meal-logs', {
    params: { from, to, page, limit },
  })
  const p = res.data.meta.pagination
  const entries = res.data.data
  if (!p) {
    return { entries, pagination: { page: 1, limit, total: entries.length } }
  }
  return { entries, pagination: p }
}

export async function getMealLogById(id: string): Promise<MealLogEntry> {
  const res = await request.get<ApiSuccessEnvelope<MealLogEntry>>(`/meal-logs/${id}`)
  return res.data.data
}

export async function createMealLog(body: {
  eaten_date: string
  meal_slot?: MealLogEntry['meal_slot'] | null
  dish_id?: string | null
  title?: string
  notes?: string | null
}): Promise<MealLogEntry> {
  const res = await request.post<ApiSuccessEnvelope<MealLogEntry>>('/meal-logs', body)
  return res.data.data
}

export async function updateMealLog(
  id: string,
  body: {
    eaten_date?: string
    meal_slot?: MealLogEntry['meal_slot'] | null
    dish_id?: string | null
    title?: string
    notes?: string | null
    ifMatchVersion: number
  }
): Promise<MealLogEntry> {
  const res = await request.put<ApiSuccessEnvelope<MealLogEntry>>(`/meal-logs/${id}`, body)
  return res.data.data
}

export async function deleteMealLog(id: string): Promise<void> {
  await request.delete(`/meal-logs/${id}`)
}

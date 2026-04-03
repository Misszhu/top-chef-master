import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'
import type { MenuDetail, MenuSummary } from '../types/menu'

export async function getMenus(
  page = 1,
  limit = 50,
  sort: 'latest' | 'created' = 'latest'
): Promise<{ menus: MenuSummary[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<MenuSummary[]>>('/menus', { params: { page, limit, sort } })
  const p = res.data.meta.pagination
  const menus = res.data.data
  if (!p) {
    return { menus, pagination: { page: 1, limit, total: menus.length } }
  }
  return { menus, pagination: p }
}

export async function getMenuById(id: string): Promise<MenuDetail> {
  const res = await request.get<ApiSuccessEnvelope<MenuDetail>>(`/menus/${id}`)
  return res.data.data
}

export async function createMenu(body: {
  name?: string
  description?: string | null
  tags?: string[]
  cover_image_url?: string | null
}): Promise<MenuDetail> {
  const res = await request.post<ApiSuccessEnvelope<MenuDetail>>('/menus', body)
  return res.data.data
}

export async function updateMenu(
  id: string,
  body: {
    name?: string
    description?: string | null
    tags?: string[]
    cover_image_url?: string | null
    ifMatchVersion: number
  }
): Promise<MenuDetail> {
  const res = await request.put<ApiSuccessEnvelope<MenuDetail>>(`/menus/${id}`, body)
  return res.data.data
}

export async function deleteMenu(id: string): Promise<void> {
  await request.delete(`/menus/${id}`)
}

export async function copyMenu(id: string, newName?: string): Promise<MenuDetail & { copied_from: string }> {
  const res = await request.post<ApiSuccessEnvelope<MenuDetail & { copied_from: string }>>(`/menus/${id}/copy`, {
    newName: newName,
  })
  return res.data.data
}

export async function addMenuItem(
  menuId: string,
  dishId: string,
  servings = 1,
  notes?: string | null
): Promise<{ menu_version: number }> {
  const res = await request.post<ApiSuccessEnvelope<{ item: unknown; menu_version: number }>>(
    `/menus/${menuId}/items`,
    { dishId, servings, notes }
  )
  return { menu_version: res.data.data.menu_version }
}

export async function removeMenuItem(menuId: string, itemId: string): Promise<{ menu_version: number }> {
  const res = await request.delete<ApiSuccessEnvelope<{ ok: boolean; menu_version: number }>>(
    `/menus/${menuId}/items/${itemId}`
  )
  return { menu_version: res.data.data.menu_version }
}

export async function reorderMenuItems(menuId: string, itemIds: string[]): Promise<{ menu_version: number }> {
  const res = await request.put<ApiSuccessEnvelope<{ ok: boolean; menu_version: number }>>(
    `/menus/${menuId}/items/reorder`,
    { itemIds }
  )
  return { menu_version: res.data.data.menu_version }
}

export async function updateMenuItem(
  menuId: string,
  itemId: string,
  body: { servings?: number; notes?: string | null }
): Promise<{ menu_version: number }> {
  const res = await request.put<ApiSuccessEnvelope<{ item: unknown; menu_version: number }>>(
    `/menus/${menuId}/items/${itemId}`,
    body
  )
  return { menu_version: res.data.data.menu_version }
}

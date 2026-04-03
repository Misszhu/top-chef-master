import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'
import type { ShoppingListDetail, ShoppingListItem, ShoppingListSummary } from '../types/shopping-list'

export async function getShoppingLists(
  page = 1,
  limit = 20
): Promise<{ lists: ShoppingListSummary[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<ShoppingListSummary[]>>('/shopping-lists', {
    params: { page, limit },
  })
  const p = res.data.meta.pagination
  const lists = res.data.data
  if (!p) {
    return { lists, pagination: { page: 1, limit, total: lists.length } }
  }
  return { lists, pagination: p }
}

export async function getShoppingListById(id: string): Promise<ShoppingListDetail> {
  const res = await request.get<ApiSuccessEnvelope<ShoppingListDetail>>(`/shopping-lists/${id}`)
  return res.data.data
}

export async function createShoppingList(body?: { menu_id?: string }): Promise<ShoppingListDetail> {
  const res = await request.post<ApiSuccessEnvelope<ShoppingListDetail>>('/shopping-lists', body ?? {})
  return res.data.data
}

export async function updateShoppingListMeta(
  id: string,
  body: { estimated_cost: number | null; ifMatchVersion: number }
): Promise<ShoppingListDetail> {
  const res = await request.put<ApiSuccessEnvelope<ShoppingListDetail>>(`/shopping-lists/${id}`, body)
  return res.data.data
}

export async function deleteShoppingList(id: string): Promise<void> {
  await request.delete(`/shopping-lists/${id}`)
}

export async function refreshShoppingListFromMenu(
  listId: string,
  menuId: string
): Promise<ShoppingListDetail> {
  const res = await request.post<ApiSuccessEnvelope<ShoppingListDetail>>(
    `/shopping-lists/${listId}/from-menu/${menuId}`
  )
  return res.data.data
}

export async function addShoppingListItem(
  listId: string,
  body: {
    ingredient_name: string
    quantity?: number | null
    unit?: string | null
    category?: string | null
    notes?: string | null
  }
): Promise<{ item: ShoppingListItem; list_version: number; items: ShoppingListItem[] }> {
  const res = await request.post<
    ApiSuccessEnvelope<{ item: ShoppingListItem; list_version: number; items: ShoppingListItem[] }>
  >(`/shopping-lists/${listId}/items`, body)
  return res.data.data
}

export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  body: { is_checked?: boolean; quantity?: number | null; notes?: string | null }
): Promise<{ item: ShoppingListItem; list_version: number; items: ShoppingListItem[] }> {
  const res = await request.put<
    ApiSuccessEnvelope<{ item: ShoppingListItem; list_version: number; items: ShoppingListItem[] }>
  >(`/shopping-lists/${listId}/items/${itemId}`, body)
  return res.data.data
}

export async function deleteShoppingListItem(
  listId: string,
  itemId: string
): Promise<{ list_version: number; items: ShoppingListItem[] }> {
  const res = await request.delete<ApiSuccessEnvelope<{ list_version: number; items: ShoppingListItem[] }>>(
    `/shopping-lists/${listId}/items/${itemId}`
  )
  return res.data.data
}

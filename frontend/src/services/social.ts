import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'
import type { Dish } from '../types/dish'

export interface UserPublicProfile {
  id: string
  nickname: string | null
  avatar_url: string | null
  follower_count: number
  following_count: number
  visible_dish_count: number
  is_following?: boolean
}

export interface UserCard {
  id: string
  nickname: string | null
  avatar_url: string | null
}

export async function getUserPublicProfile(userId: string): Promise<UserPublicProfile> {
  const res = await request.get<ApiSuccessEnvelope<UserPublicProfile>>(`/users/${userId}/public`)
  return res.data.data
}

export async function getUserDishes(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ dishes: Dish[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<Dish[]>>(`/users/${userId}/dishes`, {
    params: { page, limit },
  })
  const p = res.data.meta.pagination
  if (!p) {
    return { dishes: res.data.data, pagination: { page: 1, limit, total: res.data.data.length } }
  }
  return { dishes: res.data.data, pagination: p }
}

export async function followUser(userId: string): Promise<void> {
  await request.post(`/users/${userId}/follow`)
}

export async function unfollowUser(userId: string): Promise<void> {
  await request.delete(`/users/${userId}/follow`)
}

export async function getFollowers(
  userId: string,
  page = 1,
  limit = 30
): Promise<{ users: UserCard[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<UserCard[]>>(`/users/${userId}/followers`, {
    params: { page, limit },
  })
  const p = res.data.meta.pagination
  if (!p) {
    return { users: res.data.data, pagination: { page: 1, limit, total: res.data.data.length } }
  }
  return { users: res.data.data, pagination: p }
}

export async function getFollowing(
  userId: string,
  page = 1,
  limit = 30
): Promise<{ users: UserCard[]; pagination: { page: number; limit: number; total: number } }> {
  const res = await request.get<ApiSuccessEnvelope<UserCard[]>>(`/users/${userId}/following`, {
    params: { page, limit },
  })
  const p = res.data.meta.pagination
  if (!p) {
    return { users: res.data.data, pagination: { page: 1, limit, total: res.data.data.length } }
  }
  return { users: res.data.data, pagination: p }
}

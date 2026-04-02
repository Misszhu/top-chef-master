import request from '../utils/request'
import type { ApiSuccessEnvelope } from '../types/api-envelope'

export async function recordShare(dishId: string, shareType: string): Promise<{ shareCount: number }> {
  const res = await request.post<ApiSuccessEnvelope<{ shareCount: number }>>('/shares', {
    dishId,
    shareType,
  })
  return res.data.data
}

export async function getShareStats(dishId: string): Promise<{ shareCount: number; viewCount: number }> {
  const res = await request.get<ApiSuccessEnvelope<{ shareCount: number; viewCount: number }>>(
    `/shares/stats/${dishId}`
  )
  return res.data.data
}

import type { AxiosResponse } from 'axios'

/**
 * 与后端 `backend/src/types/api-envelope.ts` 对齐的 JSON 响应类型。
 *
 * Axios 标注示例：
 *   const res = await request.get<ApiSuccessEnvelope<Dish[]>>('/dishes', { params })
 *   return res.data.data
 *
 * 分页列表：
 *   const res = await request.get<ApiSuccessEnvelope<Comment[]>>(...)
 *   const { data, meta } = res.data
 *   const page = meta.pagination
 */

export type ApiMeta = {
  requestId?: string
  ts?: number
  pagination?: { page: number; limit: number; total: number }
} & Record<string, unknown>

export interface ApiSuccessEnvelope<T> {
  statusCode: number
  msg: string
  data: T
  meta: ApiMeta
}

export interface ApiErrorEnvelope {
  statusCode: number
  msg: string
  data: null
  error: {
    code: string
    details: Record<string, unknown>
    requestId?: string
  }
}

/** 成功接口的完整 Axios 响应（`res.data` 为信封） */
export type ApiAxiosResponse<T> = AxiosResponse<ApiSuccessEnvelope<T>>

/** 任意 JSON 解析后可能是错误信封（如 uploadFile 的 body） */
export type ApiParsedBody<T = unknown> = ApiSuccessEnvelope<T> | ApiErrorEnvelope

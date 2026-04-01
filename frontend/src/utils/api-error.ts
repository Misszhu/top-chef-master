/** 避免可选链 ?.，以兼容微信小程序真机旧 JS 引擎 */

import type { ApiErrorEnvelope } from '../types/api-envelope'

/** 与后端 `ApiErrorEnvelope` 一致：错误文案只读顶层 `msg` */

export function getApiErrorMessage(err: any, fallback: string): string {
  if (!err || !err.response || !err.response.data) {
    return fallback
  }
  const d = err.response.data as Partial<ApiErrorEnvelope>
  const m = d.msg
  if (typeof m === 'string' && m) {
    return m
  }
  return fallback
}

export function getApiErrorCode(err: any): string | undefined {
  if (!err || !err.response || !err.response.data) {
    return undefined
  }
  const e = (err.response.data as Partial<ApiErrorEnvelope>).error
  if (!e) {
    return undefined
  }
  const c = e.code
  return typeof c === 'string' ? c : undefined
}

export function isAxiosStatus(err: any, status: number): boolean {
  return !!(err && err.response && err.response.status === status)
}

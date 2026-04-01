/** 与 request 的 API_BASE_URL 对应，去掉 `/api/v1` 得到站点根（用于 uploadFile 等） */
export function getApiOrigin(): string {
  if (typeof API_BASE_URL !== 'string') return ''
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '')
}

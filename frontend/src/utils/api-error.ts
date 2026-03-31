/** 避免可选链 ?.，以兼容微信小程序真机旧 JS 引擎 */

export function getApiErrorMessage(err: any, fallback: string): string {
  if (!err || !err.response || !err.response.data || !err.response.data.error) {
    return fallback
  }
  const m = err.response.data.error.message
  return typeof m === 'string' && m ? m : fallback
}

export function getApiErrorCode(err: any): string | undefined {
  if (!err || !err.response || !err.response.data || !err.response.data.error) {
    return undefined
  }
  const c = err.response.data.error.code
  return typeof c === 'string' ? c : undefined
}

export function isAxiosStatus(err: any, status: number): boolean {
  return !!(err && err.response && err.response.status === status)
}

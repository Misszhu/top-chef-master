/** 本地日历日 YYYY-MM-DD */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayLocal(): string {
  return formatLocalDate(new Date())
}

export function shiftLocalDate(yyyyMmDd: string, deltaDays: number): string {
  const [y, m, d] = yyyyMmDd.split('-').map((x) => parseInt(x, 10))
  const dt = new Date(y, m - 1, d + deltaDays)
  return formatLocalDate(dt)
}

/** 接口可能返回 `YYYY-MM-DD` 或 ISO 字符串；统一成 YYYY-MM-DD（与后端按 UTC 取日历日一致） */
export function toDateOnlyString(raw: string): string {
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

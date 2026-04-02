const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Express 5 中 `req.params` 可能为 `string | string[]` */
export function pickParam(p: string | string[] | undefined): string | undefined {
  if (typeof p === 'string') return p;
  if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
  return undefined;
}

export function isUuid(id: string | undefined): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

/** 与 `GET /api/v1/dishes` 的 `sort` 对齐；未知值回退 `latest`（不 400）。 */
export type DishListSort = 'latest' | 'cooking_time_asc' | 'cooking_time_desc' | 'popular';

const ALLOWED: DishListSort[] = ['latest', 'cooking_time_asc', 'cooking_time_desc', 'popular'];

/** 仅使用白名单片段拼接 ORDER BY，禁止拼接用户原始字符串。 */
const ORDER_SQL: Record<DishListSort, string> = {
  latest: 'd.created_at DESC',
  cooking_time_asc: 'd.cooking_time ASC NULLS LAST, d.created_at DESC',
  cooking_time_desc: 'd.cooking_time DESC NULLS LAST, d.created_at DESC',
  popular: 'd.like_count DESC, d.created_at DESC',
};

export function normalizeDishListSort(raw: string | undefined): DishListSort {
  if (raw && (ALLOWED as string[]).includes(raw)) {
    return raw as DishListSort;
  }
  return 'latest';
}

export function dishListOrderByClause(sort: DishListSort): string {
  return ORDER_SQL[sort];
}

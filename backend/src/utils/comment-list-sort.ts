/** `GET /dishes/:id/comments` 的 `sort`；未知值回退 `latest`。 */
export type CommentListSort = 'latest' | 'popular';

const ALLOWED: CommentListSort[] = ['latest', 'popular'];

const ORDER_SQL: Record<CommentListSort, string> = {
  latest: 'c.created_at DESC',
  popular: 'c.rating DESC NULLS LAST, c.created_at DESC',
};

export function normalizeCommentListSort(raw: string | undefined): CommentListSort {
  if (raw && (ALLOWED as string[]).includes(raw)) {
    return raw as CommentListSort;
  }
  return 'latest';
}

export function commentListOrderByClause(sort: CommentListSort): string {
  return ORDER_SQL[sort];
}

import pool from '../config/database';

const ALLOWED_TYPES = new Set(['wechat_friend', 'wechat_group', 'wechat_timeline', 'qrcode', 'unknown']);

export function normalizeShareType(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return 'unknown';
  const t = raw.trim().toLowerCase();
  return ALLOWED_TYPES.has(t) ? t : 'unknown';
}

export class ShareRepository {
  /** 写入 shares 行并自增 dishes.share_count */
  async recordShare(dishId: string, userId: string, shareType?: string | null): Promise<number> {
    const type = normalizeShareType(shareType);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO shares (dish_id, user_id, share_type) VALUES ($1, $2, $3)',
        [dishId, userId, type]
      );
      const { rows } = await client.query<{ share_count: number }>(
        'UPDATE dishes SET share_count = share_count + 1 WHERE id = $1 AND deleted_at IS NULL RETURNING share_count',
        [dishId]
      );
      await client.query('COMMIT');
      return rows[0]?.share_count ?? 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export const shareRepository = new ShareRepository();

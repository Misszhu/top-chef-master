import pool from '../config/database';
import type { Dish } from '../models/dish.model';

/**
 * 收藏列表：仅返回当前用户仍「按可见性规则」可见的菜谱。
 */
export class FavoriteRepository {
  private applyVisibilityForFavorites(
    conditions: string[],
    values: any[],
    viewerId: string | null,
    paramIndex: number
  ) {
    if (!viewerId) {
      conditions.push(`d.visibility = 'public'`);
      return { paramIndex };
    }

    values.push(viewerId);
    const viewerParam = `$${paramIndex++}`;

    conditions.push(
      `(
        d.visibility = 'public'
        OR d.user_id = ${viewerParam}
        OR (
          d.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = ${viewerParam} AND f.followee_id = d.user_id
          )
        )
      )`
    );

    return { paramIndex };
  }

  async add(userId: string, dishId: string): Promise<void> {
    await pool.query('INSERT INTO favorites (user_id, dish_id) VALUES ($1, $2)', [userId, dishId]);
  }

  async remove(userId: string, dishId: string): Promise<boolean> {
    const r = await pool.query('DELETE FROM favorites WHERE user_id = $1 AND dish_id = $2', [userId, dishId]);
    return (r.rowCount ?? 0) > 0;
  }

  async exists(userId: string, dishId: string): Promise<boolean> {
    const { rows } = await pool.query('SELECT 1 FROM favorites WHERE user_id = $1 AND dish_id = $2 LIMIT 1', [
      userId,
      dishId,
    ]);
    return rows.length > 0;
  }

  async findDishesWithTotal(
    ownerUserId: string,
    viewerId: string | null,
    limit: number,
    offset: number
  ): Promise<{ data: Dish[]; total: number }> {
    const conditions: string[] = ['f.user_id = $1'];
    const values: any[] = [ownerUserId];
    let paramIndex = 2;

    conditions.push('d.deleted_at IS NULL');
    ({ paramIndex } = this.applyVisibilityForFavorites(conditions, values, viewerId, paramIndex));

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM favorites f
      INNER JOIN dishes d ON d.id = f.dish_id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT d.*, u.nickname as user_nickname, u.avatar_url as user_avatar_url
      FROM favorites f
      INNER JOIN dishes d ON d.id = f.dish_id
      LEFT JOIN users u ON u.id = d.user_id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countValues = values.slice();
    const dataValues = values.slice();
    dataValues.push(limit, offset);

    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      pool.query(countQuery, countValues),
      pool.query(dataQuery, dataValues),
    ]);

    return { data: dataRows as Dish[], total: countRows[0]?.total ?? 0 };
  }
}

export const favoriteRepository = new FavoriteRepository();

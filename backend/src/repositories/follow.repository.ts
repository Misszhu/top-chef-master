import pool from '../config/database';
import type { User } from '../models/user.model';

export class FollowRepository {
  async follow(followerId: string, followeeId: string): Promise<void> {
    await pool.query('INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)', [followerId, followeeId]);
  }

  async unfollow(followerId: string, followeeId: string): Promise<boolean> {
    const r = await pool.query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [
      followerId,
      followeeId,
    ]);
    return (r.rowCount ?? 0) > 0;
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const { rows } = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2 LIMIT 1',
      [followerId, followeeId]
    );
    return rows.length > 0;
  }

  async countFollowers(userId: string): Promise<number> {
    const { rows } = await pool.query<{ c: number }>(
      'SELECT COUNT(*)::int AS c FROM follows WHERE followee_id = $1',
      [userId]
    );
    return rows[0]?.c ?? 0;
  }

  async countFollowing(userId: string): Promise<number> {
    const { rows } = await pool.query<{ c: number }>(
      'SELECT COUNT(*)::int AS c FROM follows WHERE follower_id = $1',
      [userId]
    );
    return rows[0]?.c ?? 0;
  }

  async listFollowers(userId: string, limit: number, offset: number): Promise<{ data: User[]; total: number }> {
    const countQ = 'SELECT COUNT(*)::int AS total FROM follows WHERE followee_id = $1';
    const dataQ = `
      SELECT u.*
      FROM follows f
      INNER JOIN users u ON u.id = f.follower_id
      WHERE f.followee_id = $1 AND u.deleted_at IS NULL AND u.status = 'active'
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      pool.query(countQ, [userId]),
      pool.query<User>(dataQ, [userId, limit, offset]),
    ]);
    return { data: dataRows, total: countRows[0]?.total ?? 0 };
  }

  async listFollowing(userId: string, limit: number, offset: number): Promise<{ data: User[]; total: number }> {
    const countQ = 'SELECT COUNT(*)::int AS total FROM follows WHERE follower_id = $1';
    const dataQ = `
      SELECT u.*
      FROM follows f
      INNER JOIN users u ON u.id = f.followee_id
      WHERE f.follower_id = $1 AND u.deleted_at IS NULL AND u.status = 'active'
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      pool.query(countQ, [userId]),
      pool.query<User>(dataQ, [userId, limit, offset]),
    ]);
    return { data: dataRows, total: countRows[0]?.total ?? 0 };
  }
}

export const followRepository = new FollowRepository();

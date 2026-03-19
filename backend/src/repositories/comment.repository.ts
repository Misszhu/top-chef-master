import pool from '../config/database';
import type { Comment, CommentCreateDTO, CommentUpdateDTO } from '../models/comment.model';

export class CommentRepository {
  async findByDishIdWithTotal(dishId: string, limit: number, offset: number) {
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM comments c
      WHERE c.dish_id = $1 AND c.deleted_at IS NULL
    `;

    const dataQuery = `
      SELECT c.*, u.nickname AS user_nickname, u.avatar_url AS user_avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.dish_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
      pool.query(countQuery, [dishId]),
      pool.query<Comment>(dataQuery, [dishId, limit, offset]),
    ]);

    return { data: dataRows, total: countRows[0]?.total ?? 0 };
  }

  async findById(id: string): Promise<Comment | null> {
    const query = `
      SELECT c.*, u.nickname AS user_nickname, u.avatar_url AS user_avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    const { rows } = await pool.query<Comment>(query, [id]);
    return rows[0] || null;
  }

  async upsertForDish(dishId: string, userId: string, dto: CommentCreateDTO): Promise<Comment> {
    // “一人一菜一条评论”：若存在则更新，否则插入
    const query = `
      INSERT INTO comments (dish_id, user_id, content, rating)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (dish_id, user_id)
      DO UPDATE SET content = EXCLUDED.content, rating = EXCLUDED.rating, updated_at = NOW(), deleted_at = NULL
      RETURNING *
    `;
    const { rows } = await pool.query<Comment>(query, [dishId, userId, dto.content, dto.rating ?? null]);
    return rows[0];
  }

  async updateById(id: string, userId: string, dto: CommentUpdateDTO): Promise<Comment | null> {
    const query = `
      UPDATE comments
      SET content = COALESCE($1, content),
          rating = COALESCE($2, rating),
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
      RETURNING *
    `;
    const { rows } = await pool.query<Comment>(query, [dto.content ?? null, dto.rating ?? null, id, userId]);
    return rows[0] || null;
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const query = `UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const commentRepository = new CommentRepository();


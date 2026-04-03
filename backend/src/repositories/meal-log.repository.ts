import pool from '../config/database';
import { MealLogEntryRow, MealLogEntryWithDishImage, MealSlot } from '../models/meal-log.model';

export class MealLogRepository {
  private baseSelectJoin = `
    SELECT m.*, d.image_url AS dish_image_url
    FROM meal_log_entries m
    LEFT JOIN dishes d ON d.id = m.dish_id AND d.deleted_at IS NULL
  `;

  async listByUser(
    userId: string,
    fromDate: string,
    toDate: string,
    limit: number,
    offset: number
  ): Promise<{ data: MealLogEntryWithDishImage[]; total: number }> {
    const where = `m.user_id = $1 AND m.deleted_at IS NULL
      AND m.eaten_date >= $2::date AND m.eaten_date <= $3::date`;
    const countQ = `SELECT COUNT(*)::int AS total FROM meal_log_entries m WHERE ${where}`;
    const dataQ = `${this.baseSelectJoin}
      WHERE ${where}
      ORDER BY m.eaten_date DESC, m.created_at DESC
      LIMIT $4 OFFSET $5`;
    const [{ rows: countRows }, { rows }] = await Promise.all([
      pool.query(countQ, [userId, fromDate, toDate]),
      pool.query<MealLogEntryWithDishImage>(dataQ, [userId, fromDate, toDate, limit, offset]),
    ]);
    return { data: rows, total: countRows[0]?.total ?? 0 };
  }

  async findByIdForOwner(id: string, userId: string): Promise<MealLogEntryWithDishImage | null> {
    const { rows } = await pool.query<MealLogEntryWithDishImage>(
      `${this.baseSelectJoin}
       WHERE m.id = $1 AND m.user_id = $2 AND m.deleted_at IS NULL`,
      [id, userId]
    );
    return rows[0] ?? null;
  }

  async countOnDate(userId: string, eatenDate: string): Promise<number> {
    const { rows } = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM meal_log_entries
       WHERE user_id = $1 AND eaten_date = $2::date AND deleted_at IS NULL`,
      [userId, eatenDate]
    );
    return rows[0]?.c ?? 0;
  }

  async create(row: {
    user_id: string;
    eaten_date: string;
    meal_slot: MealSlot | null;
    dish_id: string | null;
    title: string;
    notes: string | null;
  }): Promise<MealLogEntryRow> {
    const { rows } = await pool.query<MealLogEntryRow>(
      `INSERT INTO meal_log_entries
        (user_id, eaten_date, meal_slot, dish_id, title, notes)
       VALUES ($1, $2::date, $3, $4, $5, $6)
       RETURNING *`,
      [row.user_id, row.eaten_date, row.meal_slot, row.dish_id, row.title, row.notes]
    );
    return rows[0];
  }

  async update(
    id: string,
    userId: string,
    ifMatchVersion: number,
    patch: {
      eaten_date?: string;
      meal_slot?: MealSlot | null;
      dish_id?: string | null;
      title?: string;
      notes?: string | null;
    }
  ): Promise<MealLogEntryRow | null> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let p = 1;
    if (patch.eaten_date !== undefined) {
      sets.push(`eaten_date = $${p++}::date`);
      vals.push(patch.eaten_date);
    }
    if (patch.meal_slot !== undefined) {
      sets.push(`meal_slot = $${p++}`);
      vals.push(patch.meal_slot);
    }
    if (patch.dish_id !== undefined) {
      sets.push(`dish_id = $${p++}`);
      vals.push(patch.dish_id);
    }
    if (patch.title !== undefined) {
      sets.push(`title = $${p++}`);
      vals.push(patch.title);
    }
    if (patch.notes !== undefined) {
      sets.push(`notes = $${p++}`);
      vals.push(patch.notes);
    }
    if (sets.length === 0) {
      return null;
    }
    sets.push(`version = version + 1`);
    sets.push(`updated_at = NOW()`);
    vals.push(id, userId, ifMatchVersion);
    const q = `
      UPDATE meal_log_entries SET ${sets.join(', ')}
      WHERE id = $${p++} AND user_id = $${p++} AND version = $${p++} AND deleted_at IS NULL
      RETURNING *`;
    const { rows } = await pool.query<MealLogEntryRow>(q, vals);
    return rows[0] ?? null;
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE meal_log_entries SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  async getSnapshot(id: string, userId: string): Promise<Record<string, unknown> | null> {
    const row = await this.findByIdForOwner(id, userId);
    return row ? { ...row } : null;
  }
}

export const mealLogRepository = new MealLogRepository();

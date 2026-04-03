import pool from '../config/database';
import { ShoppingListItemRow, ShoppingListListRow, ShoppingListRow } from '../models/shopping-list.model';

export type ShoppingItemInsert = {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  notes: string | null;
  sequence: number;
};

export class ShoppingListRepository {
  async create(userId: string, menuId: string | null): Promise<ShoppingListRow> {
    const { rows } = await pool.query<ShoppingListRow>(
      `INSERT INTO shopping_lists (user_id, menu_id) VALUES ($1, $2) RETURNING *`,
      [userId, menuId]
    );
    return rows[0];
  }

  async findByIdForOwner(listId: string, userId: string): Promise<ShoppingListRow | null> {
    const { rows } = await pool.query<ShoppingListRow>(
      `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2`,
      [listId, userId]
    );
    return rows[0] ?? null;
  }

  async findItems(listId: string): Promise<ShoppingListItemRow[]> {
    const { rows } = await pool.query<ShoppingListItemRow>(
      `SELECT * FROM shopping_list_items WHERE shopping_list_id = $1
       ORDER BY sequence ASC NULLS LAST, ingredient_name ASC`,
      [listId]
    );
    return rows;
  }

  async listByUser(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ data: ShoppingListListRow[]; total: number }> {
    const countQ = `SELECT COUNT(*)::int AS total FROM shopping_lists WHERE user_id = $1`;
    const dataQ = `
      SELECT sl.*,
        m.name AS menu_name,
        (SELECT COUNT(*)::int FROM shopping_list_items sli WHERE sli.shopping_list_id = sl.id) AS item_count
      FROM shopping_lists sl
      LEFT JOIN menus m ON m.id = sl.menu_id AND m.deleted_at IS NULL
      WHERE sl.user_id = $1
      ORDER BY sl.updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    const [{ rows: countRows }, { rows }] = await Promise.all([
      pool.query(countQ, [userId]),
      pool.query<ShoppingListListRow>(dataQ, [userId, limit, offset]),
    ]);
    return { data: rows, total: countRows[0]?.total ?? 0 };
  }

  async updateMetaFields(
    listId: string,
    userId: string,
    patch: { estimated_cost?: number | null },
    ifMatchVersion: number
  ): Promise<ShoppingListRow | null> {
    if (patch.estimated_cost === undefined) {
      return null;
    }
    const { rows } = await pool.query<ShoppingListRow>(
      `UPDATE shopping_lists SET
        estimated_cost = $1,
        version = version + 1,
        updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND version = $4
       RETURNING *`,
      [patch.estimated_cost, listId, userId, ifMatchVersion]
    );
    return rows[0] ?? null;
  }

  async deleteList(listId: string, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM shopping_lists WHERE id = $1 AND user_id = $2`, [
      listId,
      userId,
    ]);
    return (rowCount ?? 0) > 0;
  }

  /** 事务：清空条目、写入新行、更新 menu_id、version+1 */
  async replaceItemsFromMenu(
    listId: string,
    userId: string,
    menuId: string | null,
    items: ShoppingItemInsert[]
  ): Promise<ShoppingListRow> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: lockRows } = await client.query<ShoppingListRow>(
        `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [listId, userId]
      );
      if (!lockRows[0]) {
        await client.query('ROLLBACK');
        throw new Error('LIST_NOT_FOUND');
      }
      await client.query(`DELETE FROM shopping_list_items WHERE shopping_list_id = $1`, [listId]);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const seq = it.sequence ?? i;
        await client.query(
          `INSERT INTO shopping_list_items
            (shopping_list_id, ingredient_name, quantity, unit, category, is_checked, notes, sequence)
           VALUES ($1, $2, $3, $4, $5, false, $6, $7)`,
          [
            listId,
            it.ingredient_name.slice(0, 100),
            it.quantity,
            it.unit ? it.unit.slice(0, 20) : null,
            it.category ? it.category.slice(0, 50) : null,
            it.notes,
            seq,
          ]
        );
      }
      const { rows: upRows } = await client.query<ShoppingListRow>(
        `UPDATE shopping_lists SET
          menu_id = COALESCE($2, menu_id),
          version = version + 1,
          updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [listId, menuId]
      );
      await client.query('COMMIT');
      return upRows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async bumpVersionOnly(listId: string, userId: string): Promise<number> {
    const { rows } = await pool.query<{ version: number }>(
      `UPDATE shopping_lists SET version = version + 1, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING version`,
      [listId, userId]
    );
    return rows[0]?.version ?? 0;
  }

  async addItem(
    listId: string,
    userId: string,
    row: Omit<ShoppingItemInsert, 'sequence'> & { sequence?: number }
  ): Promise<{ item: ShoppingListItemRow; version: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: lr } = await client.query<ShoppingListRow>(
        `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [listId, userId]
      );
      if (!lr[0]) {
        await client.query('ROLLBACK');
        throw new Error('LIST_NOT_FOUND');
      }
      const { rows: maxSeq } = await client.query<{ m: number }>(
        `SELECT COALESCE(MAX(sequence), -1) + 1 AS m FROM shopping_list_items WHERE shopping_list_id = $1`,
        [listId]
      );
      const sequence = row.sequence ?? maxSeq[0]?.m ?? 0;
      const { rows: ins } = await client.query<ShoppingListItemRow>(
        `INSERT INTO shopping_list_items
          (shopping_list_id, ingredient_name, quantity, unit, category, is_checked, notes, sequence)
         VALUES ($1, $2, $3, $4, $5, false, $6, $7)
         RETURNING *`,
        [
          listId,
          row.ingredient_name.slice(0, 100),
          row.quantity,
          row.unit ? row.unit.slice(0, 20) : null,
          row.category ? row.category.slice(0, 50) : null,
          row.notes,
          sequence,
        ]
      );
      const { rows: vr } = await client.query<{ version: number }>(
        `UPDATE shopping_lists SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [listId]
      );
      await client.query('COMMIT');
      return { item: ins[0], version: vr[0].version };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateItem(
    listId: string,
    userId: string,
    itemId: string,
    patch: { is_checked?: boolean; quantity?: number | null; notes?: string | null }
  ): Promise<{ item: ShoppingListItemRow | null; version: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: lr } = await client.query<ShoppingListRow>(
        `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [listId, userId]
      );
      if (!lr[0]) {
        await client.query('ROLLBACK');
        throw new Error('LIST_NOT_FOUND');
      }
      const sets: string[] = [];
      const vals: unknown[] = [];
      let p = 1;
      if (patch.is_checked !== undefined) {
        sets.push(`is_checked = $${p++}`);
        vals.push(patch.is_checked);
      }
      if (patch.quantity !== undefined) {
        sets.push(`quantity = $${p++}`);
        vals.push(patch.quantity);
      }
      if (patch.notes !== undefined) {
        sets.push(`notes = $${p++}`);
        vals.push(patch.notes);
      }
      if (sets.length === 0) {
        await client.query('ROLLBACK');
        return { item: null, version: lr[0].version };
      }
      sets.push(`updated_at = NOW()`);
      const idP = p++;
      const listP = p++;
      vals.push(itemId, listId);
      const q = `
        UPDATE shopping_list_items sli SET ${sets.join(', ')}
        WHERE sli.id = $${idP} AND sli.shopping_list_id = $${listP}
        RETURNING sli.*`;
      const { rows: ir } = await client.query<ShoppingListItemRow>(q, vals);
      const { rows: vr } = await client.query<{ version: number }>(
        `UPDATE shopping_lists SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [listId]
      );
      await client.query('COMMIT');
      return { item: ir[0] ?? null, version: vr[0].version };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async deleteItem(listId: string, userId: string, itemId: string): Promise<{ ok: boolean; version: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: lr } = await client.query<ShoppingListRow>(
        `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [listId, userId]
      );
      if (!lr[0]) {
        await client.query('ROLLBACK');
        throw new Error('LIST_NOT_FOUND');
      }
      const { rowCount } = await client.query(
        `DELETE FROM shopping_list_items WHERE id = $1 AND shopping_list_id = $2`,
        [itemId, listId]
      );
      const { rows: vr } = await client.query<{ version: number }>(
        `UPDATE shopping_lists SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [listId]
      );
      await client.query('COMMIT');
      return { ok: (rowCount ?? 0) > 0, version: vr[0].version };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getSnapshot(listId: string, userId: string): Promise<Record<string, unknown> | null> {
    const list = await this.findByIdForOwner(listId, userId);
    if (!list) return null;
    const items = await this.findItems(listId);
    return { ...list, items };
  }
}

export const shoppingListRepository = new ShoppingListRepository();

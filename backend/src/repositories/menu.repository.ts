import pool from '../config/database';
import {
  MAX_ITEMS_PER_MENU,
  MenuCreateDTO,
  MenuItemRow,
  MenuListRow,
  MenuRow,
  MenuUpdateDTO,
} from '../models/menu.model';

export class MenuRepository {
  async countByUser(userId: string): Promise<number> {
    const { rows } = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM menus WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return rows[0]?.c ?? 0;
  }

  async findListByUser(
    userId: string,
    limit: number,
    offset: number,
    sort: 'latest' | 'created'
  ): Promise<{ data: MenuListRow[]; total: number }> {
    const order =
      sort === 'created' ? 'm.created_at DESC' : 'm.updated_at DESC';
    const countQ = `SELECT COUNT(*)::int AS total FROM menus m WHERE m.user_id = $1 AND m.deleted_at IS NULL`;
    const dataQ = `
      SELECT m.*,
        (SELECT COUNT(*)::int FROM menu_items mi WHERE mi.menu_id = m.id) AS item_count
      FROM menus m
      WHERE m.user_id = $1 AND m.deleted_at IS NULL
      ORDER BY ${order}
      LIMIT $2 OFFSET $3
    `;
    const [{ rows: countRows }, { rows }] = await Promise.all([
      pool.query(countQ, [userId]),
      pool.query<MenuListRow>(dataQ, [userId, limit, offset]),
    ]);
    return { data: rows, total: countRows[0]?.total ?? 0 };
  }

  async findByIdOwned(menuId: string, userId: string): Promise<MenuRow | null> {
    const { rows } = await pool.query<MenuRow>(
      `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [menuId, userId]
    );
    return rows[0] ?? null;
  }

  async findItemsWithDishes(menuId: string): Promise<MenuItemRow[]> {
    const { rows } = await pool.query<MenuItemRow>(
      `SELECT mi.id, mi.menu_id, mi.dish_id, mi.servings, mi.notes, mi.sequence, mi.created_at,
        d.name AS dish_name, d.image_url AS dish_image_url, d.cooking_time AS dish_cooking_time,
        d.difficulty AS dish_difficulty
       FROM menu_items mi
       INNER JOIN dishes d ON d.id = mi.dish_id AND d.deleted_at IS NULL
       WHERE mi.menu_id = $1
       ORDER BY mi.sequence ASC NULLS LAST, mi.created_at ASC`,
      [menuId]
    );
    return rows;
  }

  async create(userId: string, dto: MenuCreateDTO): Promise<MenuRow> {
    const tags = Array.isArray(dto.tags) ? dto.tags : [];
    const { rows } = await pool.query<MenuRow>(
      `INSERT INTO menus (user_id, name, description, tags, cover_image_url)
       VALUES ($1, $2, $3, $4::text[], $5)
       RETURNING *`,
      [userId, dto.name, dto.description ?? null, tags, dto.cover_image_url ?? null]
    );
    return rows[0];
  }

  async update(
    menuId: string,
    userId: string,
    dto: MenuUpdateDTO,
    ifMatchVersion: number
  ): Promise<MenuRow | null> {
    const { rows } = await pool.query<MenuRow>(
      `UPDATE menus SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        tags = COALESCE($3, tags),
        cover_image_url = COALESCE($4, cover_image_url),
        version = version + 1,
        updated_at = NOW()
       WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL AND version = $7
       RETURNING *`,
      [
        dto.name ?? null,
        dto.description ?? null,
        dto.tags ?? null,
        dto.cover_image_url ?? null,
        menuId,
        userId,
        ifMatchVersion,
      ]
    );
    return rows[0] ?? null;
  }

  async softDelete(menuId: string, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE menus SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [menuId, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  /** 复制菜单及全部菜品行（新 id、新 menu_items id） */
  async copyMenu(sourceMenuId: string, userId: string, newName: string): Promise<MenuRow> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: srcRows } = await client.query<MenuRow>(
        `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [sourceMenuId, userId]
      );
      const src = srcRows[0];
      if (!src) {
        await client.query('ROLLBACK');
        throw new Error('SOURCE_NOT_FOUND');
      }
      const { rows: newMenuRows } = await client.query<MenuRow>(
        `INSERT INTO menus (user_id, name, description, tags, cover_image_url, is_public, version)
         VALUES ($1, $2, $3, $4, $5, false, 1)
         RETURNING *`,
        [userId, newName, src.description, src.tags, src.cover_image_url]
      );
      const newMenu = newMenuRows[0];
      await client.query(
        `INSERT INTO menu_items (menu_id, dish_id, servings, notes, sequence)
         SELECT $1, dish_id, servings, notes, sequence FROM menu_items WHERE menu_id = $2`,
        [newMenu.id, sourceMenuId]
      );
      await client.query('COMMIT');
      return newMenu;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async addItem(
    menuId: string,
    userId: string,
    dishId: string,
    servings: number,
    notes: string | null
  ): Promise<{ item: MenuItemRow; menuVersion: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: mRows } = await client.query<MenuRow>(
        `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [menuId, userId]
      );
      if (!mRows[0]) {
        await client.query('ROLLBACK');
        throw new Error('MENU_NOT_FOUND');
      }
      const { rows: cRows } = await client.query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM menu_items WHERE menu_id = $1`,
        [menuId]
      );
      if ((cRows[0]?.c ?? 0) >= MAX_ITEMS_PER_MENU) {
        await client.query('ROLLBACK');
        throw new Error('MENU_ITEMS_LIMIT');
      }
      const { rows: insRows } = await client.query<MenuItemRow>(
        `INSERT INTO menu_items (menu_id, dish_id, servings, notes, sequence)
         VALUES (
           $1, $2, $3, $4,
           (SELECT COALESCE(MAX(sequence), -1) + 1 FROM menu_items WHERE menu_id = $1)
         )
         RETURNING id, menu_id, dish_id, servings, notes, sequence, created_at`,
        [menuId, dishId, servings, notes]
      );
      const { rows: vRows } = await client.query<{ version: number }>(
        `UPDATE menus SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [menuId]
      );
      await client.query('COMMIT');
      return { item: insRows[0], menuVersion: vRows[0].version };
    } catch (e: any) {
      await client.query('ROLLBACK');
      if (e?.code === '23505') {
        throw new Error('DUPLICATE_MENU_ITEM');
      }
      throw e;
    } finally {
      client.release();
    }
  }

  async updateItemFields(
    menuId: string,
    userId: string,
    itemId: string,
    patch: { servings?: number; notes?: string | null; sequence?: number | null }
  ): Promise<{ item: MenuItemRow | null; menuVersion: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: mRows } = await client.query<MenuRow>(
        `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [menuId, userId]
      );
      if (!mRows[0]) {
        await client.query('ROLLBACK');
        throw new Error('MENU_NOT_FOUND');
      }
      const sets: string[] = [];
      const vals: unknown[] = [];
      let p = 1;
      if (patch.servings !== undefined) {
        sets.push(`servings = $${p++}`);
        vals.push(patch.servings);
      }
      if (patch.notes !== undefined) {
        sets.push(`notes = $${p++}`);
        vals.push(patch.notes);
      }
      if (patch.sequence !== undefined) {
        sets.push(`sequence = $${p++}`);
        vals.push(patch.sequence);
      }
      if (sets.length === 0) {
        await client.query('ROLLBACK');
        return { item: null, menuVersion: mRows[0].version };
      }
      const idP = p++;
      const menuP = p++;
      const userP = p;
      vals.push(itemId, menuId, userId);
      const q = `
        UPDATE menu_items mi SET ${sets.join(', ')}
        FROM menus m
        WHERE mi.id = $${idP} AND mi.menu_id = $${menuP} AND m.id = mi.menu_id AND m.user_id = $${userP} AND m.deleted_at IS NULL
        RETURNING mi.id, mi.menu_id, mi.dish_id, mi.servings, mi.notes, mi.sequence, mi.created_at`;
      const { rows: itemRows } = await client.query<MenuItemRow>(q, vals);
      const item = itemRows[0] ?? null;
      if (!item) {
        await client.query('ROLLBACK');
        return { item: null, menuVersion: mRows[0].version };
      }
      const { rows: vRows } = await client.query<{ version: number }>(
        `UPDATE menus SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [menuId]
      );
      await client.query('COMMIT');
      return { item, menuVersion: vRows[0].version };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async deleteItem(menuId: string, userId: string, itemId: string): Promise<{ ok: boolean; menuVersion: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: mRows } = await client.query<MenuRow>(
        `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [menuId, userId]
      );
      if (!mRows[0]) {
        await client.query('ROLLBACK');
        throw new Error('MENU_NOT_FOUND');
      }
      const { rowCount } = await client.query(
        `DELETE FROM menu_items mi USING menus m
         WHERE mi.id = $1 AND mi.menu_id = $2 AND m.id = mi.menu_id AND m.user_id = $3`,
        [itemId, menuId, userId]
      );
      const { rows: vRows } = await client.query<{ version: number }>(
        `UPDATE menus SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [menuId]
      );
      await client.query('COMMIT');
      return { ok: (rowCount ?? 0) > 0, menuVersion: vRows[0].version };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async reorderItems(menuId: string, userId: string, orderedItemIds: string[]): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: mRows } = await client.query<MenuRow>(
        `SELECT * FROM menus WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [menuId, userId]
      );
      if (!mRows[0]) {
        await client.query('ROLLBACK');
        throw new Error('MENU_NOT_FOUND');
      }
      const { rows: existing } = await client.query<{ id: string }>(
        `SELECT id FROM menu_items WHERE menu_id = $1`,
        [menuId]
      );
      const existingSet = new Set(existing.map((r) => r.id));
      if (existingSet.size !== orderedItemIds.length || !orderedItemIds.every((id) => existingSet.has(id))) {
        await client.query('ROLLBACK');
        throw new Error('REORDER_MISMATCH');
      }
      for (let ord = 0; ord < orderedItemIds.length; ord++) {
        await client.query(`UPDATE menu_items SET sequence = $1 WHERE id = $2 AND menu_id = $3`, [
          ord,
          orderedItemIds[ord],
          menuId,
        ]);
      }
      const { rows: vRows } = await client.query<{ version: number }>(
        `UPDATE menus SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING version`,
        [menuId]
      );
      await client.query('COMMIT');
      return vRows[0].version;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getDetailSnapshot(menuId: string, userId: string): Promise<Record<string, unknown> | null> {
    const menu = await this.findByIdOwned(menuId, userId);
    if (!menu) return null;
    const items = await this.findItemsWithDishes(menuId);
    return { ...menu, dishes: items.map(formatItemForApi) };
  }
}

function formatItemForApi(row: MenuItemRow) {
  return {
    id: row.id,
    dish_id: row.dish_id,
    servings: row.servings,
    notes: row.notes,
    sequence: row.sequence,
    created_at: row.created_at,
    dish_name: row.dish_name,
    dish_image_url: row.dish_image_url,
    dish_cooking_time: row.dish_cooking_time,
    dish_difficulty: row.dish_difficulty,
  };
}

export const menuRepository = new MenuRepository();

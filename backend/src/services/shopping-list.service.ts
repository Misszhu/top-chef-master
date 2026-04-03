import pool from '../config/database';
import { menuRepository } from '../repositories/menu.repository';
import { dishRepository } from '../repositories/dish.repository';
import {
  shoppingListRepository,
  ShoppingItemInsert,
} from '../repositories/shopping-list.repository';
import { ApiError } from '../utils/api-error';
import { isUuid } from '../utils/uuid';

const CATEGORY_ORDER = ['蔬菜', '肉类', '调料', '其他'];

function guessCategory(name: string): string {
  const n = name.trim();
  if (/菜|茄|椒|笋|菇|豆|葱|蒜|姜|芹|菠|莴|瓜|藕|薯|萝卜|玉米|白菜|青菜|土豆|番茄|西红柿/i.test(n)) return '蔬菜';
  if (/肉|鸡|鸭|鱼|虾|蟹|贝|排|腱|五花|里脊|蛋|牛|羊|猪|海鲜/i.test(n)) return '肉类';
  if (/盐|糖|酱|油|醋|料酒|粉|八角|桂皮|孜然|胡椒|味精|生抽|老抽|蚝油|淀粉/i.test(n)) return '调料';
  return '其他';
}

function normName(s: string): string {
  return s.trim().toLowerCase();
}

function normUnit(u: string | null | undefined): string {
  return (u || '').trim().toLowerCase();
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

type Agg = {
  displayName: string;
  unitDisplay: string | null;
  sum: number;
  hasNull: boolean;
  category: string;
  notes: string[];
};

/** 从菜单合并食材：同「食材名 + 单位」数量相加 */
export async function buildMergedItemsFromMenu(menuId: string, ownerUserId: string): Promise<ShoppingItemInsert[]> {
  const menu = await menuRepository.findByIdOwned(menuId, ownerUserId);
  if (!menu) {
    throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
  }

  const { rows } = await pool.query<{
    dish_id: string;
    menu_servings: string | number;
    dish_servings: number | null;
    name: string | null;
    quantity: unknown;
    unit: unknown;
    note: unknown;
  }>(
    `SELECT mi.dish_id,
            mi.servings AS menu_servings,
            d.servings AS dish_servings,
            i.name,
            i.quantity,
            i.unit,
            i.note
     FROM menu_items mi
     INNER JOIN dishes d ON d.id = mi.dish_id AND d.deleted_at IS NULL
     LEFT JOIN ingredients i ON i.dish_id = d.id
     WHERE mi.menu_id = $1
     ORDER BY mi.sequence ASC NULLS LAST, mi.created_at ASC, i.sequence ASC NULLS LAST, i.created_at ASC`,
    [menuId]
  );

  const map = new Map<string, Agg>();
  const dishVisible = new Map<string, boolean>();
  const ensureVisible = async (dishId: string) => {
    if (!dishVisible.has(dishId)) {
      const d = await dishRepository.findVisibleById(dishId, ownerUserId);
      dishVisible.set(dishId, !!d);
    }
    return dishVisible.get(dishId);
  };

  for (const r of rows) {
    if (!r.name || !String(r.name).trim()) continue;

    if (!(await ensureVisible(r.dish_id))) continue;

    const dishBase = parseNum(r.dish_servings);
    const base = dishBase !== null && dishBase > 0 ? dishBase : 1;
    const menuPortion = parseNum(r.menu_servings);
    const factor = (menuPortion !== null && menuPortion > 0 ? menuPortion : 1) / base;

    const baseQty = parseNum(r.quantity);
    const contrib = baseQty !== null ? baseQty * factor : null;

    const displayName = String(r.name).trim();
    const unitRaw = r.unit != null && String(r.unit).trim() ? String(r.unit).trim() : '';
    const key = `${normName(displayName)}|${normUnit(unitRaw)}`;
    const noteStr = r.note != null && String(r.note).trim() ? String(r.note).trim() : '';

    let agg = map.get(key);
    if (!agg) {
      agg = {
        displayName,
        unitDisplay: unitRaw || null,
        sum: 0,
        hasNull: false,
        category: guessCategory(displayName),
        notes: [],
      };
      map.set(key, agg);
    }
    if (contrib === null) {
      agg.hasNull = true;
    } else {
      agg.sum += contrib;
    }
    if (noteStr && !agg.notes.includes(noteStr)) {
      agg.notes.push(noteStr);
    }
  }

  const merged: ShoppingItemInsert[] = [];
  for (const agg of map.values()) {
    let qty: number | null;
    if (agg.hasNull && agg.sum === 0) {
      qty = null;
    } else if (agg.hasNull) {
      qty = null;
    } else {
      qty = Math.round(agg.sum * 1000) / 1000;
    }
    merged.push({
      ingredient_name: agg.displayName.slice(0, 100),
      quantity: qty,
      unit: agg.unitDisplay ? agg.unitDisplay.slice(0, 20) : null,
      category: agg.category,
      notes: agg.notes.length ? agg.notes.join('；').slice(0, 500) : null,
      sequence: 0,
    });
  }

  merged.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category || '其他');
    const cb = CATEGORY_ORDER.indexOf(b.category || '其他');
    if (ca !== cb) return ca - cb;
    return a.ingredient_name.localeCompare(b.ingredient_name, 'zh-Hans-CN');
  });
  merged.forEach((m, i) => {
    m.sequence = i;
  });

  return merged;
}

export class ShoppingListService {
  async list(userId: string, page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;
    return shoppingListRepository.listByUser(userId, safeLimit, offset);
  }

  async getById(listId: string, userId: string) {
    const list = await shoppingListRepository.findByIdForOwner(listId, userId);
    if (!list) {
      throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
    }
    const items = await shoppingListRepository.findItems(listId);
    let menu_name: string | null = null;
    if (list.menu_id) {
      const m = await menuRepository.findByIdOwned(list.menu_id, userId);
      menu_name = m?.name ?? null;
    }
    return { ...list, items, menu_name };
  }

  async create(userId: string, menuId?: string | null) {
    const normalizedMenuId = menuId && isUuid(menuId) ? menuId : null;
    const list = await shoppingListRepository.create(userId, normalizedMenuId);
    if (normalizedMenuId) {
      const items = await buildMergedItemsFromMenu(normalizedMenuId, userId);
      const updated = await shoppingListRepository.replaceItemsFromMenu(list.id, userId, normalizedMenuId, items);
      const fullItems = await shoppingListRepository.findItems(list.id);
      let menu_name: string | null = null;
      const m = await menuRepository.findByIdOwned(normalizedMenuId, userId);
      menu_name = m?.name ?? null;
      return { ...updated, items: fullItems, menu_name };
    }
    return { ...list, items: [] as Awaited<ReturnType<typeof shoppingListRepository.findItems>>, menu_name: null as string | null };
  }

  async updateMeta(listId: string, userId: string, body: { estimated_cost?: number | null; ifMatchVersion?: number }) {
    const v = body.ifMatchVersion;
    if (v === undefined || typeof v !== 'number' || Number.isNaN(v)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供有效的 ifMatchVersion');
    }
    if (body.estimated_cost === undefined) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供 estimated_cost（可为 null）');
    }
    const updated = await shoppingListRepository.updateMetaFields(
      listId,
      userId,
      { estimated_cost: body.estimated_cost },
      v
    );
    if (!updated) {
      const snap = await shoppingListRepository.getSnapshot(listId, userId);
      throw new ApiError(409, 'VERSION_CONFLICT', '清单已在其他端更新，请刷新后重试', {
        resource: 'shopping_list',
        id: listId,
        serverVersion: snap && (snap as { version?: number }).version,
        serverSnapshot: snap,
      });
    }
    const items = await shoppingListRepository.findItems(listId);
    let menu_name: string | null = null;
    if (updated.menu_id) {
      const m = await menuRepository.findByIdOwned(updated.menu_id, userId);
      menu_name = m?.name ?? null;
    }
    return { ...updated, items, menu_name };
  }

  async deleteList(listId: string, userId: string) {
    const ok = await shoppingListRepository.deleteList(listId, userId);
    if (!ok) {
      throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
    }
  }

  async fromMenu(listId: string, userId: string, menuId: string) {
    const list = await shoppingListRepository.findByIdForOwner(listId, userId);
    if (!list) {
      throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
    }
    const items = await buildMergedItemsFromMenu(menuId, userId);
    const updated = await shoppingListRepository.replaceItemsFromMenu(listId, userId, menuId, items);
    const fullItems = await shoppingListRepository.findItems(listId);
    const m = await menuRepository.findByIdOwned(menuId, userId);
    return { ...updated, items: fullItems, menu_name: m?.name ?? null };
  }

  async addItem(
    listId: string,
    userId: string,
    body: { ingredient_name: string; quantity?: number | null; unit?: string | null; category?: string | null; notes?: string | null }
  ) {
    const name = typeof body.ingredient_name === 'string' ? body.ingredient_name.trim() : '';
    if (!name) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'ingredient_name 不能为空');
    }
    try {
      const { item, version } = await shoppingListRepository.addItem(listId, userId, {
        ingredient_name: name,
        quantity: body.quantity !== undefined ? body.quantity : null,
        unit: body.unit ?? null,
        category: body.category ?? guessCategory(name),
        notes: body.notes ?? null,
      });
      const list = await shoppingListRepository.findByIdForOwner(listId, userId);
      const items = await shoppingListRepository.findItems(listId);
      return { item, list_version: version, items, list };
    } catch (e: any) {
      if (e?.message === 'LIST_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
      }
      throw e;
    }
  }

  async updateItem(
    listId: string,
    userId: string,
    itemId: string,
    body: { is_checked?: boolean; quantity?: number | null; notes?: string | null }
  ) {
    try {
      const { item, version } = await shoppingListRepository.updateItem(listId, userId, itemId, {
        is_checked: body.is_checked,
        quantity: body.quantity,
        notes: body.notes,
      });
      if (!item) {
        throw new ApiError(404, 'NOT_FOUND', '条目不存在');
      }
      const items = await shoppingListRepository.findItems(listId);
      return { item, list_version: version, items };
    } catch (e: any) {
      if (e?.message === 'LIST_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
      }
      throw e;
    }
  }

  async deleteItem(listId: string, userId: string, itemId: string) {
    try {
      const { ok, version } = await shoppingListRepository.deleteItem(listId, userId, itemId);
      if (!ok) {
        throw new ApiError(404, 'NOT_FOUND', '条目不存在');
      }
      const items = await shoppingListRepository.findItems(listId);
      return { list_version: version, items };
    } catch (e: any) {
      if (e?.message === 'LIST_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '购物清单不存在');
      }
      throw e;
    }
  }
}

export const shoppingListService = new ShoppingListService();

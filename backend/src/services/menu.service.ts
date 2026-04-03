import {
  MAX_MENU_NAME_LENGTH,
  MAX_MENUS_PER_USER,
  MenuCreateDTO,
  MenuItemRow,
  MenuUpdateDTO,
} from '../models/menu.model';
import { menuRepository } from '../repositories/menu.repository';
import { dishRepository } from '../repositories/dish.repository';
import { ApiError } from '../utils/api-error';

function normalizeMenuName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

function assertMenuName(name: string): void {
  if (name.length < 1 || name.length > MAX_MENU_NAME_LENGTH) {
    throw new ApiError(400, 'VALIDATION_ERROR', `菜单名称长度需在 1～${MAX_MENU_NAME_LENGTH} 字符`);
  }
}

function formatMenuDetail(menu: Record<string, unknown>, items: ReturnType<typeof mapItems>) {
  return {
    ...menu,
    dishes: items,
  };
}

function mapItems(rows: MenuItemRow[]) {
  return rows.map((row) => ({
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
  }));
}

export class MenuService {
  async list(userId: string, page: number, limit: number, sort: 'latest' | 'created') {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;
    return menuRepository.findListByUser(userId, safeLimit, offset, sort);
  }

  async getById(menuId: string, userId: string) {
    const menu = await menuRepository.findByIdOwned(menuId, userId);
    if (!menu) {
      throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
    }
    const items = await menuRepository.findItemsWithDishes(menuId);
    return formatMenuDetail(menu as unknown as Record<string, unknown>, mapItems(items));
  }

  async create(userId: string, body: Partial<MenuCreateDTO>) {
    const n = await menuRepository.countByUser(userId);
    if (n >= MAX_MENUS_PER_USER) {
      throw new ApiError(400, 'MENU_LIMIT', `每人最多创建 ${MAX_MENUS_PER_USER} 个菜单`);
    }
    const name = normalizeMenuName(body.name) || '新菜单';
    assertMenuName(name);
    const dto: MenuCreateDTO = {
      name,
      description:
        body.description === undefined || body.description === null
          ? null
          : String(body.description),
      tags: Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [],
      cover_image_url:
        body.cover_image_url === undefined || body.cover_image_url === null
          ? null
          : String(body.cover_image_url),
    };
    const row = await menuRepository.create(userId, dto);
    return formatMenuDetail(row as unknown as Record<string, unknown>, []);
  }

  async update(menuId: string, userId: string, body: MenuUpdateDTO & { ifMatchVersion?: number }) {
    const ifMatchVersion = body.ifMatchVersion;
    if (ifMatchVersion === undefined || typeof ifMatchVersion !== 'number' || Number.isNaN(ifMatchVersion)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供有效的 ifMatchVersion');
    }
    const dto: MenuUpdateDTO = {};
    if (body.name !== undefined) {
      const name = normalizeMenuName(body.name);
      assertMenuName(name);
      dto.name = name;
    }
    if (body.description !== undefined) {
      dto.description = body.description === null ? null : String(body.description);
    }
    if (body.tags !== undefined) {
      dto.tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [];
    }
    if (body.cover_image_url !== undefined) {
      dto.cover_image_url =
        body.cover_image_url === null || body.cover_image_url === undefined
          ? null
          : String(body.cover_image_url);
    }
    if (Object.keys(dto).length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', '没有可更新的字段');
    }
    const updated = await menuRepository.update(menuId, userId, dto, ifMatchVersion);
    if (!updated) {
      const snap = await menuRepository.getDetailSnapshot(menuId, userId);
      throw new ApiError(409, 'VERSION_CONFLICT', '菜单已在其他端更新，请刷新后重试', {
        resource: 'menu',
        id: menuId,
        serverVersion: snap && (snap as { version?: number }).version,
        serverSnapshot: snap,
      });
    }
    const items = await menuRepository.findItemsWithDishes(menuId);
    return formatMenuDetail(updated as unknown as Record<string, unknown>, mapItems(items));
  }

  async delete(menuId: string, userId: string) {
    const ok = await menuRepository.softDelete(menuId, userId);
    if (!ok) {
      throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
    }
  }

  async copy(menuId: string, userId: string, newName?: string) {
    const n = await menuRepository.countByUser(userId);
    if (n >= MAX_MENUS_PER_USER) {
      throw new ApiError(400, 'MENU_LIMIT', `每人最多创建 ${MAX_MENUS_PER_USER} 个菜单`);
    }
    const src = await menuRepository.findByIdOwned(menuId, userId);
    if (!src) {
      throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
    }
    const suffix = '（副本）';
    const baseMax = Math.max(1, MAX_MENU_NAME_LENGTH - suffix.length);
    const defaultName = `${(src.name || '菜单').slice(0, baseMax)}${suffix}`;
    const trimmed = newName !== undefined ? normalizeMenuName(newName) : '';
    const name = trimmed.length > 0 ? trimmed : defaultName;
    assertMenuName(name);
    try {
      const row = await menuRepository.copyMenu(menuId, userId, name);
      const items = await menuRepository.findItemsWithDishes(row.id);
      return {
        ...formatMenuDetail(row as unknown as Record<string, unknown>, mapItems(items)),
        copied_from: menuId,
      };
    } catch (e: any) {
      if (e?.message === 'SOURCE_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
      }
      throw e;
    }
  }

  async addItem(
    menuId: string,
    userId: string,
    dishId: string,
    servings?: number,
    notes?: string | null
  ) {
    const visible = await dishRepository.findVisibleById(dishId, userId);
    if (!visible) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限加入菜单');
    }
    const s = servings !== undefined && !Number.isNaN(Number(servings)) ? Number(servings) : 1;
    if (!(s > 0 && s <= 999)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '份量需在 0～999 之间（支持小数）');
    }
    const noteStr = notes === undefined || notes === null ? null : String(notes).slice(0, 500);
    try {
      const { item, menuVersion } = await menuRepository.addItem(menuId, userId, dishId, s, noteStr);
      return { item, menu_version: menuVersion };
    } catch (e: any) {
      if (e?.message === 'MENU_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
      }
      if (e?.message === 'MENU_ITEMS_LIMIT') {
        throw new ApiError(400, 'MENU_ITEMS_LIMIT', '单个菜单最多 20 道菜');
      }
      if (e?.message === 'DUPLICATE_MENU_ITEM') {
        throw new ApiError(409, 'DUPLICATE_MENU_ITEM', '该菜已在菜单中');
      }
      throw e;
    }
  }

  async updateItem(
    menuId: string,
    userId: string,
    itemId: string,
    body: { servings?: number; notes?: string | null; sequence?: number | null }
  ) {
    const patch: { servings?: number; notes?: string | null; sequence?: number | null } = {};
    if (body.servings !== undefined) {
      const s = Number(body.servings);
      if (Number.isNaN(s) || !(s > 0 && s <= 999)) {
        throw new ApiError(400, 'VALIDATION_ERROR', '份量需在 0～999 之间（支持小数）');
      }
      patch.servings = s;
    }
    if (body.notes !== undefined) {
      patch.notes = body.notes === null ? null : String(body.notes).slice(0, 500);
    }
    if (body.sequence !== undefined) {
      patch.sequence = body.sequence === null ? null : Number(body.sequence);
    }
    try {
      const { item, menuVersion } = await menuRepository.updateItemFields(menuId, userId, itemId, patch);
      if (!item) {
        throw new ApiError(404, 'NOT_FOUND', '菜单项不存在');
      }
      return { item, menu_version: menuVersion };
    } catch (e: any) {
      if (e?.message === 'MENU_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
      }
      throw e;
    }
  }

  async deleteItem(menuId: string, userId: string, itemId: string) {
    try {
      const { ok, menuVersion } = await menuRepository.deleteItem(menuId, userId, itemId);
      if (!ok) {
        throw new ApiError(404, 'NOT_FOUND', '菜单项不存在');
      }
      return { menu_version: menuVersion };
    } catch (e: any) {
      if (e?.message === 'MENU_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
      }
      throw e;
    }
  }

  async reorderItems(menuId: string, userId: string, itemIds: string[]) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'itemIds 不能为空');
    }
    try {
      const version = await menuRepository.reorderItems(menuId, userId, itemIds);
      return { ok: true as const, menu_version: version };
    } catch (e: any) {
      if (e?.message === 'MENU_NOT_FOUND') {
        throw new ApiError(404, 'NOT_FOUND', '菜单不存在');
      }
      if (e?.message === 'REORDER_MISMATCH') {
        throw new ApiError(400, 'VALIDATION_ERROR', '排序列表与当前菜单项不一致');
      }
      throw e;
    }
  }
}

export const menuService = new MenuService();

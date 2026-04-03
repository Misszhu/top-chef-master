import { Request, Response } from 'express';
import { menuService } from '../services/menu.service';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

function parsePositiveInt(v: unknown, fallback: number, max: number): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export class MenuController {
  async list(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const limit = parsePositiveInt(req.query.limit, 20, 50);
    const sortRaw = pickString(req.query.sort);
    const sort = sortRaw === 'created' ? 'created' : 'latest';
    try {
      const { data, total } = await menuService.list(userId, page, limit, sort);
      return sendPagination(res, data, { page, limit, total });
    } catch (e) {
      console.error('menus list', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取菜单列表失败');
    }
  }

  async getOne(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    try {
      const data = await menuService.getById(id, userId);
      return sendSuccess(res, data);
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus get', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取菜单失败');
    }
  }

  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const body = req.body || {};
    try {
      const data = await menuService.create(userId, {
        name: pickString(body.name),
        description: typeof body.description === 'string' ? body.description : body.description ?? undefined,
        tags: Array.isArray(body.tags) ? body.tags : undefined,
        cover_image_url:
          typeof body.cover_image_url === 'string'
            ? body.cover_image_url
            : typeof body.coverImage === 'string'
              ? body.coverImage
              : undefined,
      });
      return sendSuccess(res, data, { status: 201, msg: '已创建菜单' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus create', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '创建菜单失败');
    }
  }

  async update(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    const body = req.body || {};
    const v =
      body.ifMatchVersion !== undefined
        ? Number(body.ifMatchVersion)
        : body.if_match_version !== undefined
          ? Number(body.if_match_version)
          : NaN;
    try {
      const data = await menuService.update(id, userId, {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description,
        tags: body.tags,
        cover_image_url:
          body.cover_image_url !== undefined
            ? body.cover_image_url
            : body.coverImage !== undefined
              ? body.coverImage
              : undefined,
        ifMatchVersion: Number.isFinite(v) ? v : undefined,
      });
      return sendSuccess(res, data, { msg: '已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus update', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新菜单失败');
    }
  }

  async remove(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    try {
      await menuService.delete(id, userId);
      return sendSuccess(res, { ok: true }, { msg: '已删除' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus delete', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除菜单失败');
    }
  }

  async copy(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    const body = req.body || {};
    const newName = pickString(body.newName) ?? pickString(body.new_name);
    try {
      const data = await menuService.copy(id, userId, newName);
      return sendSuccess(res, data, { status: 201, msg: '已复制菜单' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus copy', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '复制菜单失败');
    }
  }

  async addItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const menuId = pickParam(req.params.id);
    if (!isUuid(menuId)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    const body = req.body || {};
    const dishId =
      typeof body.dishId === 'string' ? body.dishId : typeof body.dish_id === 'string' ? body.dish_id : '';
    if (!isUuid(dishId)) return sendError(res, 400, 'VALIDATION_ERROR', 'dishId 无效');
    const servings = body.servings !== undefined ? Number(body.servings) : undefined;
    const notes = body.notes !== undefined ? body.notes : null;
    try {
      const { item, menu_version } = await menuService.addItem(menuId, userId, dishId, servings, notes);
      return sendSuccess(res, { item, menu_version }, { msg: '已加入菜单' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus addItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '加入菜单失败');
    }
  }

  async updateItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const menuId = pickParam(req.params.id);
    const itemId = pickParam(req.params.itemId);
    if (!isUuid(menuId) || !isUuid(itemId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '参数无效');
    }
    const body = req.body || {};
    try {
      const { item, menu_version } = await menuService.updateItem(menuId, userId, itemId, {
        servings: body.servings !== undefined ? Number(body.servings) : undefined,
        notes: body.notes,
        sequence: body.sequence !== undefined ? body.sequence : undefined,
      });
      return sendSuccess(res, { item, menu_version }, { msg: '已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus updateItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  }

  async deleteItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const menuId = pickParam(req.params.id);
    const itemId = pickParam(req.params.itemId);
    if (!isUuid(menuId) || !isUuid(itemId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '参数无效');
    }
    try {
      const { menu_version } = await menuService.deleteItem(menuId, userId, itemId);
      return sendSuccess(res, { ok: true, menu_version }, { msg: '已移除' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus deleteItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '移除失败');
    }
  }

  async reorderItems(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const menuId = pickParam(req.params.id);
    if (!isUuid(menuId)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    const body = req.body || {};
    const raw = body.itemIds ?? body.item_ids;
    const itemIds = Array.isArray(raw) ? raw.filter((x: unknown) => typeof x === 'string') : [];
    try {
      const data = await menuService.reorderItems(menuId, userId, itemIds);
      return sendSuccess(res, data, { msg: '排序已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('menus reorder', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '排序失败');
    }
  }
}

export const menuController = new MenuController();

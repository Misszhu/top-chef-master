import { Request, Response } from 'express';
import { shoppingListService } from '../services/shopping-list.service';
import { sendError, sendPagination, sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';

function parsePositiveInt(v: unknown, fallback: number, max: number): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function parseIfMatchVersion(body: Record<string, unknown>): number | undefined {
  const raw =
    body.ifMatchVersion !== undefined
      ? body.ifMatchVersion
      : body.if_match_version !== undefined
        ? body.if_match_version
        : undefined;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function parseEstimatedCost(body: Record<string, unknown>): number | null | undefined {
  const raw =
    body.estimated_cost !== undefined
      ? body.estimated_cost
      : body.estimatedCost !== undefined
        ? body.estimatedCost
        : undefined;
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const n = typeof raw === 'string' ? parseFloat(raw) : typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export class ShoppingListController {
  async list(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const limit = parsePositiveInt(req.query.limit, 20, 50);
    try {
      const { data, total } = await shoppingListService.list(userId, page, limit);
      return sendPagination(res, data, { page, limit, total });
    } catch (e) {
      console.error('shopping-lists list', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取购物清单列表失败');
    }
  }

  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const body = req.body || {};
    const menuIdRaw = body.menuId ?? body.menu_id;
    const menuId = typeof menuIdRaw === 'string' && menuIdRaw ? menuIdRaw : undefined;
    try {
      const data = await shoppingListService.create(userId, menuId);
      return sendSuccess(res, data, { status: 201, msg: '已创建购物清单' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists create', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '创建购物清单失败');
    }
  }

  async getOne(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    try {
      const data = await shoppingListService.getById(id, userId);
      return sendSuccess(res, data);
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists get', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取购物清单失败');
    }
  }

  async updateMeta(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    const body = (req.body || {}) as Record<string, unknown>;
    const ifMatchVersion = parseIfMatchVersion(body);
    const estimatedCost = parseEstimatedCost(body);
    try {
      const data = await shoppingListService.updateMeta(id, userId, {
        estimated_cost: estimatedCost === undefined ? undefined : estimatedCost,
        ifMatchVersion,
      });
      return sendSuccess(res, data, { msg: '已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists updateMeta', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新购物清单失败');
    }
  }

  async remove(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    try {
      await shoppingListService.deleteList(id, userId);
      return sendSuccess(res, { message: '删除成功' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists delete', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  }

  async fromMenu(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    const menuId = pickParam(req.params.menuId);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    if (!isUuid(menuId)) return sendError(res, 400, 'VALIDATION_ERROR', '菜单 id 无效');
    try {
      const data = await shoppingListService.fromMenu(id, userId, menuId);
      return sendSuccess(res, data, { msg: '已从菜单合并食材' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists fromMenu', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '从菜单生成失败');
    }
  }

  async addItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    const body = req.body || {};
    const ingredientName =
      typeof body.ingredientName === 'string'
        ? body.ingredientName
        : typeof body.ingredient_name === 'string'
          ? body.ingredient_name
          : '';
    try {
      const data = await shoppingListService.addItem(id, userId, {
        ingredient_name: ingredientName,
        quantity: body.quantity !== undefined ? body.quantity : null,
        unit: body.unit ?? null,
        category: body.category ?? null,
        notes: body.notes ?? null,
      });
      return sendSuccess(res, data, { status: 201, msg: '已添加条目' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists addItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '添加失败');
    }
  }

  async updateItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    const itemId = pickParam(req.params.itemId);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    if (!isUuid(itemId)) return sendError(res, 400, 'VALIDATION_ERROR', '条目 id 无效');
    const body = req.body || {};
    const hasPatch =
      body.isChecked !== undefined ||
      body.is_checked !== undefined ||
      body.quantity !== undefined ||
      body.notes !== undefined;
    if (!hasPatch) {
      return sendError(res, 400, 'VALIDATION_ERROR', '请提供 is_checked、quantity 或 notes 之一');
    }
    const isChecked =
      body.isChecked !== undefined
        ? Boolean(body.isChecked)
        : body.is_checked !== undefined
          ? Boolean(body.is_checked)
          : undefined;
    try {
      const data = await shoppingListService.updateItem(id, userId, itemId, {
        is_checked: isChecked,
        quantity: body.quantity !== undefined ? body.quantity : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      });
      return sendSuccess(res, data, { msg: '已更新' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists updateItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  }

  async deleteItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    const id = pickParam(req.params.id);
    const itemId = pickParam(req.params.itemId);
    if (!isUuid(id)) return sendError(res, 400, 'VALIDATION_ERROR', '清单 id 无效');
    if (!isUuid(itemId)) return sendError(res, 400, 'VALIDATION_ERROR', '条目 id 无效');
    try {
      const data = await shoppingListService.deleteItem(id, userId, itemId);
      return sendSuccess(res, data, { msg: '已删除' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('shopping-lists deleteItem', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  }
}

export const shoppingListController = new ShoppingListController();

import { dishRepository } from '../repositories/dish.repository';
import { mealLogRepository } from '../repositories/meal-log.repository';
import { ApiError } from '../utils/api-error';
import { isUuid } from '../utils/uuid';
import type { MealSlot } from '../models/meal-log.model';

const MAX_NOTES_LEN = 200;
const MAX_TITLE_LEN = 200;
const MAX_ENTRIES_PER_DAY = 50;

const MEAL_SLOTS = new Set<MealSlot>(['breakfast', 'lunch', 'dinner', 'snack', 'other']);

/** 规范化为 YYYY-MM-DD（PostgreSQL DATE）。接受纯日期或 ISO 8601 日期时间（按 UTC 取日历日）。 */
function parseDateOnly(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T12:00:00.000Z');
    if (Number.isNaN(d.getTime())) return null;
    return s;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** undefined = 未传；null = 清空餐次 */
function parseMealSlotInput(raw: unknown): MealSlot | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'meal_slot 格式无效');
  }
  const s = raw.trim().toLowerCase();
  if (s === '') return null;
  if (!MEAL_SLOTS.has(s as MealSlot)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'meal_slot 无效，可选：breakfast/lunch/dinner/snack/other 或留空');
  }
  return s as MealSlot;
}

function trimTitle(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_TITLE_LEN);
}

function normalizeNotes(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return null;
  const t = raw.trim().slice(0, MAX_NOTES_LEN);
  return t || null;
}

type MealLogWriteBody = Record<string, unknown>;

export class MealLogService {
  async list(userId: string, from: string, to: string, page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;
    const fromD = parseDateOnly(from);
    const toD = parseDateOnly(to);
    if (!fromD || !toD) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供有效的 from、to（YYYY-MM-DD）');
    }
    if (fromD > toD) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'from 不能晚于 to');
    }
    return mealLogRepository.listByUser(userId, fromD, toD, safeLimit, offset);
  }

  async getById(id: string, userId: string) {
    const row = await mealLogRepository.findByIdForOwner(id, userId);
    if (!row) {
      throw new ApiError(404, 'NOT_FOUND', '记录不存在');
    }
    return row;
  }

  async create(userId: string, body: MealLogWriteBody) {
    const eatenDate = parseDateOnly(body.eaten_date ?? body.eatenDate);
    if (!eatenDate) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供有效的 eaten_date（YYYY-MM-DD）');
    }

    let mealSlot: MealSlot | null = null;
    if (body.meal_slot !== undefined || body.mealSlot !== undefined) {
      mealSlot = parseMealSlotInput(body.meal_slot !== undefined ? body.meal_slot : body.mealSlot) ?? null;
    }

    const notes = normalizeNotes(body.notes);

    const dishIdRaw =
      typeof body.dish_id === 'string'
        ? body.dish_id
        : typeof body.dishId === 'string'
          ? body.dishId
          : '';
    const dishId = dishIdRaw && isUuid(dishIdRaw) ? dishIdRaw : null;

    let title: string;
    if (dishId) {
      const dish = await dishRepository.findVisibleById(dishId, userId);
      if (!dish) {
        throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或不可见');
      }
      title = String(dish.name || '').trim().slice(0, MAX_TITLE_LEN);
      if (!title) {
        throw new ApiError(400, 'VALIDATION_ERROR', '无法从菜谱解析标题');
      }
    } else {
      title = trimTitle(body.title);
      if (!title) {
        throw new ApiError(400, 'VALIDATION_ERROR', '未关联菜谱时请填写 title（菜名）');
      }
    }

    const count = await mealLogRepository.countOnDate(userId, eatenDate);
    if (count >= MAX_ENTRIES_PER_DAY) {
      throw new ApiError(400, 'VALIDATION_ERROR', `单日记录请勿超过 ${MAX_ENTRIES_PER_DAY} 条`);
    }

    const row = await mealLogRepository.create({
      user_id: userId,
      eaten_date: eatenDate,
      meal_slot: mealSlot,
      dish_id: dishId,
      title,
      notes,
    });
    const full = await mealLogRepository.findByIdForOwner(row.id, userId);
    return full!;
  }

  async update(id: string, userId: string, body: MealLogWriteBody) {
    const vRaw = body.ifMatchVersion !== undefined ? body.ifMatchVersion : body.if_match_version;
    const v = typeof vRaw === 'string' ? parseInt(vRaw, 10) : typeof vRaw === 'number' ? vRaw : NaN;
    if (!Number.isFinite(v)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请提供有效的 ifMatchVersion');
    }

    const existing = await mealLogRepository.findByIdForOwner(id, userId);
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', '记录不存在');
    }

    const patch: {
      eaten_date?: string;
      meal_slot?: MealSlot | null;
      dish_id?: string | null;
      title?: string;
      notes?: string | null;
    } = {};

    if (body.eaten_date !== undefined || body.eatenDate !== undefined) {
      const d = parseDateOnly(body.eaten_date !== undefined ? body.eaten_date : body.eatenDate);
      if (!d) throw new ApiError(400, 'VALIDATION_ERROR', 'eaten_date 无效');
      patch.eaten_date = d;
    }

    if (body.meal_slot !== undefined || body.mealSlot !== undefined) {
      const raw = body.meal_slot !== undefined ? body.meal_slot : body.mealSlot;
      patch.meal_slot = parseMealSlotInput(raw) ?? null;
    }

    if (body.notes !== undefined) {
      patch.notes = normalizeNotes(body.notes);
    }

    const dishKeyPresent = body.dish_id !== undefined || body.dishId !== undefined;
    if (dishKeyPresent) {
      const raw = body.dish_id !== undefined ? body.dish_id : body.dishId;
      if (raw === null || raw === '') {
        patch.dish_id = null;
      } else if (typeof raw === 'string' && isUuid(raw)) {
        patch.dish_id = raw;
      } else {
        throw new ApiError(400, 'VALIDATION_ERROR', 'dish_id 无效');
      }
    }

    if (body.title !== undefined) {
      const t = trimTitle(body.title);
      if (!t) throw new ApiError(400, 'VALIDATION_ERROR', 'title 不能为空');
      patch.title = t;
    }

    if (patch.dish_id !== undefined && patch.dish_id) {
      const dish = await dishRepository.findVisibleById(patch.dish_id, userId);
      if (!dish) {
        throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或不可见');
      }
      if (patch.title === undefined) {
        patch.title = String(dish.name || '').trim().slice(0, MAX_TITLE_LEN);
      }
    }

    if (Object.keys(patch).length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', '没有可更新的字段');
    }

    const updated = await mealLogRepository.update(id, userId, v, patch);
    if (!updated) {
      const snap = await mealLogRepository.getSnapshot(id, userId);
      throw new ApiError(409, 'VERSION_CONFLICT', '记录已在其他端更新，请刷新后重试', {
        resource: 'meal_log_entry',
        id,
        serverVersion: snap && (snap as { version?: number }).version,
        serverSnapshot: snap,
      });
    }

    const out = await mealLogRepository.findByIdForOwner(id, userId);
    if (!out) {
      throw new ApiError(500, 'INTERNAL_ERROR', '更新后读取记录失败');
    }
    return out;
  }

  async remove(id: string, userId: string) {
    const ok = await mealLogRepository.softDelete(id, userId);
    if (!ok) {
      throw new ApiError(404, 'NOT_FOUND', '记录不存在');
    }
  }
}

export const mealLogService = new MealLogService();

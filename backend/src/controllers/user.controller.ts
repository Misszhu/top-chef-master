import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { dishService } from '../services/dish.service';
import { followService } from '../services/follow.service';
import { sendError, sendSuccess, sendPagination } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { isUuid, pickParam } from '../utils/uuid';
import type { DishQueryFilters } from '../models/dish.model';

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

export class UserController {
  async login(req: Request, res: Response) {
    const { code } = req.body;
    
    if (!code) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'code 必填');
    }
    
    try {
      const result = await authService.wechatLogin(code);
      return sendSuccess(res, result);
    } catch (error) {
      console.error('Login error:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '登录失败');
    }
  }

  async getProfile(req: Request, res: Response) {
    const userId = req.user?.userId;
    
    if (!userId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }
    
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return sendError(res, 404, 'NOT_FOUND', '用户不存在');
      }
      return sendSuccess(res, user);
    } catch (error) {
      console.error('Get profile error:', error);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取用户信息失败');
    }
  }

  async getPublic(req: Request, res: Response) {
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    const viewerId = req.user?.userId ?? null;
    try {
      const profile = await followService.getPublicProfile(id, viewerId);
      return sendSuccess(res, profile);
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('getPublic', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取用户主页失败');
    }
  }

  async getUserDishes(req: Request, res: Response) {
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    const { difficulty, tag, search, limit, page } = req.query;
    const filters: DishQueryFilters = {
      difficulty: pickString(difficulty),
      tag: pickString(tag),
      search: pickString(search),
      user_id: id,
    };
    const limitStr = pickString(limit);
    const pageStr = pickString(page);
    const limitNum = limitStr ? parseInt(limitStr, 10) : 20;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;
    const viewerId = req.user?.userId ?? null;
    try {
      const { data, total } = await dishService.getDishes(filters, limitNum, offsetNum, viewerId);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (e) {
      console.error('getUserDishes', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取菜谱列表失败');
    }
  }

  async getFollowers(req: Request, res: Response) {
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    const limitStr = pickString(req.query.limit);
    const pageStr = pickString(req.query.page);
    const limitNum = limitStr ? parseInt(limitStr, 10) : 20;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;
    try {
      const { data, total } = await followService.listFollowers(id, limitNum, offsetNum);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('getFollowers', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取粉丝列表失败');
    }
  }

  async getFollowing(req: Request, res: Response) {
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    const limitStr = pickString(req.query.limit);
    const pageStr = pickString(req.query.page);
    const limitNum = limitStr ? parseInt(limitStr, 10) : 20;
    const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
    const offsetNum = (Math.max(pageNum, 1) - 1) * limitNum;
    try {
      const { data, total } = await followService.listFollowing(id, limitNum, offsetNum);
      return sendPagination(res, data, { page: pageNum, limit: limitNum, total });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('getFollowing', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '获取关注列表失败');
    }
  }

  async follow(req: Request, res: Response) {
    const followerId = req.user?.userId;
    if (!followerId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    try {
      await followService.follow(followerId, id);
      return sendSuccess(res, { following: true }, { msg: '已关注' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('follow', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '关注失败');
    }
  }

  async unfollow(req: Request, res: Response) {
    const followerId = req.user?.userId;
    if (!followerId) {
      return sendError(res, 401, 'AUTH_REQUIRED', '需要登录');
    }
    const id = pickParam(req.params.id);
    if (!isUuid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', '用户 id 无效');
    }
    try {
      await followService.unfollow(followerId, id);
      return sendSuccess(res, { following: false }, { msg: '已取消关注' });
    } catch (e) {
      if (e instanceof ApiError) {
        return sendError(res, e.status, e.code, e.message, e.details);
      }
      console.error('unfollow', e);
      return sendError(res, 500, 'INTERNAL_ERROR', '取消关注失败');
    }
  }
}

export const userController = new UserController();

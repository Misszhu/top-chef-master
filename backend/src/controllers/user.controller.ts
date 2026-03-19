import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { sendError, sendSuccess } from '../utils/api-response';

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
}

export const userController = new UserController();

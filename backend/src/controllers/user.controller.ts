import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';

export class UserController {
  async login(req: Request, res: Response) {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code is required for WeChat login' });
    }
    
    try {
      const result = await authService.wechatLogin(code);
      return res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error during login' });
    }
  }

  async getProfile(req: Request, res: Response) {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ message: 'Internal server error fetching profile' });
    }
  }
}

export const userController = new UserController();

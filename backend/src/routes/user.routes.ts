import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', (req, res) => userController.login(req, res));

// Protected routes
router.get('/profile', authenticate, (req, res) => userController.getProfile(req, res));

export default router;

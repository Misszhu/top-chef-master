import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { loginRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.post('/login', loginRateLimiter, (req, res) => userController.login(req, res));

export default router;


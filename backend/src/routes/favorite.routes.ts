import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { favoriteController } from '../controllers/favorite.controller';

const router = Router();

router.get('/', authenticate, (req, res) => favoriteController.list(req, res));
router.get('/:dishId/status', authenticate, (req, res) => favoriteController.status(req, res));
router.post('/:dishId', authenticate, (req, res) => favoriteController.add(req, res));
router.delete('/:dishId', authenticate, (req, res) => favoriteController.remove(req, res));

export default router;

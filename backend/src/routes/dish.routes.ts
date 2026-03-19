import { Router } from 'express';
import { dishController } from '../controllers/dish.controller';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuthenticate } from '../middleware/optional-auth.middleware';

const router = Router();

// Public routes
router.get('/', optionalAuthenticate, (req, res) => dishController.getAllDishes(req, res));
router.get('/:id', optionalAuthenticate, (req, res) => dishController.getDishDetail(req, res));

// Protected routes
router.post('/', authenticate, (req, res) => dishController.createDish(req, res));
router.put('/:id', authenticate, (req, res) => dishController.updateDish(req, res));
router.delete('/:id', authenticate, (req, res) => dishController.deleteDish(req, res));

router.post('/:id/like', authenticate, (req, res) => dishController.likeDish(req, res));
router.delete('/:id/like', authenticate, (req, res) => dishController.unlikeDish(req, res));

export default router;

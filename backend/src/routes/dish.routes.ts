import { Router } from 'express';
import { dishController } from '../controllers/dish.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', (req, res) => dishController.getAllDishes(req, res));
router.get('/:id', (req, res) => dishController.getDishDetail(req, res));

// Protected routes
router.post('/', authenticate, (req, res) => dishController.createDish(req, res));
router.put('/:id', authenticate, (req, res) => dishController.updateDish(req, res));
router.delete('/:id', authenticate, (req, res) => dishController.deleteDish(req, res));

export default router;

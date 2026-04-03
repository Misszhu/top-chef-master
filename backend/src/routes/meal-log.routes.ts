import { Router } from 'express';
import { mealLogController } from '../controllers/meal-log.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => mealLogController.list(req, res));
router.post('/', (req, res) => mealLogController.create(req, res));
router.get('/:id', (req, res) => mealLogController.getOne(req, res));
router.put('/:id', (req, res) => mealLogController.update(req, res));
router.delete('/:id', (req, res) => mealLogController.remove(req, res));

export default router;

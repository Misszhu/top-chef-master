import { Router } from 'express';
import { menuController } from '../controllers/menu.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => menuController.list(req, res));
router.post('/', (req, res) => menuController.create(req, res));
router.get('/:id', (req, res) => menuController.getOne(req, res));
router.put('/:id', (req, res) => menuController.update(req, res));
router.delete('/:id', (req, res) => menuController.remove(req, res));
router.post('/:id/copy', (req, res) => menuController.copy(req, res));
router.put('/:id/items/reorder', (req, res) => menuController.reorderItems(req, res));
router.post('/:id/items', (req, res) => menuController.addItem(req, res));
router.put('/:id/items/:itemId', (req, res) => menuController.updateItem(req, res));
router.delete('/:id/items/:itemId', (req, res) => menuController.deleteItem(req, res));

export default router;

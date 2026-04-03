import { Router } from 'express';
import { shoppingListController } from '../controllers/shopping-list.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => shoppingListController.list(req, res));
router.post('/', (req, res) => shoppingListController.create(req, res));
router.get('/:id', (req, res) => shoppingListController.getOne(req, res));
router.put('/:id', (req, res) => shoppingListController.updateMeta(req, res));
router.delete('/:id', (req, res) => shoppingListController.remove(req, res));
router.post('/:id/from-menu/:menuId', (req, res) => shoppingListController.fromMenu(req, res));
router.post('/:id/items', (req, res) => shoppingListController.addItem(req, res));
router.put('/:id/items/:itemId', (req, res) => shoppingListController.updateItem(req, res));
router.delete('/:id/items/:itemId', (req, res) => shoppingListController.deleteItem(req, res));

export default router;

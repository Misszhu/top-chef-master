import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/dishes/:id/comments', (req, res) => commentController.listByDish(req, res));
router.post('/dishes/:id/comments', authenticate, (req, res) => commentController.upsertForDish(req, res));

router.put('/comments/:id', authenticate, (req, res) => commentController.updateById(req, res));
router.delete('/comments/:id', authenticate, (req, res) => commentController.deleteById(req, res));

export default router;


import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuthenticate } from '../middleware/optional-auth.middleware';
import { shareController } from '../controllers/share.controller';

const router = Router();

router.get('/stats/:dishId', optionalAuthenticate, (req, res) => shareController.getStats(req, res));
router.post('/', authenticate, (req, res) => shareController.create(req, res));

export default router;

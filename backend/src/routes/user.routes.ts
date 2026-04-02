import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuthenticate } from '../middleware/optional-auth.middleware';

const router = Router();

router.get('/profile', authenticate, (req, res) => userController.getProfile(req, res));

router.get('/:id/public', optionalAuthenticate, (req, res) => userController.getPublic(req, res));
router.get('/:id/dishes', optionalAuthenticate, (req, res) => userController.getUserDishes(req, res));
router.get('/:id/followers', optionalAuthenticate, (req, res) => userController.getFollowers(req, res));
router.get('/:id/following', optionalAuthenticate, (req, res) => userController.getFollowing(req, res));
router.post('/:id/follow', authenticate, (req, res) => userController.follow(req, res));
router.delete('/:id/follow', authenticate, (req, res) => userController.unfollow(req, res));

export default router;

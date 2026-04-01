import { Router } from 'express';
import multer from 'multer';
import { dishController } from '../controllers/dish.controller';
import { authenticate } from '../middleware/auth.middleware';
import { dishCoverUpload } from '../middleware/dish-cover-upload.middleware';
import { optionalAuthenticate } from '../middleware/optional-auth.middleware';
import { sendError } from '../utils/api-response';

const router = Router();

// Public routes
router.get('/', optionalAuthenticate, (req, res) => dishController.getAllDishes(req, res));
router.get('/:id', optionalAuthenticate, (req, res) => dishController.getDishDetail(req, res));

// Protected routes
router.post('/', authenticate, (req, res) => dishController.createDish(req, res));
router.post('/:id/image', authenticate, (req, res) => {
  dishCoverUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 400, 'VALIDATION_ERROR', '图片不超过 5MB');
      }
      return sendError(res, 400, 'VALIDATION_ERROR', '上传失败，请重试');
    }
    if (err) {
      return sendError(res, 400, 'VALIDATION_ERROR', '请选择有效的图片文件（jpg/png/webp/gif）');
    }
    return dishController.uploadDishCover(req, res);
  });
});
router.put('/:id', authenticate, (req, res) => dishController.updateDish(req, res));
router.delete('/:id', authenticate, (req, res) => dishController.deleteDish(req, res));

router.post('/:id/like', authenticate, (req, res) => dishController.likeDish(req, res));
router.delete('/:id/like', authenticate, (req, res) => dishController.unlikeDish(req, res));

export default router;

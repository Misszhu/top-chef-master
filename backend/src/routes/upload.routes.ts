import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { recipeMediaUpload } from '../middleware/recipe-media-upload.middleware';
import { sendError } from '../utils/api-response';

const router = Router();

router.post('/image', authenticate, (req, res) => {
  recipeMediaUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 400, 'VALIDATION_ERROR', '图片不超过 5MB');
      }
      return sendError(res, 400, 'VALIDATION_ERROR', '上传失败，请重试');
    }
    if (err) {
      return sendError(res, 400, 'VALIDATION_ERROR', '请选择有效的图片文件（jpg/png/webp/gif）');
    }
    return uploadController.uploadRecipeImage(req, res);
  });
});

export default router;

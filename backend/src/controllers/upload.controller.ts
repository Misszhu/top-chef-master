import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/api-response';

export class UploadController {
  uploadRecipeImage(req: Request, res: Response) {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return sendError(res, 400, 'VALIDATION_ERROR', '请选择图片文件');
    }
    const origin =
      process.env.API_PUBLIC_ORIGIN?.replace(/\/$/, '') ||
      `${req.protocol}://${req.get('host') || 'localhost'}`;
    const url = `${origin}/uploads/recipe-media/${file.filename}`;
    return sendSuccess(res, { url });
  }
}

export const uploadController = new UploadController();

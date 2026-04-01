import { randomUUID } from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const uploadRoot = path.join(process.cwd(), 'uploads', 'recipe-media');
fs.mkdirSync(uploadRoot, { recursive: true });

const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** 登录用户通用菜谱配图（步骤图等），不落库，仅返回可写入步骤/字段的 URL */
export const recipeMediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safe = allowedExt.has(ext) ? ext : '.jpg';
      cb(null, `${randomUUID()}${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|pjpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
}).single('file');

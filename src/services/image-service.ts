/**
 * 图片处理服务
 */

import Taro from '@tarojs/taro';
import { APP_CONFIG } from '../utils/constants';

export class ImageService {
  /**
   * 选择图片（从相册或拍照）
   */
  static async selectImage(): Promise<string> {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
      });

      const tempFilePath = result.tempFilePaths[0];
      return await this.compressImage(tempFilePath);
    } catch (error) {
      console.error('Select image error:', error);
      throw new Error('Failed to select image');
    }
  }

  /**
   * 压缩图片
   */
  static async compressImage(imagePath: string): Promise<string> {
    try {
      const result = await Taro.compressImage({
        src: imagePath,
        quality: 80,
      });

      // 如果原图已经足够小，直接返回
      const fileInfo = await Taro.getFileInfo({ filePath: result.tempFilePath });

      // 如果压缩后的文件仍然超过限制，继续压缩
      if ((fileInfo as any).size > APP_CONFIG.MAX_IMAGE_SIZE) {
        return await this.compressImage(result.tempFilePath);
      }

      return result.tempFilePath;
    } catch (error) {
      console.error('Compress image error:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * 将图片转换为 Base64
   */
  static async convertToBase64(imagePath: string): Promise<string> {
    try {
      const result = await Taro.readFile({
        filePath: imagePath,
        encoding: 'base64',
      });

      return `data:image/jpeg;base64,${result.data}`;
    } catch (error) {
      console.error('Convert to base64 error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * 从 Base64 保存图片到本地
   */
  static async saveBase64Image(base64Data: string): Promise<string> {
    try {
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const fileName = `dish_${Date.now()}.jpg`;
      const filePath = `${Taro.getEnv() === 'WEAPP' ? Taro.env.USER_DATA_PATH : '/tmp'}/${fileName}`;

      await Taro.writeFile({
        filePath,
        data: base64String,
        encoding: 'base64',
      });

      return filePath;
    } catch (error) {
      console.error('Save base64 image error:', error);
      throw new Error('Failed to save image');
    }
  }

  /**
   * 删除本地图片
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      if (imagePath && !imagePath.startsWith('data:')) {
        await Taro.removeSavedFile({ filePath: imagePath });
      }
    } catch (error) {
      console.warn('Delete image warning:', error);
      // 删除失败不影响流程
    }
  }
}

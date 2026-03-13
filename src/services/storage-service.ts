/**
 * 存储服务 - 封装微信小程序 Storage API
 */

import Taro from '@tarojs/taro';
import { STORAGE_KEYS } from '../utils/constants';

export class StorageService {
  /**
   * 设置存储项
   */
  static async setItem(key: string, data: any): Promise<void> {
    try {
      await Taro.setStorage({
        key,
        data: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Storage setItem error for key ${key}:`, error);
      throw new Error(`Failed to save data: ${error}`);
    }
  }

  /**
   * 获取存储项
   */
  static async getItem(key: string): Promise<any> {
    try {
      const result = await Taro.getStorage({ key });
      return result.data ? JSON.parse(result.data) : null;
    } catch (error) {
      if ((error as any).errMsg?.includes('not found')) {
        return null;
      }
      console.error(`Storage getItem error for key ${key}:`, error);
      throw new Error(`Failed to retrieve data: ${error}`);
    }
  }

  /**
   * 移除存储项
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await Taro.removeStorage({ key });
    } catch (error) {
      console.error(`Storage removeItem error for key ${key}:`, error);
      throw new Error(`Failed to remove data: ${error}`);
    }
  }

  /**
   * 清空所有存储
   */
  static async clear(): Promise<void> {
    try {
      await Taro.clearStorage();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw new Error(`Failed to clear storage: ${error}`);
    }
  }

  /**
   * 获取存储信息
   */
  static async getStorageInfo(): Promise<{ keys: string[]; currentSize: number; limitSize: number }> {
    try {
      const result = await Taro.getStorageInfo();
      return {
        keys: result.keys || [],
        currentSize: result.currentSize || 0,
        limitSize: result.limitSize || 0,
      };
    } catch (error) {
      console.error('Storage getStorageInfo error:', error);
      throw new Error(`Failed to get storage info: ${error}`);
    }
  }
}

/**
 * 常量定义
 */

// 本地存储键
export const STORAGE_KEYS = {
  DISHES_LIST: 'dishes:list',
  FAVORITES_IDS: 'favorites:ids',
  APP_SETTINGS: 'app:settings',
};

// 默认值
export const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'zh',
  notificationEnabled: true,
};

// 应用配置
export const APP_CONFIG = {
  MAX_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 500 * 1024, // 500KB
  MAX_IMAGE_WIDTH: 750,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 10,
};

// API 相关
export const API_TIMEOUT = 10000;

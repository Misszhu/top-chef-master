/**
 * 通用类型定义
 */

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PageInfo {
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pageInfo: PageInfo;
}

export interface FilterOptions {
  difficulty?: string;
  tag?: string;
  cookingTime?: number;
  searchText?: string;
  onlyFavorites?: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  notificationEnabled: boolean;
}

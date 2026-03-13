/**
 * 菜肴相关类型定义
 */

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface CookingStep {
  id: string;
  stepNumber: number;
  description: string;
  image?: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  image: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: CookingStep[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DishFormData = Omit<Dish, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>;

export const DIFFICULTY_LABELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_OPTIONS = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

export const COOKING_TIME_OPTIONS = [
  { label: '10分钟以下', value: 10 },
  { label: '10-30分钟', value: 30 },
  { label: '30-60分钟', value: 60 },
  { label: '60分钟以上', value: 120 },
];

export const COMMON_TAGS = [
  '快手菜',
  '家常菜',
  '宴客菜',
  '素菜',
  '荤菜',
  '湘菜',
  '川菜',
  '粤菜',
  '淮扬菜',
  '鲁菜',
  '甜品',
  '汤类',
];

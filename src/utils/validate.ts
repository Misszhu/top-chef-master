/**
 * 数据验证工具
 */

import { Dish, Ingredient, CookingStep } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDishName(name: string): ValidationResult {
  const errors: string[] = [];
  if (!name || name.trim().length === 0) {
    errors.push('菜名不能为空');
  }
  if (name.length > 50) {
    errors.push('菜名长度不能超过50个字符');
  }
  return { valid: errors.length === 0, errors };
}

export function validateCookingTime(time: number): ValidationResult {
  const errors: string[] = [];
  if (!time || time <= 0) {
    errors.push('烹饪时间必须大于0');
  }
  if (time > 300) {
    errors.push('烹饪时间不能超过300分钟');
  }
  return { valid: errors.length === 0, errors };
}

export function validateDifficulty(difficulty: string): ValidationResult {
  const errors: string[] = [];
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(difficulty)) {
    errors.push('难度级别无效');
  }
  return { valid: errors.length === 0, errors };
}

export function validateIngredients(ingredients: Ingredient[]): ValidationResult {
  const errors: string[] = [];
  if (!ingredients || ingredients.length === 0) {
    errors.push('至少需要一个食材');
  }
  ingredients.forEach((ing, index) => {
    if (!ing.name || ing.name.trim().length === 0) {
      errors.push(`食材${index + 1}的名称不能为空`);
    }
    if (!ing.quantity || ing.quantity <= 0) {
      errors.push(`食材${index + 1}的数量必须大于0`);
    }
    if (!ing.unit || ing.unit.trim().length === 0) {
      errors.push(`食材${index + 1}的单位不能为空`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function validateSteps(steps: CookingStep[]): ValidationResult {
  const errors: string[] = [];
  if (!steps || steps.length === 0) {
    errors.push('至少需要一个制作步骤');
  }
  steps.forEach((step, index) => {
    if (!step.description || step.description.trim().length === 0) {
      errors.push(`第${index + 1}步的描述不能为空`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function validateTags(tags: string[]): ValidationResult {
  const errors: string[] = [];
  if (tags.length > 5) {
    errors.push('标签数量不能超过5个');
  }
  return { valid: errors.length === 0, errors };
}

export function validateDish(dish: Partial<Dish>): ValidationResult {
  const allErrors: string[] = [];

  if (dish.name) {
    const nameResult = validateDishName(dish.name);
    allErrors.push(...nameResult.errors);
  }

  if (dish.difficulty) {
    const diffResult = validateDifficulty(dish.difficulty);
    allErrors.push(...diffResult.errors);
  }

  if (dish.cookingTime) {
    const timeResult = validateCookingTime(dish.cookingTime);
    allErrors.push(...timeResult.errors);
  }

  if (dish.ingredients) {
    const ingResult = validateIngredients(dish.ingredients);
    allErrors.push(...ingResult.errors);
  }

  if (dish.steps) {
    const stepsResult = validateSteps(dish.steps);
    allErrors.push(...stepsResult.errors);
  }

  if (dish.tags) {
    const tagsResult = validateTags(dish.tags);
    allErrors.push(...tagsResult.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

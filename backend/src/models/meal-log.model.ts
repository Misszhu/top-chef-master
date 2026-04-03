export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface MealLogEntryRow {
  id: string;
  user_id: string;
  eaten_date: string;
  meal_slot: MealSlot | null;
  dish_id: string | null;
  title: string;
  notes: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/** 列表/详情可带菜谱封面（LEFT JOIN dishes） */
export interface MealLogEntryWithDishImage extends MealLogEntryRow {
  dish_image_url?: string | null;
}

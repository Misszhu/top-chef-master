export const MAX_MENUS_PER_USER = 50;
export const MAX_MENU_NAME_LENGTH = 30;
export const MAX_ITEMS_PER_MENU = 20;

export interface MenuRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tags: string[];
  cover_image_url: string | null;
  is_public: boolean;
  share_count: number;
  version: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface MenuListRow extends MenuRow {
  item_count: number;
}

export interface MenuItemRow {
  id: string;
  menu_id: string;
  dish_id: string;
  servings: string | number;
  notes: string | null;
  sequence: number | null;
  created_at: Date;
  dish_name?: string;
  dish_image_url?: string | null;
  dish_cooking_time?: number | null;
  dish_difficulty?: string | null;
}

export interface MenuCreateDTO {
  name: string;
  description?: string | null;
  tags?: string[];
  cover_image_url?: string | null;
}

export interface MenuUpdateDTO {
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
}

export interface MenuItemCreateDTO {
  dish_id: string;
  servings?: number;
  notes?: string | null;
}

export interface MenuItemUpdateDTO {
  servings?: number;
  notes?: string | null;
  sequence?: number | null;
}

export interface Ingredient {
  id?: string;
  dish_id?: string;
  name: string;
  quantity?: string | number | null;
  unit?: string | null;
  note?: string | null;
  sequence?: number | null;
}

export interface CookingStep {
  id?: string;
  dish_id?: string;
  step_number: number;
  description: string;
  image_url?: string;
  duration_minutes?: number | null;
}

export interface Dish {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  cooking_time: number | null;
  image_url: string | null;
  servings?: number | null;
  tags: string[];
  visibility: 'private' | 'followers' | 'public';
  comments_enabled: boolean;
  view_count: number;
  like_count: number;
  share_count: number;
  rating_count: number;
  rating_avg: string | number;
  version: number;
  created_at: Date;
  updated_at: Date;
  user_nickname?: string;
  user_avatar_url?: string;
  ingredients?: Ingredient[];
  steps?: CookingStep[];
  /** 当前登录用户是否已点赞；未登录不返回 */
  liked_by_me?: boolean;
}

export interface DishCreateDTO {
  name: string;
  description?: string;
  difficulty?: string;
  cooking_time?: number;
  servings?: number;
  image_url?: string;
  tags?: string[];
  visibility?: 'private' | 'followers' | 'public';
  comments_enabled?: boolean;
  ingredients?: Omit<Ingredient, 'id' | 'dish_id'>[];
  steps?: Omit<CookingStep, 'id' | 'dish_id'>[];
}

export interface DishUpdateDTO extends Partial<DishCreateDTO> {}

export interface DishQueryFilters {
  difficulty?: string;
  tag?: string;
  search?: string;
  user_id?: string;
  visibility?: 'private' | 'followers' | 'public';
}

export interface Ingredient {
  id?: number;
  dish_id?: number;
  name: string;
  amount: string;
  unit: string;
  sort_order: number;
}

export interface Step {
  id?: number;
  dish_id?: number;
  step_number: number;
  description: string;
  image_url?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Dish {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  difficulty: string | null;
  cooking_time: number | null;
  image_url: string | null;
  is_public: boolean;
  view_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  user_nickname?: string;
  user_avatar_url?: string;
  ingredients?: Ingredient[];
  steps?: Step[];
  tags?: Tag[];
  average_rating?: number;
}

export interface DishCreateDTO {
  name: string;
  description?: string;
  difficulty?: string;
  cooking_time?: number;
  image_url?: string;
  is_public?: boolean;
  ingredients?: Omit<Ingredient, 'id' | 'dish_id'>[];
  steps?: Omit<Step, 'id' | 'dish_id'>[];
  tag_ids?: number[];
}

export interface DishQueryFilters {
  difficulty?: string;
  tag_id?: number;
  search?: string;
  user_id?: number;
  is_public?: boolean;
  limit?: number;
  offset?: number;
}

export interface MenuSummary {
  id: string
  user_id?: string
  name: string
  description: string | null
  tags: string[]
  cover_image_url: string | null
  is_public?: boolean
  share_count?: number
  version: number
  created_at: string
  updated_at: string
  item_count: number
}

export interface MenuDishItem {
  id: string
  dish_id: string
  servings: number | string
  notes: string | null
  sequence: number | null
  created_at?: string
  dish_name?: string
  dish_image_url?: string | null
  dish_cooking_time?: number | null
  dish_difficulty?: string | null
}

export interface MenuDetail {
  id: string
  user_id: string
  name: string
  description: string | null
  tags: string[]
  cover_image_url: string | null
  is_public: boolean
  share_count: number
  version: number
  created_at: string
  updated_at: string
  dishes: MenuDishItem[]
}

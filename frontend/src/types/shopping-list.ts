export interface ShoppingListSummary {
  id: string
  user_id: string
  menu_id: string | null
  estimated_cost: string | null
  version: number
  created_at: string
  updated_at: string
  menu_name?: string | null
  item_count?: number
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  ingredient_name: string
  quantity: string | null
  unit: string | null
  category: string | null
  is_checked: boolean
  notes: string | null
  sequence: number | null
  created_at?: string
  updated_at?: string
}

export interface ShoppingListDetail extends ShoppingListSummary {
  items: ShoppingListItem[]
  menu_name: string | null
}

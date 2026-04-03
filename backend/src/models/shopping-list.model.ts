export interface ShoppingListRow {
  id: string;
  user_id: string;
  menu_id: string | null;
  estimated_cost: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingListItemRow {
  id: string;
  shopping_list_id: string;
  ingredient_name: string;
  quantity: string | null;
  unit: string | null;
  category: string | null;
  is_checked: boolean;
  notes: string | null;
  sequence: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingListListRow extends ShoppingListRow {
  menu_name?: string | null;
  item_count?: number;
}

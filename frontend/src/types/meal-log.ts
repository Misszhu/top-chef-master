export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

export interface MealLogEntry {
  id: string
  user_id: string
  eaten_date: string
  meal_slot: MealSlot | null
  dish_id: string | null
  title: string
  notes: string | null
  version: number
  created_at: string
  updated_at: string
  dish_image_url?: string | null
}

export const MEAL_SLOT_OPTIONS: { value: '' | MealSlot; label: string }[] = [
  { value: '', label: '未区分餐次' },
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' },
  { value: 'other', label: '其他' },
]

export function mealSlotLabel(slot: MealSlot | null | undefined): string {
  if (slot == null) return ''
  const o = MEAL_SLOT_OPTIONS.find((x) => x.value === slot)
  return o?.label ?? slot
}

export interface Comment {
  id: string
  dish_id: string
  user_id: string
  content: string
  rating: number | null
  created_at: string
  updated_at: string
  user_nickname?: string | null
  user_avatar_url?: string | null
}

export interface CommentUpsertBody {
  content: string
  rating: number
}

export interface Comment {
  id: string;
  dish_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  user_nickname?: string | null;
  user_avatar_url?: string | null;
}

export interface CommentCreateDTO {
  content: string;
  rating?: number;
}

export interface CommentUpdateDTO {
  content?: string;
  rating?: number;
  ifMatchVersion?: number; // 预留：若后续对 comment 做 version 乐观锁
}


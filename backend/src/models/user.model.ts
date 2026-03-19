export interface User {
  id: string;
  wechat_openid: string;
  wechat_unionid?: string | null;
  nickname: string | null;
  avatar_url: string | null;
  phone?: string | null;
  email?: string | null;
  status?: 'active' | 'banned' | 'deleted';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface UserDTO {
  nickname?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
}

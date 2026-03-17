export interface User {
  id: number;
  openid: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  nickname?: string;
  avatar_url?: string;
}

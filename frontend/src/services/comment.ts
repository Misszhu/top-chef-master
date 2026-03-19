import request from '../utils/request';

export interface Comment {
  id: string;
  dish_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_nickname?: string | null;
  user_avatar_url?: string | null;
}

export const getCommentsByDish = async (
  dishId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{ data: Comment[]; pagination: { page: number; limit: number; total: number } }> => {
  const response = await request.get(`/dishes/${dishId}/comments`, { params });
  return { data: response.data.data, pagination: response.data.pagination };
};

export const upsertMyCommentForDish = async (dishId: string, payload: { content: string; rating?: number }) => {
  const response = await request.post(`/dishes/${dishId}/comments`, payload);
  return response.data.data as Comment;
};

export const updateComment = async (commentId: string, payload: { content?: string; rating?: number }) => {
  const response = await request.put(`/comments/${commentId}`, payload);
  return response.data.data as Comment;
};

export const deleteComment = async (commentId: string) => {
  await request.delete(`/comments/${commentId}`);
};


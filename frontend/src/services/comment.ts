import request from '../utils/request'
import type { Comment, CommentUpsertBody } from '../types/comment'

export interface CommentsPage {
  data: Comment[]
  pagination: { page: number; limit: number; total: number }
}

export const getCommentsByDishId = async (
  dishId: string,
  page = 1,
  limit = 20,
  sort: 'latest' | 'popular' = 'latest'
): Promise<CommentsPage> => {
  const response = await request.get(`/dishes/${dishId}/comments`, {
    params: { page, limit, sort },
  })
  const meta = response.data.meta || {}
  const pagination = meta.pagination || { page: 1, limit: 20, total: 0 }
  return {
    data: response.data.data,
    pagination,
  }
}

export const upsertComment = async (dishId: string, body: CommentUpsertBody): Promise<Comment> => {
  const response = await request.post(`/dishes/${dishId}/comments`, body)
  return response.data.data
}

export const updateComment = async (
  commentId: string,
  body: Partial<CommentUpsertBody>
): Promise<Comment> => {
  const response = await request.put(`/comments/${commentId}`, body)
  return response.data.data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  await request.delete(`/comments/${commentId}`)
}

import type { CommentCreateDTO, CommentUpdateDTO } from '../models/comment.model';
import { commentRepository } from '../repositories/comment.repository';
import { ApiError } from '../utils/api-error';

export class CommentService {
  async listByDishId(dishId: string, limit: number, offset: number) {
    return commentRepository.findByDishIdWithTotal(dishId, limit, offset);
  }

  async upsertForDish(dishId: string, userId: string, dto: CommentCreateDTO) {
    if (!dto.content || !dto.content.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', '评论内容不能为空');
    }
    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '评分范围为 1-5');
    }
    return commentRepository.upsertForDish(dishId, userId, dto);
  }

  async updateById(commentId: string, userId: string, dto: CommentUpdateDTO) {
    const updated = await commentRepository.updateById(commentId, userId, dto);
    if (!updated) {
      throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
    }
    return updated;
  }

  async deleteById(commentId: string, userId: string) {
    const ok = await commentRepository.softDelete(commentId, userId);
    if (!ok) throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
  }
}

export const commentService = new CommentService();


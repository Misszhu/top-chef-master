import type { CommentCreateDTO, CommentUpdateDTO } from '../models/comment.model';
import { commentRepository } from '../repositories/comment.repository';
import { dishRepository } from '../repositories/dish.repository';
import { ApiError } from '../utils/api-error';

export class CommentService {
  async listByDishId(
    dishId: string,
    limit: number,
    offset: number,
    viewerId: string | null,
    sort?: string
  ) {
    const dish = await dishRepository.findVisibleById(dishId, viewerId);
    if (!dish) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    return commentRepository.findByDishIdWithTotal(dishId, limit, offset, sort);
  }

  async upsertForDish(dishId: string, userId: string, dto: CommentCreateDTO) {
    const dish = await dishRepository.findVisibleById(dishId, userId);
    if (!dish) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    if (!dish.comments_enabled) {
      throw new ApiError(403, 'COMMENTS_DISABLED', '作者已关闭评论');
    }
    if (!dto.content || !dto.content.trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', '评论内容不能为空');
    }
    if (dto.rating === undefined || dto.rating === null || dto.rating < 1 || dto.rating > 5) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请选择 1-5 星评分');
    }
    const comment = await commentRepository.upsertForDish(dishId, userId, dto);
    await dishRepository.refreshRatingAggregates(dishId);
    return comment;
  }

  async updateById(commentId: string, userId: string, dto: CommentUpdateDTO) {
    const existing = await commentRepository.findById(commentId);
    if (!existing || existing.user_id !== userId) {
      throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
    }
    const dish = await dishRepository.findVisibleById(existing.dish_id, userId);
    if (!dish) {
      throw new ApiError(404, 'NOT_FOUND', '菜谱不存在或无权限访问');
    }
    if (dto.content !== undefined && !String(dto.content).trim()) {
      throw new ApiError(400, 'VALIDATION_ERROR', '评论内容不能为空');
    }
    if (dto.rating !== undefined && dto.rating !== null && (dto.rating < 1 || dto.rating > 5)) {
      throw new ApiError(400, 'VALIDATION_ERROR', '评分范围为 1-5');
    }
    const updated = await commentRepository.updateById(commentId, userId, dto);
    if (!updated) {
      throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
    }
    await dishRepository.refreshRatingAggregates(existing.dish_id);
    return updated;
  }

  async deleteById(commentId: string, userId: string) {
    const existing = await commentRepository.findById(commentId);
    if (!existing || existing.user_id !== userId) {
      throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
    }
    const ok = await commentRepository.softDelete(commentId, userId);
    if (!ok) throw new ApiError(404, 'NOT_FOUND', '评论不存在或无权限访问');
    await dishRepository.refreshRatingAggregates(existing.dish_id);
  }
}

export const commentService = new CommentService();

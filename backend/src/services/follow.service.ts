import { followRepository } from '../repositories/follow.repository';
import { userRepository } from '../repositories/user.repository';
import { dishRepository } from '../repositories/dish.repository';
import { ApiError } from '../utils/api-error';
import type { User } from '../models/user.model';

export type PublicUserCard = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

function toPublicUser(u: User): PublicUserCard {
  return {
    id: u.id,
    nickname: u.nickname,
    avatar_url: u.avatar_url,
  };
}

export class FollowService {
  private async assertTargetVisible(targetId: string): Promise<User> {
    const u = await userRepository.findById(targetId);
    if (!u || u.deleted_at || u.status === 'banned' || u.status === 'deleted') {
      throw new ApiError(404, 'NOT_FOUND', '用户不存在');
    }
    return u;
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new ApiError(400, 'VALIDATION_ERROR', '不能关注自己');
    }
    await this.assertTargetVisible(followeeId);
    try {
      await followRepository.follow(followerId, followeeId);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ApiError(409, 'DUPLICATE_FOLLOW', '已关注');
      }
      throw e;
    }
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new ApiError(400, 'VALIDATION_ERROR', '参数无效');
    }
    await followRepository.unfollow(followerId, followeeId);
  }

  async listFollowers(
    targetUserId: string,
    limit: number,
    offset: number
  ): Promise<{ data: PublicUserCard[]; total: number }> {
    await this.assertTargetVisible(targetUserId);
    const { data, total } = await followRepository.listFollowers(targetUserId, limit, offset);
    return { data: data.map(toPublicUser), total };
  }

  async listFollowing(
    targetUserId: string,
    limit: number,
    offset: number
  ): Promise<{ data: PublicUserCard[]; total: number }> {
    await this.assertTargetVisible(targetUserId);
    const { data, total } = await followRepository.listFollowing(targetUserId, limit, offset);
    return { data: data.map(toPublicUser), total };
  }

  async getPublicProfile(
    targetUserId: string,
    viewerId: string | null
  ): Promise<{
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    follower_count: number;
    following_count: number;
    visible_dish_count: number;
    is_following?: boolean;
  }> {
    const u = await this.assertTargetVisible(targetUserId);
    const [follower_count, following_count, visible_dish_count] = await Promise.all([
      followRepository.countFollowers(targetUserId),
      followRepository.countFollowing(targetUserId),
      dishRepository.countVisibleByAuthor(targetUserId, viewerId),
    ]);

    const base = {
      id: u.id,
      nickname: u.nickname,
      avatar_url: u.avatar_url,
      follower_count,
      following_count,
      visible_dish_count,
    };

    if (viewerId && viewerId !== targetUserId) {
      const is_following = await followRepository.isFollowing(viewerId, targetUserId);
      return { ...base, is_following };
    }

    return base;
  }
}

export const followService = new FollowService();

import { View, Text, ScrollView, Image } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useState } from 'react'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import {
  getUserPublicProfile,
  getUserDishes,
  followUser,
  unfollowUser,
  type UserPublicProfile,
} from '../../../services/social'
import type { Dish } from '../../../types/dish'
import { getApiErrorCode, getApiErrorMessage } from '../../../utils/api-error'
import './index.scss'

export default function UserProfilePage() {
  const router = useRouter()
  const userId = router.params.id as string | undefined
  const { token, userInfo } = useSelector((state: RootState) => state.user)

  const [profile, setProfile] = useState<UserPublicProfile | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [followBusy, setFollowBusy] = useState(false)

  const isSelf = !!(userInfo && userId && userInfo.id === userId)

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setDishes([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [p, { dishes: list }] = await Promise.all([
        getUserPublicProfile(userId),
        getUserDishes(userId, 1, 50),
      ])
      setProfile(p)
      setDishes(list)
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setProfile(null)
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useDidShow(() => {
    void load()
  })

  const goFollowers = () => {
    if (!userId) return
    Taro.navigateTo({ url: `/package-user/pages/user-list/index?userId=${userId}&type=followers` })
  }

  const goFollowing = () => {
    if (!userId) return
    Taro.navigateTo({ url: `/package-user/pages/user-list/index?userId=${userId}&type=following` })
  }

  const handleFollowToggle = async () => {
    if (!token || !userId || !profile || isSelf) {
      if (!token) Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setFollowBusy(true)
    try {
      if (profile.is_following) {
        await unfollowUser(userId)
        setProfile({ ...profile, is_following: false, follower_count: Math.max(0, profile.follower_count - 1) })
        Taro.showToast({ title: '已取消关注', icon: 'none' })
      } else {
        await followUser(userId)
        setProfile({ ...profile, is_following: true, follower_count: profile.follower_count + 1 })
        Taro.showToast({ title: '已关注', icon: 'success' })
      }
    } catch (e: any) {
      const code = getApiErrorCode(e)
      if (code === 'DUPLICATE_FOLLOW') {
        setProfile({ ...profile, is_following: true })
        Taro.showToast({ title: '已关注', icon: 'none' })
      } else {
        Taro.showToast({ title: getApiErrorMessage(e, '操作失败'), icon: 'none' })
      }
    } finally {
      setFollowBusy(false)
    }
  }

  if (!userId) {
    return (
      <View className='user-profile-page'>
        <Text className='user-profile-empty'>缺少用户参数</Text>
      </View>
    )
  }

  if (loading && !profile) {
    return (
      <View className='user-profile-page'>
        <Text className='user-profile-loading'>加载中…</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View className='user-profile-page'>
        <Text className='user-profile-empty'>用户不存在或不可见</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='user-profile-page'>
      <View className='user-profile-header'>
        <View className='user-profile-top'>
          <Image
            className='user-profile-avatar'
            src={profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            mode='aspectFill'
          />
          <View className='user-profile-meta'>
            <Text className='user-profile-name'>{profile.nickname || '主厨'}</Text>
            <View className='user-profile-stats'>
              <View className='stat-block' onClick={goFollowers}>
                <Text className='stat-num'>{profile.follower_count}</Text>
                <Text className='stat-label'>粉丝</Text>
              </View>
              <View className='stat-block' onClick={goFollowing}>
                <Text className='stat-num'>{profile.following_count}</Text>
                <Text className='stat-label'>关注</Text>
              </View>
              <View className='stat-block'>
                <Text className='stat-num'>{profile.visible_dish_count}</Text>
                <Text className='stat-label'>菜谱</Text>
              </View>
            </View>
          </View>
        </View>
        {token && !isSelf && (
          <View className='user-profile-actions'>
            <AtButton
              type={profile.is_following ? 'secondary' : 'primary'}
              size='small'
              loading={followBusy}
              onClick={handleFollowToggle}
            >
              {profile.is_following ? '已关注' : '关注'}
            </AtButton>
          </View>
        )}
      </View>

      <Text className='user-profile-dishes-title'>公开菜谱</Text>
      <View className='user-profile-grid-wrap'>
        {dishes.length === 0 ? (
          <Text className='user-profile-empty'>暂无可见菜谱</Text>
        ) : (
          <View className='user-profile-grid'>
            {dishes.map((d) => (
              <View
                key={d.id}
                className='user-profile-card'
                onClick={() =>
                Taro.navigateTo({ url: `/package-recipes/pages/dish-detail/index?id=${d.id}` })
              }
              >
                <Image
                  className='user-profile-thumb'
                  src={d.image_url || 'https://via.placeholder.com/400'}
                  mode='aspectFill'
                />
                <Text className='user-profile-card-title'>{d.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

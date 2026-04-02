import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useCallback, useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { getFollowers, getFollowing, type UserCard } from '../../../services/social'
import { getApiErrorMessage } from '../../../utils/api-error'
import './index.scss'

export default function UserListPage() {
  const router = useRouter()
  const userId = router.params.userId as string | undefined
  const type = (router.params.type as string) || 'followers'

  const [users, setUsers] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)

  const title = type === 'following' ? '关注' : '粉丝'

  const load = useCallback(async () => {
    if (!userId) {
      setUsers([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (type === 'following') {
        const { users: list } = await getFollowing(userId, 1, 100)
        setUsers(list)
      } else {
        const { users: list } = await getFollowers(userId, 1, 100)
        setUsers(list)
      }
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [userId, type])

  useEffect(() => {
    Taro.setNavigationBarTitle({ title })
  }, [title])

  useEffect(() => {
    void load()
  }, [load])

  if (!userId) {
    return (
      <View className='user-list-page'>
        <Text className='user-list-empty'>参数错误</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='user-list-page'>
      {loading ? (
        <Text className='user-list-empty'>加载中…</Text>
      ) : users.length === 0 ? (
        <Text className='user-list-empty'>暂无{type === 'following' ? '关注' : '粉丝'}</Text>
      ) : (
        users.map((u) => (
          <View
            key={u.id}
            className='user-list-item'
            onClick={() =>
            Taro.navigateTo({ url: `/package-user/pages/user-profile/index?id=${u.id}` })
          }
          >
            <Image
              className='user-list-avatar'
              src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              mode='aspectFill'
            />
            <Text className='user-list-name'>{u.nickname || '主厨'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

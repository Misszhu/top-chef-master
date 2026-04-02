import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useCallback, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { getFavorites } from '../../../services/favorite'
import type { Dish } from '../../../types/dish'
import './index.scss'

export default function FavoritesPage() {
  const { token } = useSelector((state: RootState) => state.user)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setDishes([])
      return
    }
    setLoading(true)
    try {
      const { dishes: list } = await getFavorites(1, 100)
      setDishes(list)
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useDidShow(() => {
    void load()
  })

  if (!token) {
    return (
      <View className='favorites-page'>
        <View className='no-data' style={{ padding: '80rpx 40rpx' }}>
          <Text className='empty-title'>请先登录</Text>
          <Text className='empty-sub'>登录后即可查看收藏的菜谱</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='favorites-page index-page'>
      <ScrollView scrollY className='dish-list-container'>
        {loading && dishes.length === 0 ? (
          <View className='loading-container'>
            <Text className='hint-muted'>加载中…</Text>
          </View>
        ) : dishes.length === 0 ? (
          <View className='no-data'>
            <Text className='empty-title'>还没有收藏</Text>
            <Text className='empty-sub'>在菜谱详情页点击「收藏」即可加入这里</Text>
          </View>
        ) : (
          <View className='dish-grid'>
            {dishes.map((dish) => (
              <View
                key={dish.id}
                className='dish-card'
                onClick={() =>
                  Taro.navigateTo({ url: `/package-recipes/pages/dish-detail/index?id=${dish.id}` })
                }
              >
                <Image
                  className='dish-thumb'
                  src={dish.image_url || 'https://via.placeholder.com/400'}
                  mode='aspectFill'
                />
                <View className='dish-info'>
                  <Text className='dish-title'>{dish.name}</Text>
                  <Text className='dish-desc'>{dish.description != null ? dish.description : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

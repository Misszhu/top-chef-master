import { View, Text, ScrollView, Image } from '@tarojs/components'
import { AtSearchBar } from 'taro-ui'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Taro, { useRouter } from '@tarojs/taro'
import { RootState } from '../../../store'
import { getDishes } from '../../../services/dish'
import { addMenuItem } from '../../../services/menu'
import type { Dish } from '../../../types/dish'
import { getApiErrorMessage } from '../../../utils/api-error'
import './index.scss'

export default function PickDishForMenuPage() {
  const router = useRouter()
  const menuId =
    typeof router.params.menuId === 'string' && router.params.menuId ? router.params.menuId : ''
  const { token } = useSelector((state: RootState) => state.user)
  const { userInfo } = useSelector((state: RootState) => state.user)

  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const skeletonCards = Array.from({ length: 6 })

  const fetchDishes = useCallback(async (search?: string) => {
    setLoading(true)
    try {
      const q = search?.trim()
      const { data } = await getDishes(q ? { search: q, limit: 100, page: 1 } : { limit: 100, page: 1 })
      setDishes(data)
    } catch (e) {
      console.error(e)
      setDishes([])
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!menuId || !token) return
    void fetchDishes()
  }, [menuId, token, fetchDishes])

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (value.trim() === '') {
      void fetchDishes()
    }
  }

  const onSearchAction = () => void fetchDishes(searchValue)

  const handlePickDish = async (dish: Dish) => {
    if (!menuId) return
    try {
      await addMenuItem(menuId, dish.id, 1)
      Taro.showToast({ title: `已加入「${dish.name}」`, icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '添加失败'), icon: 'none' })
    }
  }

  if (!menuId) {
    return (
      <View className='pick-dish-page index-page' style={{ padding: '40rpx' }}>
        <Text>缺少菜单参数，请从菜单编辑页进入。</Text>
      </View>
    )
  }

  if (!token) {
    return (
      <View className='pick-dish-page index-page' style={{ padding: '40rpx' }}>
        <Text>请先登录后再添加菜谱到菜单。</Text>
      </View>
    )
  }

  return (
    <View className='pick-dish-page index-page'>
      <View className='pick-banner'>点击卡片将菜谱加入当前菜单，可连续添加多道；已在菜单中的菜会提示重复。</View>
      <View className='search-container'>
        <AtSearchBar
          className='home-search-bar'
          value={searchValue}
          onChange={onSearchChange}
          onActionClick={onSearchAction}
          onConfirm={onSearchAction}
          placeholder='搜索想加入的菜...'
        />
      </View>

      <ScrollView scrollY className='dish-list-container'>
        {loading && dishes.length === 0 ? (
          <View className='loading-container'>
            <View className='skeleton-grid'>
              {skeletonCards.map((_, idx) => (
                <View key={idx} className='skeleton-card'>
                  <View className='skeleton-thumb' />
                  <View className='skeleton-content'>
                    <View className='skeleton-line skeleton-w-85 skeleton-title-line' />
                    <View className='skeleton-line skeleton-w-65 skeleton-desc-line' />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className='dish-grid'>
            {dishes.map((dish) => (
              <View key={dish.id} className='dish-card' onClick={() => void handlePickDish(dish)}>
                <Image
                  className='dish-thumb'
                  src={dish.image_url || 'https://via.placeholder.com/400'}
                  mode='aspectFill'
                />
                <View className='dish-info'>
                  <Text className='dish-title'>{dish.name}</Text>
                  <Text className='dish-desc'>{dish.description != null ? dish.description : ''}</Text>
                  <View
                    className='dish-author'
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!dish.user_id) return
                      if (userInfo && userInfo.id === dish.user_id) return
                      Taro.navigateTo({
                        url: `/package-user/pages/user-profile/index?id=${dish.user_id}`,
                      })
                    }}
                  >
                    <Image
                      className='dish-avatar'
                      src={
                        dish.user_avatar_url ||
                        'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
                      }
                      mode='aspectFill'
                    />
                    <Text className='dish-author-name'>{dish.user_nickname || '主厨'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!loading && dishes.length === 0 && (
          <View className='no-data'>
            <Text className='empty-title'>没有可展示的菜谱</Text>
            <Text className='empty-sub'>换个关键词试试</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

import { View, Text, ScrollView, Image } from '@tarojs/components'
import { AtSearchBar } from 'taro-ui'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { RootState } from '../../../store'
import { getDishes } from '../../../services/dish'
import type { Dish } from '../../../types/dish'
import { MEAL_LOG_DISH_PICK_KEY } from '../../constants'
import './index.scss'

export default function PickDishForMealLogPage() {
  const { token } = useSelector((state: RootState) => state.user)
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
    if (!token) return
    void fetchDishes()
  }, [token, fetchDishes])

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (value.trim() === '') {
      void fetchDishes()
    }
  }

  const onSearchAction = () => void fetchDishes(searchValue)

  const handlePick = (dish: Dish) => {
    Taro.setStorageSync(
      MEAL_LOG_DISH_PICK_KEY,
      JSON.stringify({
        id: dish.id,
        name: dish.name,
        image_url: dish.image_url || null,
      })
    )
    Taro.navigateBack()
  }

  if (!token) {
    return (
      <View className='pick-meal-dish-page index-page' style={{ padding: '40rpx' }}>
        <Text>请先登录</Text>
      </View>
    )
  }

  return (
    <View className='pick-meal-dish-page pick-dish-page index-page'>
      <View className='pick-banner'>选择一道你当天吃过的菜谱；返回编辑页后将自动关联并同步菜名。</View>
      <View className='search-container'>
        <AtSearchBar
          className='home-search-bar'
          value={searchValue}
          onChange={onSearchChange}
          onActionClick={onSearchAction}
          onConfirm={onSearchAction}
          placeholder='搜索菜谱...'
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
              <View key={dish.id} className='dish-card' onClick={() => handlePick(dish)}>
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

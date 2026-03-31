import { View, Text, ScrollView, Image } from '@tarojs/components'
import { AtSearchBar } from 'taro-ui'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { RootState } from '../../store'
import { setDishes, setLoading, setError } from '../../store/slices/dishSlice'
import { getDishes } from '../../services/dish'
import './index.scss'

export default function Index() {
  const dispatch = useDispatch()
  const { dishes, loading } = useSelector((state: RootState) => state.dish)
  const [searchValue, setSearchValue] = useState('')
  const skeletonCards = Array.from({ length: 6 })

  const fetchDishes = async (search?: string) => {
    dispatch(setLoading(true))
    try {
      const data = await getDishes({ search })
      dispatch(setDishes(data))
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to fetch dishes'))
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      dispatch(setLoading(false))
    }
  }

  useEffect(() => {
    fetchDishes()
  }, [])

  const onSearchChange = (value: string) => {
    setSearchValue(value)
  }

  const onSearchAction = () => {
    fetchDishes(searchValue)
  }

  const handleCardClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/dish-detail/index?id=${id}`
    })
  }

  return (
    <View className='index-page'>
      <View className='search-container'>
        <AtSearchBar
          className='home-search-bar'
          value={searchValue}
          onChange={onSearchChange}
          onActionClick={onSearchAction}
          placeholder='搜索想吃的菜...'
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
                    <View className='skeleton-author'>
                      <View className='skeleton-avatar' />
                      <View className='skeleton-line skeleton-w-55 skeleton-author-line' />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className='dish-grid'>
            {dishes.map((dish) => (
              <View key={dish.id} className='dish-card' onClick={() => handleCardClick(dish.id)}>
                <Image
                  className='dish-thumb'
                  src={dish.image_url || 'https://via.placeholder.com/400'}
                  mode='aspectFill'
                />
                <View className='dish-info'>
                  <Text className='dish-title'>{dish.name}</Text>
                  <Text className='dish-desc'>{dish.description != null ? dish.description : ''}</Text>
                  <View className='dish-author'>
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
            <Text className='empty-title'>还没有菜肴哦</Text>
            <Text className='empty-sub'>试试换个搜索关键词，或者稍后回来看看新内容。</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

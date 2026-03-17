import { View, Text, Image, ScrollView } from '@tarojs/components'
import { AtCard, AtSearchBar, AtTag, AtActivityIndicator } from 'taro-ui'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { RootState } from '../../store'
import { setDishes, setLoading, setError } from '../../store/slices/dishSlice'
import { getDishes } from '../../services/dish'
import './index.scss'

export default function Index() {
  const dispatch = useDispatch()
  const { dishes, loading, error } = useSelector((state: RootState) => state.dish)
  const [searchValue, setSearchValue] = useState('')

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

  const handleCardClick = (id: number) => {
    Taro.navigateTo({
      url: `/pages/dish-detail/index?id=${id}`
    })
  }

  return (
    <View className='index-page'>
      <View className='search-container'>
        <AtSearchBar
          value={searchValue}
          onChange={onSearchChange}
          onActionClick={onSearchAction}
          placeholder='搜索想吃的菜...'
        />
      </View>

      <ScrollView scrollY className='dish-list-container'>
        {loading && dishes.length === 0 ? (
          <View className='loading-container'>
            <AtActivityIndicator mode='center' content='努力加载中...' />
          </View>
        ) : (
          <View className='dish-grid'>
            {dishes.map((dish) => (
              <View key={dish.id} className='dish-card-wrapper' onClick={() => handleCardClick(dish.id)}>
                <AtCard
                  title={dish.name}
                  extra={dish.difficulty}
                  note={`烹饪时间: ${dish.cooking_time}分钟`}
                  thumb={dish.image_url || 'https://via.placeholder.com/150'}
                >
                  <View className='dish-card-content'>
                    <Text className='dish-desc'>{dish.description}</Text>
                    <View className='dish-info'>
                      <Text className='dish-user'>by {dish.user_nickname}</Text>
                      <View className='dish-stats'>
                        <Text className='stats-item'>👁️ {dish.view_count}</Text>
                        <Text className='stats-item'>⭐ {dish.average_rating ? Number(dish.average_rating).toFixed(1) : '新'}</Text>
                      </View>
                    </View>
                  </View>
                </AtCard>
              </View>
            ))}
          </View>
        )}
        
        {!loading && dishes.length === 0 && (
          <View className='no-data'>
            <Text>还没有菜肴哦，快去添加吧！</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

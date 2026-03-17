import { View, Text, Image, ScrollView } from '@tarojs/components'
import { AtTag, AtDivider, AtActivityIndicator, AtList, AtListItem } from 'taro-ui'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro, { useRouter } from '@tarojs/taro'
import { RootState } from '../../store'
import { setCurrentDish, setLoading, setError } from '../../store/slices/dishSlice'
import { getDishById } from '../../services/dish'
import './index.scss'

export default function DishDetail() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { id } = router.params
  const { currentDish, loading } = useSelector((state: RootState) => state.dish)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      dispatch(setLoading(true))
      try {
        const data = await getDishById(parseInt(id as string))
        dispatch(setCurrentDish(data))
      } catch (err: any) {
        dispatch(setError(err.message || 'Failed to fetch dish detail'))
        Taro.showToast({ title: '加载失败', icon: 'error' })
      } finally {
        dispatch(setLoading(false))
      }
    }

    fetchDetail()
    
    return () => {
      dispatch(setCurrentDish(null))
    }
  }, [id])

  if (loading || !currentDish) {
    return (
      <View className='loading-container'>
        <AtActivityIndicator mode='center' content='正在加载详情...' />
      </View>
    )
  }

  return (
    <ScrollView scrollY className='dish-detail-page'>
      <Image 
        className='dish-banner' 
        src={currentDish.image_url || 'https://via.placeholder.com/400'} 
        mode='aspectFill' 
      />
      
      <View className='content-container'>
        <View className='header-section'>
          <Text className='dish-title'>{currentDish.name}</Text>
          <View className='tags-row'>
            <AtTag size='small' circle active type='primary'>{currentDish.difficulty}</AtTag>
            <AtTag size='small' circle className='ml-2'>{currentDish.cooking_time}分钟</AtTag>
            {currentDish.tags?.map(tag => (
              <AtTag key={tag.id} size='small' circle className='ml-2' active>{tag.name}</AtTag>
            ))}
          </View>
          <Text className='dish-desc'>{currentDish.description}</Text>
        </View>

        <AtDivider content='食材清单' fontColor='#ff9900' lineColor='#ff9900' />
        <View className='ingredients-section'>
          <AtList>
            {currentDish.ingredients?.map((item, index) => (
              <AtListItem 
                key={index}
                title={item.name} 
                extraText={`${item.amount}${item.unit}`} 
              />
            ))}
          </AtList>
        </View>

        <AtDivider content='烹饪步骤' fontColor='#ff9900' lineColor='#ff9900' />
        <View className='steps-section'>
          {currentDish.steps?.map((step, index) => (
            <View key={index} className='step-item'>
              <View className='step-header'>
                <View className='step-number'>{step.step_number}</View>
                <Text className='step-text'>{step.description}</Text>
              </View>
              {step.image_url && (
                <Image className='step-image' src={step.image_url} mode='widthFix' />
              )}
            </View>
          ))}
        </View>

        <View className='footer-info'>
          <Text className='user-info'>由 {currentDish.user_nickname} 发布于 {new Date(currentDish.created_at).toLocaleDateString()}</Text>
          <View className='stats-row'>
            <Text>浏览 {currentDish.view_count}</Text>
            <Text className='ml-3'>分享 {currentDish.share_count}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

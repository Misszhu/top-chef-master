import { View, Text, Image, ScrollView, Picker } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { getMealLogs } from '../../../services/meal-log'
import type { MealLogEntry } from '../../../types/meal-log'
import { mealSlotLabel } from '../../../types/meal-log'
import { getApiErrorMessage } from '../../../utils/api-error'
import { shiftLocalDate, todayLocal } from '../../utils/date'
import './index.scss'

function isValidYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export default function MealDayPage() {
  const router = useRouter()
  const paramDate = typeof router.params.date === 'string' ? router.params.date : ''
  const { token } = useSelector((state: RootState) => state.user)

  const [date, setDate] = useState(() =>
    paramDate && isValidYmd(paramDate) ? paramDate : todayLocal()
  )
  const [entries, setEntries] = useState<MealLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setEntries([])
      return
    }
    setLoading(true)
    try {
      const { entries: list } = await getMealLogs(date, date, 1, 100)
      setEntries(list)
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [token, date])

  useDidShow(() => {
    void load()
  })

  const onPickerChange = (e: { detail: { value: string } }) => {
    setDate(e.detail.value)
  }

  const openEdit = (id?: string) => {
    const q = `date=${encodeURIComponent(date)}`
    if (id) {
      Taro.navigateTo({ url: `/package-meal/pages/meal-edit/index?id=${encodeURIComponent(id)}&${q}` })
    } else {
      Taro.navigateTo({ url: `/package-meal/pages/meal-edit/index?${q}` })
    }
  }

  if (!token) {
    return (
      <View className='meal-day-page'>
        <View className='empty'>
          <Text className='empty-title'>请先登录</Text>
          <Text className='empty-sub'>登录后可记录每日饮食</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='meal-day-page'>
      <View className='date-toolbar'>
        <Text className='date-nav' onClick={() => setDate((d) => shiftLocalDate(d, -1))}>
          前一天
        </Text>
        <Picker mode='date' value={date} onChange={onPickerChange}>
          <View className='date-center'>
            <Text className='date-text'>{date}</Text>
            <Text className='date-hint'>点此选择日期</Text>
          </View>
        </Picker>
        <Text className='date-nav' onClick={() => setDate((d) => shiftLocalDate(d, 1))}>
          后一天
        </Text>
      </View>

      <View className='fab-row'>
        <AtButton type='primary' onClick={() => openEdit()}>
          添加一条记录
        </AtButton>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 280rpx)' }}>
        {loading && entries.length === 0 ? (
          <View className='loading-box'>
            <Text>加载中…</Text>
          </View>
        ) : entries.length === 0 ? (
          <View className='empty'>
            <Text className='empty-title'>这一天还没有记录</Text>
            <Text className='empty-sub'>点击上方按钮记下吃了什么</Text>
          </View>
        ) : (
          entries.map((e) => (
            <View key={e.id} className='entry-card' onClick={() => openEdit(e.id)}>
              {e.dish_image_url ? (
                <Image className='entry-thumb' src={e.dish_image_url} mode='aspectFill' />
              ) : (
                <View className='entry-thumb' />
              )}
              <View className='entry-main'>
                <Text className='entry-title'>{e.title}</Text>
                <Text className='entry-meta'>
                  {mealSlotLabel(e.meal_slot) || '餐次未填'}
                  {e.dish_id ? ' · 关联菜谱' : ' · 自由记录'}
                </Text>
                {e.notes ? <Text className='entry-notes'>{e.notes}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

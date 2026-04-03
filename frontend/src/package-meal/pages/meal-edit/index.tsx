import { View, Text, Input, Picker, Image } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import {
  createMealLog,
  deleteMealLog,
  getMealLogById,
  updateMealLog,
} from '../../../services/meal-log'
import type { MealLogEntry, MealSlot } from '../../../types/meal-log'
import { MEAL_SLOT_OPTIONS } from '../../../types/meal-log'
import { getApiErrorMessage, isAxiosStatus } from '../../../utils/api-error'
import { todayLocal, toDateOnlyString } from '../../utils/date'
import { MEAL_LOG_DISH_PICK_KEY } from '../../constants'

function slotToIndex(slot: MealSlot | null | undefined): number {
  if (slot == null) return 0
  const i = MEAL_SLOT_OPTIONS.findIndex((o) => o.value === slot)
  return i >= 0 ? i : 0
}

function indexToSlot(idx: number): MealSlot | null {
  const v = MEAL_SLOT_OPTIONS[idx]?.value
  if (v === '' || v == null) return null
  return v
}

export default function MealEditPage() {
  const router = useRouter()
  const id = typeof router.params.id === 'string' && router.params.id ? router.params.id : ''
  const dateParam =
    typeof router.params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(router.params.date)
      ? router.params.date
      : todayLocal()

  const { token } = useSelector((state: RootState) => state.user)

  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [eatenDate, setEatenDate] = useState(dateParam)
  const [slotIndex, setSlotIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dishId, setDishId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [dishImageUrl, setDishImageUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id || !token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const e = await getMealLogById(id)
      setEatenDate(toDateOnlyString(String(e.eaten_date)))
      setSlotIndex(slotToIndex(e.meal_slot))
      setTitle(e.title)
      setNotes(e.notes || '')
      setDishId(e.dish_id)
      setVersion(e.version)
      setDishImageUrl(e.dish_image_url ?? null)
    } catch (err) {
      console.error(err)
      Taro.showToast({ title: getApiErrorMessage(err, '加载失败'), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useDidShow(() => {
    const raw = Taro.getStorageSync(MEAL_LOG_DISH_PICK_KEY)
    if (raw) {
      try {
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (p && typeof p.id === 'string') {
          setDishId(p.id)
          if (typeof p.name === 'string') setTitle(p.name)
          setDishImageUrl(typeof p.image_url === 'string' ? p.image_url : null)
        }
      } catch {
        /* ignore */
      }
      Taro.removeStorageSync(MEAL_LOG_DISH_PICK_KEY)
      return
    }
    if (id) void load()
    else {
      setLoading(false)
      setEatenDate(dateParam)
    }
  })

  const goPickDish = () => {
    Taro.navigateTo({ url: '/package-meal/pages/pick-dish/index' })
  }

  const clearDish = () => {
    setDishId(null)
    setDishImageUrl(null)
  }

  const save = async () => {
    if (!token) return
    const slot = indexToSlot(slotIndex)
    const notesVal = notes.trim() || null
    const eatenYmd = toDateOnlyString(eatenDate)
    if (eatenYmd > todayLocal()) {
      Taro.showToast({ title: '不建议记录未来日期', icon: 'none' })
    }

    if (!dishId && !title.trim()) {
      Taro.showToast({ title: '请填写菜名或选择菜谱', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      if (id) {
        const body: Parameters<typeof updateMealLog>[1] = {
          ifMatchVersion: version,
          eaten_date: eatenYmd,
          meal_slot: slot,
          notes: notesVal,
        }
        if (dishId) {
          body.dish_id = dishId
        } else {
          body.dish_id = null
          body.title = title.trim()
        }
        const e = await updateMealLog(id, body)
        setVersion(e.version)
        setTitle(e.title)
        setDishId(e.dish_id)
        setDishImageUrl(e.dish_image_url ?? null)
        Taro.showToast({ title: '已保存', icon: 'success' })
      } else {
        if (dishId) {
          await createMealLog({
            eaten_date: eatenYmd,
            meal_slot: slot,
            dish_id: dishId,
            notes: notesVal,
          })
        } else {
          await createMealLog({
            eaten_date: eatenYmd,
            meal_slot: slot,
            title: title.trim(),
            notes: notesVal,
          })
        }
        Taro.showToast({ title: '已添加', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 400)
      }
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '保存失败'), icon: 'none' })
      if (isAxiosStatus(e, 409) && id) void load()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = () => {
    if (!id) return
    Taro.showModal({
      title: '删除记录',
      content: '确定删除这条饮食记录？',
      success: (r) => {
        if (r.confirm) void runDelete()
      },
    })
  }

  const runDelete = async () => {
    if (!id) return
    try {
      await deleteMealLog(id)
      Taro.showToast({ title: '已删除', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 400)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '删除失败'), icon: 'none' })
    }
  }

  if (!token) {
    return (
      <View className='meal-edit-page'>
        <Text className='hint-muted'>请先登录</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View className='meal-edit-page'>
        <View className='loading-box'>
          <Text>加载中…</Text>
        </View>
      </View>
    )
  }

  const slotLabels = MEAL_SLOT_OPTIONS.map((o) => o.label)

  return (
    <View className='meal-edit-page'>
      <View className='section'>
        <Text className='field-label'>用餐日期</Text>
        <Picker mode='date' value={eatenDate} onChange={(e) => setEatenDate(e.detail.value)}>
          <View className='picker-value'>{eatenDate}</View>
        </Picker>
      </View>

      <View className='section'>
        <Text className='field-label'>餐次（可选）</Text>
        <Picker
          mode='selector'
          range={slotLabels}
          value={slotIndex}
          onChange={(e) => setSlotIndex(Number(e.detail.value))}
        >
          <View className='picker-value'>{slotLabels[slotIndex]}</View>
        </Picker>
      </View>

      <View className='section'>
        <Text className='field-label'>菜谱（可选）</Text>
        <View className='actions'>
          <AtButton size='small' onClick={goPickDish}>
            从菜谱库选择
          </AtButton>
          {dishId ? (
            <View className='dish-pill'>
              {dishImageUrl ? (
                <Image className='dish-pill-thumb' src={dishImageUrl} mode='aspectFill' />
              ) : null}
              <AtButton size='small' onClick={clearDish}>
                取消关联菜谱
              </AtButton>
            </View>
          ) : null}
        </View>
        <Text className='hint-muted'>关联菜谱后标题由服务端同步为菜谱名；无外食场景可只填下方菜名。</Text>
      </View>

      <View className='section'>
        <Text className='field-label'>菜名{dishId ? '（已关联菜谱时可不填）' : ''}</Text>
        <Input
          className='text-input'
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          placeholder={dishId ? '可选：保存时用菜谱名' : '必填，如：牛肉面、食堂套餐'}
          maxlength={80}
        />
      </View>

      <View className='section'>
        <Text className='field-label'>备注（可选）</Text>
        <Input
          className='text-input'
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
          placeholder='如：聚餐、外卖'
          maxlength={200}
        />
      </View>

      <View className='actions'>
        <AtButton type='primary' loading={saving} onClick={() => void save()}>
          {id ? '保存' : '添加'}
        </AtButton>
        {id ? <AtButton onClick={confirmDelete}>删除记录</AtButton> : null}
      </View>
    </View>
  )
}

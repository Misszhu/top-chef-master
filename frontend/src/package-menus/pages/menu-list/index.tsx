import { View, Text, ScrollView } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { addMenuItem, createMenu, getMenus } from '../../../services/menu'
import type { MenuSummary } from '../../../types/menu'
import { getApiErrorMessage } from '../../../utils/api-error'
import { scheduleNavigateAfterUiSettled } from '../../../utils/schedule-navigate'
import './index.scss'

export default function MenuListPage() {
  const router = useRouter()
  const pickDishId =
    typeof router.params.dishId === 'string' && router.params.dishId ? router.params.dishId : ''
  const { token } = useSelector((state: RootState) => state.user)
  const [menus, setMenus] = useState<MenuSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setMenus([])
      return
    }
    setLoading(true)
    try {
      const { menus: list } = await getMenus(1, 50, 'latest')
      setMenus(list)
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useDidShow(() => {
    void load()
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      const m = await createMenu({ name: '新菜单' })
      var navToNewMenu = () => {
        Taro.navigateTo({ url: `/package-menus/pages/menu-edit/index?id=${m.id}` })
      }
      if (pickDishId) {
        try {
          await addMenuItem(m.id, pickDishId, 1)
          Taro.showToast({ title: '已加入新菜单', icon: 'success' })
          scheduleNavigateAfterUiSettled(navToNewMenu)
          return
        } catch (e) {
          Taro.showToast({ title: getApiErrorMessage(e, '已创建菜单，但加入菜品失败'), icon: 'none' })
        }
      }
      navToNewMenu()
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '创建失败'), icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  if (!token) {
    return (
      <View className='menu-list-page'>
        <View className='no-data'>
          <Text className='empty-title'>请先登录</Text>
          <Text className='empty-sub'>登录后可创建聚餐菜单、从菜谱加入菜品</Text>
        </View>
      </View>
    )
  }

  const openMenu = async (m: MenuSummary) => {
    if (pickDishId) {
      try {
        await addMenuItem(m.id, pickDishId, 1)
        Taro.showToast({ title: `已加入「${m.name}」`, icon: 'success' })
        scheduleNavigateAfterUiSettled(() => {
          Taro.navigateTo({ url: `/package-menus/pages/menu-edit/index?id=${m.id}` })
        })
        return
      } catch (e) {
        console.log(e)
        Taro.showToast({ title: getApiErrorMessage(e, '加入失败'), icon: 'none' })
        return
      }
    }
    Taro.navigateTo({ url: `/package-menus/pages/menu-edit/index?id=${m.id}` })
  }

  return (
    <View className='menu-list-page'>
      {pickDishId ? (
        <View style={{ padding: '20rpx 30rpx', background: 'rgba(255,153,0,0.12)' }}>
          <Text style={{ fontSize: '26rpx', color: '#666' }}>请选择要加入的菜单（将本道菜加入后进入编辑页）</Text>
        </View>
      ) : null}
      <View className='toolbar'>
        <AtButton type='primary' loading={creating} onClick={handleCreate}>
          新建菜单
        </AtButton>
      </View>
      <ScrollView scrollY style={{ height: pickDishId ? 'calc(100vh - 220rpx)' : 'calc(100vh - 120rpx)' }}>
        {loading && menus.length === 0 ? (
          <View className='loading-container'>
            <Text>加载中…</Text>
          </View>
        ) : menus.length === 0 ? (
          <View className='no-data'>
            <Text className='empty-title'>还没有菜单</Text>
            <Text className='empty-sub'>点击「新建菜单」开始规划聚餐菜品</Text>
          </View>
        ) : (
          menus.map((m) => (
            <View key={m.id} className='menu-card' onClick={() => void openMenu(m)}>
              <Text className='menu-card-title'>{m.name}</Text>
              <Text className='menu-card-meta'>
                {Number(m.item_count) || 0} 道菜 · 更新于 {new Date(m.updated_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

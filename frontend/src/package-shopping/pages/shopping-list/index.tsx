import { View, Text, ScrollView } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { createShoppingList, getShoppingLists } from '../../../services/shopping-list'
import type { ShoppingListSummary } from '../../../types/shopping-list'
import { getApiErrorMessage } from '../../../utils/api-error'
import './index.scss'

export default function ShoppingListPage() {
  const { token } = useSelector((state: RootState) => state.user)
  const [lists, setLists] = useState<ShoppingListSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setLists([])
      return
    }
    setLoading(true)
    try {
      const { lists: data } = await getShoppingLists(1, 50)
      setLists(data)
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setLists([])
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
      const d = await createShoppingList()
      Taro.navigateTo({ url: `/package-shopping/pages/shopping-detail/index?id=${d.id}` })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '创建失败'), icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  if (!token) {
    return (
      <View className='shopping-list-page'>
        <View className='no-data'>
          <Text className='empty-title'>请先登录</Text>
          <Text className='empty-sub'>登录后可管理购物清单</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='shopping-list-page'>
      <View className='toolbar'>
        <AtButton type='primary' loading={creating} onClick={() => void handleCreate()}>
          新建清单
        </AtButton>
      </View>
      <ScrollView scrollY style={{ height: 'calc(100vh - 120rpx)' }}>
        {loading && lists.length === 0 ? (
          <View className='loading-container'>
            <Text>加载中…</Text>
          </View>
        ) : lists.length === 0 ? (
          <View className='no-data'>
            <Text className='empty-title'>还没有购物清单</Text>
            <Text className='empty-sub'>可从菜单页「生成购物清单」，或在此新建空白清单</Text>
          </View>
        ) : (
          lists.map((s) => (
            <View
              key={s.id}
              className='list-card'
              onClick={() =>
                Taro.navigateTo({ url: `/package-shopping/pages/shopping-detail/index?id=${s.id}` })
              }
            >
              <Text className='list-card-title'>
                {s.menu_name ? `「${s.menu_name}」采购` : '购物清单'}
              </Text>
              <Text className='list-card-meta'>
                {Number(s.item_count) || 0} 项食材 · 更新于 {new Date(s.updated_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

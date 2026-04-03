import { View, Text, Input, Textarea, Image, ScrollView } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useMemo, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import {
  copyMenu,
  deleteMenu,
  getMenuById,
  removeMenuItem,
  reorderMenuItems,
  updateMenu,
  updateMenuItem,
} from '../../../services/menu'
import type { MenuDetail, MenuDishItem } from '../../../types/menu'
import { getApiErrorMessage, isAxiosStatus } from '../../../utils/api-error'
import { scheduleNavigateAfterUiSettled } from '../../../utils/schedule-navigate'
import './index.scss'

function sortDishes(dishes: MenuDishItem[]): MenuDishItem[] {
  return [...dishes].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
}

export default function MenuEditPage() {
  const router = useRouter()
  const id = router.params.id as string | undefined
  const { token } = useSelector((state: RootState) => state.user)

  const [menu, setMenu] = useState<MenuDetail | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copyBusy, setCopyBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id || !token) {
      setMenu(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const m = await getMenuById(id)
      setMenu(m)
      setName(m.name)
      setDesc(m.description || '')
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setMenu(null)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useDidShow(() => {
    void load()
  })

  const sortedDishes = useMemo(() => (menu ? sortDishes(menu.dishes) : []), [menu])

  const mergeVersion = (v: number) => {
    setMenu((prev) => (prev ? { ...prev, version: v } : prev))
  }

  const saveMeta = async () => {
    if (!menu || !id) return
    const n = name.trim()
    if (!n) {
      Taro.showToast({ title: '请填写菜单名称', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const m = await updateMenu(id, {
        name: n,
        description: desc.trim() || null,
        ifMatchVersion: menu.version,
      })
      setMenu(m)
      setName(m.name)
      setDesc(m.description || '')
      Taro.showToast({ title: '菜单信息已保存', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '保存失败'), icon: 'none' })
      if (isAxiosStatus(e, 409)) {
        void load()
      }
    } finally {
      setSaving(false)
    }
  }

  const applyReorder = async (ordered: MenuDishItem[]) => {
    if (!id) return
    const itemIds = ordered.map((x) => x.id)
    try {
      const { menu_version } = await reorderMenuItems(id, itemIds)
      mergeVersion(menu_version)
      const m = await getMenuById(id)
      setMenu(m)
      setName(m.name)
      setDesc(m.description || '')
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '排序失败'), icon: 'none' })
      void load()
    }
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const next = [...sortedDishes]
    const t = next[index - 1]
    next[index - 1] = next[index]
    next[index] = t
    void applyReorder(next)
  }

  const moveDown = (index: number) => {
    if (index >= sortedDishes.length - 1) return
    const next = [...sortedDishes]
    const t = next[index + 1]
    next[index + 1] = next[index]
    next[index] = t
    void applyReorder(next)
  }

  const handleRemoveItem = (itemId: string) => {
    if (!id) return
    Taro.showModal({
      title: '移除菜品',
      content: '确定从菜单中移除这道菜？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const { menu_version } = await removeMenuItem(id, itemId)
          mergeVersion(menu_version)
          const m = await getMenuById(id)
          setMenu(m)
        } catch (e) {
          Taro.showToast({ title: getApiErrorMessage(e, '移除失败'), icon: 'none' })
        }
      },
    })
  }

  const handleServingsBlur = async (item: MenuDishItem, raw: string) => {
    if (!id) return
    const s = Number(raw)
    const cur = Number(item.servings)
    if (Number.isNaN(s) || s <= 0 || s > 999) {
      Taro.showToast({ title: '份量需在 1～999', icon: 'none' })
      void load()
      return
    }
    if (s === cur) return
    try {
      const { menu_version } = await updateMenuItem(id, item.id, { servings: s })
      mergeVersion(menu_version)
      const m = await getMenuById(id)
      setMenu(m)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '更新份量失败'), icon: 'none' })
      void load()
    }
  }

  const handleCopy = async () => {
    if (!id) return
    setCopyBusy(true)
    try {
      const m = await copyMenu(id)
      Taro.showToast({ title: '已复制', icon: 'success' })
      scheduleNavigateAfterUiSettled(() => {
        Taro.redirectTo({ url: `/package-menus/pages/menu-edit/index?id=${m.id}` })
      })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '复制失败'), icon: 'none' })
    } finally {
      setCopyBusy(false)
    }
  }

  const handleDeleteMenu = () => {
    if (!id) return
    Taro.showModal({
      title: '删除菜单',
      content: '删除后不可恢复，确定删除？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteMenu(id)
          Taro.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 400)
        } catch (e) {
          Taro.showToast({ title: getApiErrorMessage(e, '删除失败'), icon: 'none' })
        }
      },
    })
  }

  const goPickDishes = () => {
    if (!id) return
    Taro.navigateTo({ url: `/package-recipes/pages/pick-dish-for-menu/index?menuId=${encodeURIComponent(id)}` })
  }

  if (!token) {
    return (
      <View className='menu-edit-page'>
        <Text className='hint-muted'>请先登录</Text>
      </View>
    )
  }

  if (!id) {
    return (
      <View className='menu-edit-page'>
        <Text className='hint-muted'>缺少菜单 id</Text>
      </View>
    )
  }

  if (loading || !menu) {
    return (
      <View className='menu-edit-page'>
        <View className='loading-box'>
          <Text>{loading ? '加载中…' : '菜单不存在'}</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='menu-edit-page' style={{ height: '100vh' }}>
      <View className='section section-menu-meta'>
        <Text className='section-title'>菜单信息</Text>
        <Text className='field-label'>名称</Text>
        <Input className='text-input' value={name} onInput={(e) => setName(e.detail.value)} maxlength={30} />
        <Text className='field-label'>描述</Text>
        <Textarea
          className='textarea-input'
          value={desc}
          onInput={(e) => setDesc(e.detail.value)}
          maxlength={500}
          placeholder='可选：聚餐主题、人数等'
        />
        <View className='actions-row'>
          <AtButton type='primary' size='small' loading={saving} onClick={saveMeta}>
            保存菜单信息
          </AtButton>
          <AtButton size='small' loading={copyBusy} onClick={handleCopy}>
            复制菜单
          </AtButton>
          <AtButton size='small' onClick={handleDeleteMenu}>
            删除菜单
          </AtButton>
        </View>
      </View>

      <View className='section'>
        <View className='section-title-row'>
          <Text className='section-title'>菜品（{sortedDishes.length}）</Text>
          <AtButton size='small' type='secondary' onClick={goPickDishes}>
            添加菜谱
          </AtButton>
        </View>
        {sortedDishes.length === 0 ? (
          <Text className='hint-muted'>点击「添加菜谱」从发现列表选菜，或在任意菜谱详情页点「加入菜单」。</Text>
        ) : (
          sortedDishes.map((item, index) => (
            <View key={item.id} className='item-row'>
              <Image
                className='item-thumb'
                src={item.dish_image_url || 'https://via.placeholder.com/200'}
                mode='aspectFill'
                onClick={() => Taro.navigateTo({ url: `/package-recipes/pages/dish-detail/index?id=${item.dish_id}` })}
              />
              <View className='item-main'>
                <Text
                  className='item-name'
                  onClick={() => Taro.navigateTo({ url: `/package-recipes/pages/dish-detail/index?id=${item.dish_id}` })}
                >
                  {item.dish_name || '菜谱'}
                </Text>
                <Text className='field-label'>份量（可小数）</Text>
                <Input
                  key={`${item.id}-v${menu.version}`}
                  className='servings-input'
                  type='digit'
                  defaultValue={String(item.servings)}
                  onBlur={(e) => handleServingsBlur(item, e.detail.value)}
                />
                <View className='item-actions'>
                  <AtButton size='small' disabled={index === 0} onClick={() => moveUp(index)}>
                    上移
                  </AtButton>
                  <AtButton size='small' disabled={index === sortedDishes.length - 1} onClick={() => moveDown(index)}>
                    下移
                  </AtButton>
                  <AtButton size='small' onClick={() => handleRemoveItem(item.id)}>
                    移除
                  </AtButton>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

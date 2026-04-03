import { View, Text, Input, ScrollView } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useCallback, useMemo, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import {
  addShoppingListItem,
  deleteShoppingList,
  deleteShoppingListItem,
  getShoppingListById,
  refreshShoppingListFromMenu,
  updateShoppingListItem,
  updateShoppingListMeta,
} from '../../../services/shopping-list'
import type { ShoppingListDetail, ShoppingListItem } from '../../../types/shopping-list'
import { getApiErrorMessage, isAxiosStatus } from '../../../utils/api-error'
import './index.scss'

function sortItems(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((a, b) => {
    const sa = a.sequence ?? 0
    const sb = b.sequence ?? 0
    if (sa !== sb) return sa - sb
    return a.ingredient_name.localeCompare(b.ingredient_name, 'zh-Hans-CN')
  })
}

function groupByCategory(sorted: ShoppingListItem[]): [string, ShoppingListItem[]][] {
  const m = new Map<string, ShoppingListItem[]>()
  for (const it of sorted) {
    const c = it.category || '其他'
    if (!m.has(c)) m.set(c, [])
    m.get(c)!.push(it)
  }
  return Array.from(m.entries())
}

export default function ShoppingDetailPage() {
  const router = useRouter()
  const id = router.params.id as string | undefined
  const { token } = useSelector((state: RootState) => state.user)

  const [detail, setDetail] = useState<ShoppingListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [costInput, setCostInput] = useState('')
  const [savingCost, setSavingCost] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addUnit, setAddUnit] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addBusy, setAddBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id || !token) {
      setDetail(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const d = await getShoppingListById(id)
      setDetail(d)
      setCostInput(d.estimated_cost != null ? String(d.estimated_cost) : '')
    } catch (e) {
      console.error(e)
      Taro.showToast({ title: getApiErrorMessage(e, '加载失败'), icon: 'none' })
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useDidShow(() => {
    void load()
  })

  const grouped = useMemo(() => {
    if (!detail?.items) return []
    return groupByCategory(sortItems(detail.items))
  }, [detail])

  const mergeItems = (items: ShoppingListItem[], version: number) => {
    setDetail((d) => (d ? { ...d, items, version } : d))
  }

  const toggleCheck = async (item: ShoppingListItem) => {
    if (!detail) return
    try {
      const r = await updateShoppingListItem(detail.id, item.id, { is_checked: !item.is_checked })
      mergeItems(r.items, r.list_version)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '更新失败'), icon: 'none' })
      void load()
    }
  }

  const onQtyBlur = async (item: ShoppingListItem, raw: string) => {
    if (!detail) return
    const t = raw.trim()
    const next = t === '' ? null : parseFloat(t)
    if (t !== '' && !Number.isFinite(next as number)) {
      Taro.showToast({ title: '数量格式无效', icon: 'none' })
      return
    }
    const prevStr = item.quantity != null ? String(item.quantity) : ''
    const prev = prevStr === '' ? null : parseFloat(prevStr)
    const same =
      (next == null && prev == null) ||
      (next != null && prev != null && Number.isFinite(next) && Number.isFinite(prev) && Math.abs(next - prev) < 1e-9)
    if (same) return
    try {
      const r = await updateShoppingListItem(detail.id, item.id, { quantity: next })
      mergeItems(r.items, r.list_version)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '更新失败'), icon: 'none' })
      void load()
    }
  }

  const onNotesBlur = async (item: ShoppingListItem, raw: string) => {
    if (!detail) return
    const next = raw.trim() || null
    const prev = item.notes != null && String(item.notes).trim() ? String(item.notes).trim() : null
    if (next === prev) return
    try {
      const r = await updateShoppingListItem(detail.id, item.id, { notes: next })
      mergeItems(r.items, r.list_version)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '更新失败'), icon: 'none' })
      void load()
    }
  }

  const saveCost = async () => {
    if (!detail) return
    const t = costInput.trim()
    const num = t === '' ? null : parseFloat(t)
    if (t !== '' && !Number.isFinite(num as number)) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    setSavingCost(true)
    try {
      const d = await updateShoppingListMeta(detail.id, {
        estimated_cost: num,
        ifMatchVersion: detail.version,
      })
      setDetail(d)
      setCostInput(d.estimated_cost != null ? String(d.estimated_cost) : '')
      Taro.showToast({ title: '已保存预估', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '保存失败'), icon: 'none' })
      if (isAxiosStatus(e, 409)) void load()
    } finally {
      setSavingCost(false)
    }
  }

  const confirmFromMenu = () => {
    if (!detail?.menu_id) return
    Taro.showModal({
      title: '重新合并',
      content: '将按当前菜单覆盖清单内全部食材，已勾选状态会丢失。是否继续？',
      success: (r) => {
        if (r.confirm) void runFromMenu()
      },
    })
  }

  const runFromMenu = async () => {
    if (!detail?.menu_id) return
    setSyncBusy(true)
    try {
      const d = await refreshShoppingListFromMenu(detail.id, detail.menu_id)
      setDetail(d)
      setCostInput(d.estimated_cost != null ? String(d.estimated_cost) : '')
      Taro.showToast({ title: '已更新', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '合并失败'), icon: 'none' })
    } finally {
      setSyncBusy(false)
    }
  }

  const confirmDeleteList = () => {
    if (!detail) return
    Taro.showModal({
      title: '删除清单',
      content: '确定删除该购物清单？',
      success: (r) => {
        if (r.confirm) void runDeleteList()
      },
    })
  }

  const runDeleteList = async () => {
    if (!detail) return
    try {
      await deleteShoppingList(detail.id)
      Taro.showToast({ title: '已删除', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 400)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '删除失败'), icon: 'none' })
    }
  }

  const removeItem = (item: ShoppingListItem) => {
    if (!detail) return
    Taro.showModal({
      title: '移除食材',
      content: `确定移除「${item.ingredient_name}」？`,
      success: (r) => {
        if (r.confirm) void runRemoveItem(item.id)
      },
    })
  }

  const runRemoveItem = async (itemId: string) => {
    if (!detail) return
    try {
      const r = await deleteShoppingListItem(detail.id, itemId)
      mergeItems(r.items, r.list_version)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '移除失败'), icon: 'none' })
    }
  }

  const submitAdd = async () => {
    if (!detail) return
    const name = addName.trim()
    if (!name) {
      Taro.showToast({ title: '请填写食材名称', icon: 'none' })
      return
    }
    const qt = addQty.trim()
    const qty = qt === '' ? null : parseFloat(qt)
    if (qt !== '' && !Number.isFinite(qty as number)) {
      Taro.showToast({ title: '数量格式无效', icon: 'none' })
      return
    }
    setAddBusy(true)
    try {
      const r = await addShoppingListItem(detail.id, {
        ingredient_name: name,
        quantity: qty,
        unit: addUnit.trim() || null,
        notes: addNotes.trim() || null,
      })
      mergeItems(r.items, r.list_version)
      setAddName('')
      setAddQty('')
      setAddUnit('')
      setAddNotes('')
      setShowAdd(false)
      Taro.showToast({ title: '已添加', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '添加失败'), icon: 'none' })
    } finally {
      setAddBusy(false)
    }
  }

  if (!token) {
    return (
      <View className='shopping-detail-page'>
        <Text className='hint-muted' style={{ padding: 40 }}>
          请先登录
        </Text>
      </View>
    )
  }

  if (!id) {
    return (
      <View className='shopping-detail-page'>
        <Text className='hint-muted' style={{ padding: 40 }}>
          缺少清单 id
        </Text>
      </View>
    )
  }

  if (loading || !detail) {
    return (
      <View className='shopping-detail-page'>
        <View className='loading-box'>
          <Text>{loading ? '加载中…' : '清单不存在'}</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='shopping-detail-page' style={{ height: '100vh' }}>
      <View className='section'>
        <Text className='section-title'>预估花费（元）</Text>
        <Text className='hint-muted'>保存时使用乐观锁；若其他端已改，请按提示刷新。</Text>
        <View className='cost-row' style={{ marginTop: 16 }}>
          <Input
            className='cost-input'
            type='digit'
            value={costInput}
            onInput={(e) => setCostInput(e.detail.value)}
            placeholder='可选'
          />
          <AtButton size='small' type='primary' loading={savingCost} onClick={() => void saveCost()}>
            保存
          </AtButton>
        </View>
        {detail.menu_id ? (
          <View className='actions-row'>
            <AtButton size='small' loading={syncBusy} onClick={confirmFromMenu}>
              从关联菜单重新合并
            </AtButton>
          </View>
        ) : null}
        <View className='actions-row'>
          <AtButton size='small' onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? '收起添加' : '手动添加食材'}
          </AtButton>
          <AtButton size='small' onClick={confirmDeleteList}>
            删除清单
          </AtButton>
        </View>
        {showAdd ? (
          <View className='add-panel'>
            <Text className='field-label'>名称</Text>
            <Input className='mini-input' value={addName} onInput={(e) => setAddName(e.detail.value)} maxlength={100} />
            <Text className='field-label'>数量（可选）</Text>
            <Input className='mini-input' type='digit' value={addQty} onInput={(e) => setAddQty(e.detail.value)} />
            <Text className='field-label'>单位（可选）</Text>
            <Input className='mini-input' value={addUnit} onInput={(e) => setAddUnit(e.detail.value)} maxlength={20} />
            <Text className='field-label'>备注（可选）</Text>
            <Input className='mini-input' value={addNotes} onInput={(e) => setAddNotes(e.detail.value)} maxlength={500} />
            <View style={{ marginTop: 16 }}>
              <AtButton size='small' type='primary' loading={addBusy} onClick={() => void submitAdd()}>
                确认添加
              </AtButton>
            </View>
          </View>
        ) : null}
      </View>

      {detail.items.length === 0 ? (
        <View className='section'>
          <Text className='hint-muted'>暂无食材。可从菜单生成清单，或手动添加。</Text>
        </View>
      ) : (
        grouped.map(([cat, items]) => (
          <View key={cat}>
            <Text className='category-title'>{cat}</Text>
            {items.map((item) => (
              <View key={item.id} className='item-row'>
                <View className='item-head'>
                  <View
                    className={`check-box ${item.is_checked ? 'on' : ''}`}
                    onClick={() => void toggleCheck(item)}
                  >
                    {item.is_checked ? <Text>✓</Text> : null}
                  </View>
                  <View className='item-main'>
                    <Text className={`item-name ${item.is_checked ? 'checked' : ''}`}>{item.ingredient_name}</Text>
                    <Text className='field-label'>数量 / 单位</Text>
                    <Input
                      key={`${item.id}-q-${detail.version}`}
                      className='mini-input'
                      type='digit'
                      defaultValue={item.quantity != null ? String(item.quantity) : ''}
                      onBlur={(e) => void onQtyBlur(item, e.detail.value)}
                    />
                    <Text className='field-label'>备注</Text>
                    <Input
                      key={`${item.id}-n-${detail.version}`}
                      className='mini-input'
                      defaultValue={item.notes || ''}
                      onBlur={(e) => void onNotesBlur(item, e.detail.value)}
                    />
                    <View style={{ marginTop: 12 }}>
                      <AtButton size='small' onClick={() => removeItem(item)}>
                        移除
                      </AtButton>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}

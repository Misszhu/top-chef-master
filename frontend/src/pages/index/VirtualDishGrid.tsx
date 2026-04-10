import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dish } from '../../types/dish'

/** 与首页双列卡片行高（rpx）对齐，用于估算滚动窗口；略大于实际卡片可减少穿帮 */
const ROW_HEIGHT_RPX = 392
const BUFFER_ROWS = 5
const NEAR_BOTTOM_PX = 200

function rpxToPx(rpx: number): number {
  try {
    const { windowWidth = 375 } = Taro.getSystemInfoSync()
    return (rpx / 750) * windowWidth
  } catch {
    return (rpx / 750) * 375
  }
}

export type VirtualDishGridProps = {
  dishes: Dish[]
  /** 列表重置（搜索/首屏）时递增，用于重置滚动位置 */
  listEpoch: number
  userInfo: { id?: string } | null
  hasMore: boolean
  loadingMore: boolean
  onNearBottom: () => void
  onCardClick: (id: string) => void
}

export function VirtualDishGrid(props: VirtualDishGridProps) {
  const { dishes, listEpoch, userInfo, hasMore, loadingMore, onNearBottom, onCardClick } = props

  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(400)
  const rowHeightPx = useMemo(() => rpxToPx(ROW_HEIGHT_RPX), [])
  const numRows = Math.ceil(dishes.length / 2)
  const totalHeightPx = numRows * rowHeightPx

  const nearBottomCooldownRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      Taro.createSelectorQuery()
        .select('.dish-list-container')
        .boundingClientRect((rect) => {
          const r = Array.isArray(rect) ? rect[0] : rect
          if (r && typeof r.height === 'number' && r.height > 0) {
            setViewportH(r.height)
          }
        })
        .exec()
    }, 48)
    return () => clearTimeout(t)
  }, [listEpoch, dishes.length])

  const { startRow, endRow } = useMemo(() => {
    if (numRows === 0) return { startRow: 0, endRow: -1 }
    const first = Math.floor(scrollTop / rowHeightPx)
    const last = Math.ceil((scrollTop + viewportH) / rowHeightPx) - 1
    const startRow = Math.max(0, first - BUFFER_ROWS)
    const endRow = Math.min(numRows - 1, last + BUFFER_ROWS)
    return { startRow, endRow }
  }, [scrollTop, viewportH, rowHeightPx, numRows])

  const onScroll = useCallback(
    (e: { detail?: { scrollTop?: number; scrollHeight?: number } }) => {
      const st = e.detail?.scrollTop ?? 0
      const sh = e.detail?.scrollHeight

      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setScrollTop(st)

        if (
          sh &&
          viewportH > 0 &&
          st + viewportH > sh - NEAR_BOTTOM_PX &&
          hasMore &&
          !loadingMore &&
          !nearBottomCooldownRef.current
        ) {
          nearBottomCooldownRef.current = true
          onNearBottom()
          setTimeout(() => {
            nearBottomCooldownRef.current = false
          }, 500)
        }
      })
    },
    [viewportH, hasMore, loadingMore, onNearBottom]
  )

  const topSpacer = startRow * rowHeightPx
  const bottomSpacer = Math.max(0, (numRows - endRow - 1) * rowHeightPx)

  const rowIndices: number[] = []
  for (let r = startRow; r <= endRow; r++) rowIndices.push(r)

  const goAuthor = (e: { stopPropagation?: () => void }, dish: Dish) => {
    e.stopPropagation?.()
    if (!dish.user_id) return
    if (userInfo?.id === dish.user_id) return
    Taro.navigateTo({
      url: `/package-user/pages/user-profile/index?id=${dish.user_id}`,
    })
  }

  const onScrollToLower = useCallback(() => {
    if (!hasMore || loadingMore || nearBottomCooldownRef.current) return
    nearBottomCooldownRef.current = true
    onNearBottom()
    setTimeout(() => {
      nearBottomCooldownRef.current = false
    }, 500)
  }, [hasMore, loadingMore, onNearBottom])

  return (
    <ScrollView
      key={`home-vscroll-${listEpoch}`}
      scrollY
      className='dish-list-container'
      enhanced
      showScrollbar={false}
      scrollWithAnimation={false}
      lowerThreshold={120}
      onScroll={onScroll}
      onScrollToLower={onScrollToLower}
    >
      <View className='virtual-dish-scroll-inner' style={{ minHeight: totalHeightPx > 0 ? totalHeightPx : undefined }}>
        {numRows > 0 ? <View style={{ height: topSpacer }} /> : null}
        {rowIndices.map((rowIdx) => (
          <View key={rowIdx} className='virtual-dish-row' style={{ height: `${ROW_HEIGHT_RPX}rpx` }}>
            {[0, 1].map((col) => {
              const dish = dishes[rowIdx * 2 + col]
              if (!dish) {
                return <View key={`e-${col}`} className='virtual-dish-cell virtual-dish-cell--empty' />
              }
              return (
                <View key={dish.id} className='virtual-dish-cell'>
                  <View className='dish-card' onClick={() => onCardClick(dish.id)}>
                    <Image
                      className='dish-thumb'
                      src={dish.image_url || 'https://via.placeholder.com/400'}
                      mode='aspectFill'
                    />
                    <View className='dish-info'>
                      <Text className='dish-title'>{dish.name}</Text>
                      <Text className='dish-desc'>{dish.description != null ? dish.description : ''}</Text>
                      <View
                        className='dish-author'
                        onClick={(ev) => goAuthor(ev, dish)}
                      >
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
                </View>
              )
            })}
          </View>
        ))}
        {numRows > 0 ? <View style={{ height: bottomSpacer }} /> : null}
      </View>

      {loadingMore ? (
        <View className='load-more-hint'>
          <Text className='load-more-text'>加载中…</Text>
        </View>
      ) : null}
      {!loadingMore && dishes.length > 0 && !hasMore ? (
        <View className='load-more-hint'>
          <Text className='load-more-text load-more-text--muted'>没有更多了</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

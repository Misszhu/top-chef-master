import { View, Text, ScrollView } from '@tarojs/components'
import { AtSearchBar } from 'taro-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { store, RootState } from '../../store'
import { setDishes, appendDishes, setLoading, setError } from '../../store/slices/dishSlice'
import { getDishes } from '../../services/dish'
import type { DishQueryFilters } from '../../types/dish'
import { VirtualDishGrid } from './VirtualDishGrid'
import './index.scss'

const PAGE_SIZE = 20
const HOME_LIST_SORT = 'latest'

type ListOverrides = Partial<Pick<DishQueryFilters, 'search'>>

export default function Index() {
  const dispatch = useDispatch()
  const { dishes, loading } = useSelector((state: RootState) => state.dish)
  const { userInfo } = useSelector((state: RootState) => state.user)
  const [searchValue, setSearchValue] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [listEpoch, setListEpoch] = useState(0)

  const hasMoreRef = useRef(true)
  const lastPageRef = useRef(0)
  const loadingMoreRef = useRef(false)
  /** 避免首屏加载后 bump listEpoch 导致虚拟列表 ScrollView 无意义重挂 */
  const didInitialListLoadRef = useRef(false)

  const skeletonCards = Array.from({ length: 6 })

  const fetchDishes = useCallback(
    async (reset: boolean, overrides?: ListOverrides) => {
      if (!reset) {
        if (loadingMoreRef.current || !hasMoreRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        dispatch(setLoading(true))
        hasMoreRef.current = true
      }

      const page = reset ? 1 : lastPageRef.current + 1
      const q = (overrides?.search !== undefined ? overrides.search : searchValue).trim()

      try {
        const { data, pagination } = await getDishes({
          ...(q ? { search: q } : {}),
          sort: HOME_LIST_SORT,
          page,
          limit: PAGE_SIZE,
        })

        if (reset) {
          dispatch(setDishes(data))
          lastPageRef.current = 1
          if (didInitialListLoadRef.current) {
            setListEpoch((e) => e + 1)
          }
          didInitialListLoadRef.current = true
        } else {
          dispatch(appendDishes(data))
          lastPageRef.current = page
        }

        const totalLoaded = store.getState().dish.dishes.length
        const total = pagination.total
        let more = false
        if (data.length === 0) {
          more = false
        } else if (typeof total === 'number' && total > 0) {
          more = totalLoaded < total
        } else {
          // total 缺失或为 0 时避免误判：满页则假定仍有下一页（适配异常响应或旧客户端）
          more = data.length >= PAGE_SIZE
        }
        hasMoreRef.current = more
        setHasMore(more)
      } catch (err: any) {
        dispatch(setError(err.message || 'Failed to fetch dishes'))
        Taro.showToast({ title: '加载失败', icon: 'error' })
        if (!reset) {
          hasMoreRef.current = false
          setHasMore(false)
        }
      } finally {
        if (reset) {
          dispatch(setLoading(false))
        } else {
          loadingMoreRef.current = false
          setLoadingMore(false)
        }
      }
    },
    [dispatch, searchValue]
  )

  useEffect(() => {
    void fetchDishes(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅首屏
  }, [])

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (value.trim() === '') {
      void fetchDishes(true, { search: '' })
    }
  }

  const onSearchAction = () => {
    void fetchDishes(true, { search: searchValue })
  }

  const handleNearBottom = useCallback(() => {
    if (loading || loadingMore || !hasMoreRef.current) return
    void fetchDishes(false)
  }, [loading, loadingMore, fetchDishes])

  const handleCardClick = (id: string) => {
    Taro.navigateTo({
      url: `/package-recipes/pages/dish-detail/index?id=${id}`,
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
          onConfirm={onSearchAction}
          placeholder='搜索想吃的菜...'
        />
      </View>

      {loading && dishes.length === 0 ? (
        <ScrollView scrollY className='dish-list-container'>
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
        </ScrollView>
      ) : !loading && dishes.length === 0 ? (
        <ScrollView scrollY className='dish-list-container'>
          <View className='no-data'>
            <Text className='empty-title'>还没有菜肴哦</Text>
            <Text className='empty-sub'>试试换个搜索关键词，或者稍后回来看看新内容。</Text>
          </View>
        </ScrollView>
      ) : (
        <VirtualDishGrid
          dishes={dishes}
          listEpoch={listEpoch}
          userInfo={userInfo ?? null}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onNearBottom={handleNearBottom}
          onCardClick={handleCardClick}
        />
      )}
    </View>
  )
}

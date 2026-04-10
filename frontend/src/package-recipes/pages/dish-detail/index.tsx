import { View, Text, Image, ScrollView, Textarea, Button } from '@tarojs/components'
import { AtTag, AtDivider, AtActivityIndicator, AtList, AtListItem, AtButton } from 'taro-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro, { useDidShow, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { RootState } from '../../../store'
import { setCurrentDish, setLoading, setError } from '../../../store/slices/dishSlice'
import { getDishById, likeDish, unlikeDish } from '../../../services/dish'
import { addFavorite, removeFavorite } from '../../../services/favorite'
import { recordShare } from '../../../services/share'
import { addMenuItem, createMenu, getMenus } from '../../../services/menu'
import {
  getCommentsByDishId,
  upsertComment,
  updateComment,
  deleteComment,
} from '../../../services/comment'
import type { Comment } from '../../../types/comment'
import { getApiErrorCode, getApiErrorMessage, isAxiosStatus } from '../../../utils/api-error'
import { scheduleNavigateAfterUiSettled } from '../../../utils/schedule-navigate'
import './index.scss'

const DISH_COMMENT_PAGE_SIZE = 15

function formatAvgRating(v: number | string | undefined | null): string {
  if (v === undefined || v === null) return '0'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '0'
  return n.toFixed(1)
}

function StarRow(props: {
  value: number
  onChange?: (n: number) => void
  readonly?: boolean
}) {
  const { value, onChange, readonly } = props
  return (
    <View className='star-row'>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text
          key={n}
          className={`star ${n <= value ? 'star-on' : 'star-off'}`}
          onClick={() => {
            if (!readonly && onChange) onChange(n)
          }}
        >
          ★
        </Text>
      ))}
    </View>
  )
}


export default function DishDetail() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { id } = router.params
  const idRef = useRef(id)
  idRef.current = id
  const { currentDish, loading } = useSelector((state: RootState) => state.dish)
  const { token, userInfo } = useSelector((state: RootState) => state.user)
  const dishRef = useRef(currentDish)
  dishRef.current = currentDish

  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false)
  const [commentSort, setCommentSort] = useState<'latest' | 'popular'>('latest')
  const [commentsHasMore, setCommentsHasMore] = useState(false)

  const commentsRef = useRef<Comment[]>([])
  const commentPageRef = useRef(0)
  const commentsHasMoreRef = useRef(false)
  const commentsAppendingRef = useRef(false)
  commentsHasMoreRef.current = commentsHasMore
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)

  const [commentContent, setCommentContent] = useState('')
  const [commentRating, setCommentRating] = useState(5)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [shareCount, setShareCount] = useState(0)

  const setShareCountRef = useRef(setShareCount)
  setShareCountRef.current = setShareCount

  const reloadDish = useCallback(async () => {
    if (!id) return
    const data = await getDishById(id as string)
    dispatch(setCurrentDish(data))
    setLikeCount(data.like_count)
    setLiked(!!data.liked_by_me)
    setFavorited(!!data.favorited_by_me)
    setShareCount(Number(data.share_count) || 0)
  }, [id, dispatch])

  const loadComments = useCallback(
    async (mode: 'reset' | 'append') => {
      if (!id) return
      if (mode === 'append') {
        if (!commentsHasMoreRef.current || commentsAppendingRef.current) return
        commentsAppendingRef.current = true
        setCommentsLoadingMore(true)
      } else {
        setCommentsLoading(true)
        commentsRef.current = []
        commentPageRef.current = 0
      }

      const page = mode === 'reset' ? 1 : commentPageRef.current + 1

      try {
        const { data, pagination } = await getCommentsByDishId(
          id as string,
          page,
          DISH_COMMENT_PAGE_SIZE,
          commentSort
        )
        const next =
          mode === 'reset' ? data : [...commentsRef.current, ...data]
        commentsRef.current = next
        commentPageRef.current = page
        setComments(next)
        const more = next.length < pagination.total && data.length > 0
        setCommentsHasMore(more)
        commentsHasMoreRef.current = more
      } catch (err: any) {
        if (isAxiosStatus(err, 404)) {
          commentsRef.current = []
          setComments([])
          setCommentsHasMore(false)
          commentsHasMoreRef.current = false
        } else {
          console.error(err)
        }
      } finally {
        if (mode === 'append') {
          commentsAppendingRef.current = false
          setCommentsLoadingMore(false)
        } else {
          setCommentsLoading(false)
        }
      }
    },
    [id, commentSort]
  )

  // 栈内返回（如编辑页 navigateBack）时组件常仍挂载，仅依赖 [id] 的 effect 不会重跑，需在每次页面显示时拉最新数据
  useDidShow(() => {
    const dishId = idRef.current
    if (!dishId) return
    void (async () => {
      dispatch(setLoading(true))
      try {
        const data = await getDishById(dishId as string)
        dispatch(setCurrentDish(data))
        setLikeCount(data.like_count)
        setLiked(!!data.liked_by_me)
        setFavorited(!!data.favorited_by_me)
        setShareCount(Number(data.share_count) || 0)
      } catch (err: any) {
        dispatch(setError(err.message || 'Failed to fetch dish detail'))
        Taro.showToast({ title: '加载失败', icon: 'error' })
      } finally {
        dispatch(setLoading(false))
      }
    })()
  })

  useShareAppMessage(() => {
    const d = dishRef.current
    const dishId = (idRef.current as string) || ''
    if (!d || !dishId) {
      return { title: '顶级主厨', path: '/pages/index/index' }
    }
    const t = Taro.getStorageSync('token')
    if (t) {
      void recordShare(dishId, 'wechat_friend')
        .then((r) => setShareCountRef.current(r.shareCount))
        .catch(() => {})
    }
    return {
      title: d.name,
      path: `/package-recipes/pages/dish-detail/index?id=${dishId}`,
      imageUrl: d.image_url || undefined,
    }
  })

  useShareTimeline(() => {
    const d = dishRef.current
    const dishId = (idRef.current as string) || ''
    if (!d || !dishId) {
      return { title: '顶级主厨' }
    }
    const t = Taro.getStorageSync('token')
    if (t) {
      void recordShare(dishId, 'wechat_timeline')
        .then((r) => setShareCountRef.current(r.shareCount))
        .catch(() => {})
    }
    return {
      title: d.name,
      query: `id=${dishId}`,
      imageUrl: d.image_url || undefined,
    }
  })

  useEffect(() => {
    return () => {
      dispatch(setCurrentDish(null))
    }
  }, [id, dispatch])

  useEffect(() => {
    if (!currentDish?.id) return
    void loadComments('reset')
  }, [currentDish?.id, commentSort, loadComments])

  const myComment = comments.find((c) => userInfo && userInfo.id && c.user_id === userInfo.id)

  useEffect(() => {
    if (myComment) {
      setCommentContent(myComment.content)
      setCommentRating(myComment.rating != null ? myComment.rating : 5)
    } else {
      setCommentContent('')
      setCommentRating(5)
    }
  }, [
    myComment && myComment.id,
    myComment && myComment.content,
    myComment && myComment.rating,
  ])

  const handleToggleLike = async () => {
    if (!token || !id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setLikeBusy(true)
    try {
      if (liked) {
        const r = await unlikeDish(id as string)
        setLiked(false)
        setLikeCount(r.likeCount)
      } else {
        const r = await likeDish(id as string)
        setLiked(true)
        setLikeCount(r.likeCount)
      }
    } catch (err: any) {
      const code = getApiErrorCode(err)
      if (code === 'DUPLICATE_LIKE') {
        setLiked(true)
        Taro.showToast({ title: '已点赞', icon: 'none' })
        reloadDish()
      } else {
        Taro.showToast({ title: getApiErrorMessage(err, '操作失败'), icon: 'none' })
      }
    } finally {
      setLikeBusy(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!token || !id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setFavoriteBusy(true)
    try {
      if (favorited) {
        await removeFavorite(id as string)
        setFavorited(false)
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await addFavorite(id as string)
        setFavorited(true)
        Taro.showToast({ title: '已收藏', icon: 'success' })
      }
    } catch (err: any) {
      const code = getApiErrorCode(err)
      if (code === 'DUPLICATE_FAVORITE') {
        setFavorited(true)
        Taro.showToast({ title: '已收藏', icon: 'none' })
        reloadDish()
      } else {
        Taro.showToast({ title: getApiErrorMessage(err, '操作失败'), icon: 'none' })
      }
    } finally {
      setFavoriteBusy(false)
    }
  }

  const goAuthorProfile = () => {
    if (!currentDish || !currentDish.user_id) return
    const owner = !!(userInfo && userInfo.id && currentDish.user_id === userInfo.id)
    if (owner) return
    Taro.navigateTo({ url: `/package-user/pages/user-profile/index?id=${currentDish.user_id}` })
  }

  const handleSubmitComment = async () => {
    if (!token || !id || !currentDish) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const text = commentContent.trim()
    if (!text) {
      Taro.showToast({ title: '请填写评论', icon: 'none' })
      return
    }
    setCommentSubmitting(true)
    try {
      if (myComment) {
        await updateComment(myComment.id, { content: text, rating: commentRating })
        Taro.showToast({ title: '已更新', icon: 'success' })
      } else {
        await upsertComment(id as string, { content: text, rating: commentRating })
        Taro.showToast({ title: '已发布', icon: 'success' })
      }
      await loadComments('reset')
      await reloadDish()
    } catch (err: any) {
      Taro.showToast({ title: getApiErrorMessage(err, '提交失败'), icon: 'none' })
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleDeleteMyComment = () => {
    if (!myComment) return
    Taro.showModal({
      title: '删除评论',
      content: '确定删除我的评论吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteComment(myComment.id)
          Taro.showToast({ title: '已删除', icon: 'success' })
          await loadComments('reset')
          await reloadDish()
        } catch (err: any) {
          Taro.showToast({ title: getApiErrorMessage(err, '删除失败'), icon: 'none' })
        }
      },
    })
  }

  const goEditDish = () => {
    if (!id) return
    Taro.navigateTo({ url: `/package-recipes/pages/edit-dish/index?id=${id}` })
  }

  const handleAddToMenu = async () => {
    const dishId = id as string
    if (!dishId) return
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      const { menus } = await getMenus(1, 50)
      if (menus.length === 0) {
        const r = await Taro.showModal({
          title: '暂无菜单',
          content: '是否创建「新菜单」并加入这道菜？',
        })
        if (!r.confirm) return
        Taro.showLoading({ title: '请稍候' })
        try {
          const m = await createMenu({ name: '新菜单' })
          await addMenuItem(m.id, dishId, 1)
          Taro.hideLoading()
          Taro.showToast({ title: '已加入新菜单', icon: 'success' })
        } catch (e) {
          Taro.hideLoading()
          Taro.showToast({ title: getApiErrorMessage(e, '操作失败'), icon: 'none' })
        }
        return
      }
      scheduleNavigateAfterUiSettled(() => {
        Taro.navigateTo({
          url: `/package-menus/pages/menu-list/index?dishId=${encodeURIComponent(dishId)}`,
        })
      }, 80)
    } catch (e) {
      Taro.showToast({ title: getApiErrorMessage(e, '加载菜单失败'), icon: 'none' })
    }
  }

  if (loading || !currentDish) {
    return (
      <View className='loading-container'>
        <AtActivityIndicator mode='center' content='正在加载详情...' />
      </View>
    )
  }

  const isOwner = !!(userInfo && userInfo.id && currentDish.user_id === userInfo.id)
  const ratingAvg = formatAvgRating(currentDish.rating_avg)
  const canComment = token && currentDish.comments_enabled

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
            {currentDish.difficulty && (
              <AtTag size='small' circle active type='primary'>
                {currentDish.difficulty}
              </AtTag>
            )}
            {currentDish.cooking_time != null && (
              <AtTag size='small' circle className='ml-2'>
                {currentDish.cooking_time}分钟
              </AtTag>
            )}
            {(currentDish.tags || []).map((tag) => (
              <AtTag key={tag} size='small' circle className='ml-2' active>
                {tag}
              </AtTag>
            ))}
          </View>
          <View className='rating-summary'>
            <Text className='rating-score'>{ratingAvg}</Text>
            <StarRow value={Math.round(Number(ratingAvg) || 0)} readonly />
            <Text className='rating-count'>（{currentDish.rating_count} 人评分）</Text>
          </View>
          <Text className='dish-desc'>{currentDish.description}</Text>

          <View className='action-bar'>
            <AtButton
              size='small'
              type={liked ? 'primary' : 'secondary'}
              loading={likeBusy}
              onClick={handleToggleLike}
            >
              {liked ? '已赞' : '点赞'} {likeCount}
            </AtButton>
            <AtButton
              size='small'
              type={favorited ? 'primary' : 'secondary'}
              loading={favoriteBusy}
              className='action-edit'
              onClick={handleToggleFavorite}
            >
              {favorited ? '已收藏' : '收藏'}
            </AtButton>
            <AtButton size='small' className='action-edit' onClick={handleAddToMenu}>
              加入菜单
            </AtButton>
            {isOwner && (
              <AtButton size='small' className='action-edit' onClick={goEditDish}>
                编辑菜谱
              </AtButton>
            )}
            {process.env.TARO_ENV === 'weapp' && (
              <Button className='share-native-btn' openType='share' size='mini'>
                分享给好友
              </Button>
            )}
          </View>
        </View>

        <AtDivider content='食材清单' fontColor='#ff9900' lineColor='#ff9900' />
        <View className='ingredients-section'>
          <AtList>
            {(currentDish.ingredients || []).map((item, index) => (
              <AtListItem
                key={item.id || index}
                title={item.name}
                extraText={`${item.quantity != null ? item.quantity : ''}${item.unit != null ? item.unit : ''}`}
              />
            ))}
          </AtList>
        </View>

        <AtDivider content='烹饪步骤' fontColor='#ff9900' lineColor='#ff9900' />
        <View className='steps-section'>
          {(currentDish.steps || []).map((step, index) => (
            <View key={step.id || index} className='step-item'>
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

        <AtDivider content='评论' fontColor='#ff9900' lineColor='#ff9900' />
        <View className='comments-section'>
          <View className='comment-sort-row'>
            <Text className='comment-sort-label'>排序</Text>
            <AtTag
              size='small'
              circle
              type={commentSort === 'latest' ? 'primary' : undefined}
              active={commentSort === 'latest'}
              onClick={() => setCommentSort('latest')}
            >
              最新
            </AtTag>
            <AtTag
              size='small'
              circle
              className='comment-sort-tag'
              type={commentSort === 'popular' ? 'primary' : undefined}
              active={commentSort === 'popular'}
              onClick={() => setCommentSort('popular')}
            >
              高分优先
            </AtTag>
          </View>
          {!token && <Text className='hint-muted'>登录后可点赞、评论</Text>}
          {token && !currentDish.comments_enabled && (
            <Text className='hint-muted'>作者已关闭评论</Text>
          )}
          {canComment && (
            <View className='comment-form'>
              <Text className='form-label'>我的评分</Text>
              <StarRow value={commentRating} onChange={setCommentRating} />
              <Text className='form-label'>评论内容</Text>
              <Textarea
                className='comment-textarea'
                value={commentContent}
                onInput={(e) => setCommentContent(e.detail.value)}
                placeholder='说说口味、改进建议…'
                maxlength={500}
              />
              <View className='comment-form-actions'>
                <AtButton
                  type='primary'
                  size='small'
                  loading={commentSubmitting}
                  onClick={handleSubmitComment}
                >
                  {myComment ? '更新评论' : '发布评论'}
                </AtButton>
                {myComment && (
                  <AtButton size='small' onClick={handleDeleteMyComment}>
                    删除
                  </AtButton>
                )}
              </View>
            </View>
          )}

          {commentsLoading ? (
            <Text className='hint-muted'>评论加载中…</Text>
          ) : comments.length === 0 ? (
            <Text className='hint-muted'>暂无评论</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} className='comment-item'>
                <View className='comment-head'>
                  <Text className='comment-author'>{c.user_nickname || '用户'}</Text>
                  <StarRow value={c.rating != null ? c.rating : 0} readonly />
                </View>
                <Text className='comment-body'>{c.content}</Text>
                <Text className='comment-time'>
                  {new Date(c.created_at).toLocaleString()}
                </Text>
              </View>
            ))
          )}
          {commentsHasMore && !commentsLoading && (
            <View className='comment-load-more'>
              <AtButton
                size='small'
                loading={commentsLoadingMore}
                onClick={() => void loadComments('append')}
              >
                加载更多
              </AtButton>
            </View>
          )}
        </View>

        <View className='footer-info'>
          <Text className='user-info' onClick={goAuthorProfile}>
            由 {currentDish.user_nickname} 发布于 {new Date(currentDish.created_at).toLocaleDateString()}
            {!isOwner ? ' · 查看主页' : ''}
          </Text>
          <View className='stats-row'>
            <Text>浏览 {currentDish.view_count}</Text>
            <Text className='ml-3'>分享 {shareCount}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

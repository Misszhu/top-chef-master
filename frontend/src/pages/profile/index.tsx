import { View, Text, Image, ScrollView } from '@tarojs/components'
import { AtList, AtListItem, AtButton, AtAvatar, AtIcon } from 'taro-ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro, { useDidShow } from '@tarojs/taro'
import { RootState } from '../../store'
import { setUserInfo, setToken, logout } from '../../store/slices/userSlice'
import { login, getProfile } from '../../services/user'
import { getDishes } from '../../services/dish'
import { getUserPublicProfile } from '../../services/social'
import { Dish } from '../../types/dish'
import { getApiErrorMessage, isAxiosStatus } from '../../utils/api-error'
import './index.scss'

export default function Profile() {
  const dispatch = useDispatch()
  const { userInfo, token } = useSelector((state: RootState) => state.user)
  const [activeTab, setActiveTab] = useState<'recipes' | 'works'>('recipes')
  const [myDishes, setMyDishes] = useState<Dish[]>([])
  const [myDishesLoading, setMyDishesLoading] = useState(false)
  const [myFollowerCount, setMyFollowerCount] = useState(0)
  const [myFollowingCount, setMyFollowingCount] = useState(0)

  const fetchMyDishes = useCallback(async () => {
    const t = token || Taro.getStorageSync('token')
    const uid = userInfo?.id || Taro.getStorageSync('userInfo')?.id
    if (!t || !uid) {
      setMyDishes([])
      return
    }
    setMyDishesLoading(true)
    try {
      const { data } = await getDishes({ user_id: uid, limit: 50, page: 1 })
      setMyDishes(data)
    } catch (e) {
      console.error('fetch my dishes:', e)
      setMyDishes([])
      // 真机常见：未打到本机后端（API 地址非本机局域网 IP、手机与电脑不同 WiFi 等），此处否则会静默成「菜谱 0」
      Taro.showToast({
        title: getApiErrorMessage(e, '菜谱加载失败，请检查网络与 dev 里 API 地址'),
        icon: 'none',
        duration: 2800,
      })
    } finally {
      setMyDishesLoading(false)
    }
  }, [token, userInfo?.id])

  const fetchMyDishesRef = useRef(fetchMyDishes)
  fetchMyDishesRef.current = fetchMyDishes

  const loadMySocialStats = useCallback(async () => {
    const t = token || Taro.getStorageSync('token')
    const uid = userInfo?.id || Taro.getStorageSync('userInfo')?.id
    if (!t || !uid) {
      setMyFollowerCount(0)
      setMyFollowingCount(0)
      return
    }
    try {
      const p = await getUserPublicProfile(uid as string)
      setMyFollowerCount(p.follower_count)
      setMyFollowingCount(p.following_count)
    } catch {
      setMyFollowerCount(0)
      setMyFollowingCount(0)
    }
  }, [token, userInfo?.id])

  useDidShow(() => {
    void fetchMyDishesRef.current()
    void loadMySocialStats()
  })

  const handleLogin = async () => {
    try {
      const { code } = await Taro.login()
      Taro.showLoading({ title: '登录中...' })
      const data = await login(code)
      
      dispatch(setToken(data.token))
      dispatch(setUserInfo(data.user))
      
      Taro.setStorageSync('token', data.token)
      Taro.setStorageSync('userInfo', data.user)
      
      Taro.hideLoading()
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      Taro.hideLoading()
      Taro.showToast({ title: '登录失败', icon: 'error' })
      console.error('Login error:', err)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    Taro.showToast({ title: '已退出登录', icon: 'none' })
  }

  const handleOpenMessages = () => {
    Taro.showToast({ title: '消息功能开发中', icon: 'none' })
  }

  const handleOpenSettings = () => {
    Taro.showToast({ title: '设置功能开发中', icon: 'none' })
  }

  useEffect(() => {
    // 1. 尝试从本地恢复 token
    const savedToken = Taro.getStorageSync('token')
    const savedUserInfo = Taro.getStorageSync('userInfo')
    
    if (savedToken && savedUserInfo) {
      dispatch(setToken(savedToken))
      dispatch(setUserInfo(savedUserInfo))
    }

    // 2. 若有 token，则以服务端 profile 为准做一次同步
    const syncProfile = async () => {
      const currentToken = savedToken || token
      if (!currentToken) return
      try {
        const profile = await getProfile()
        dispatch(setUserInfo(profile))
        Taro.setStorageSync('userInfo', profile)
      } catch (err: any) {
        // token 失效：清理并提示重新登录
        if (isAxiosStatus(err, 401)) {
          dispatch(logout())
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          Taro.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
        } else {
          console.error('Sync profile error:', err)
        }
      }
    }

    syncProfile()
  }, [])

  useEffect(() => {
    void fetchMyDishes()
  }, [fetchMyDishes])

  useEffect(() => {
    void loadMySocialStats()
  }, [loadMySocialStats])

  return (
    <View className='profile-page'>
      <View className='user-header'>
        <View className='header-toolbar'>
          <View className='header-toolbar-actions'>
            <View className='toolbar-icon-item' onClick={handleOpenMessages}>
              <AtIcon value='message' size={22} color='rgba(31, 31, 31, 0.42)' />
              <Text className='toolbar-icon-label'>消息</Text>
            </View>
            <View className='toolbar-icon-item' onClick={handleOpenSettings}>
              <AtIcon value='settings' size={22} color='rgba(31, 31, 31, 0.42)' />
              <Text className='toolbar-icon-label'>设置</Text>
            </View>
          </View>
        </View>
        {token ? (
          <View className='user-panel'>
            <View className='user-info-section'>
              <AtAvatar
                circle
                image={(userInfo && userInfo.avatar_url) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                size='large'
              />
              <View className='user-text'>
                <Text className='nickname'>{(userInfo && userInfo.nickname) || '主厨'}</Text>
                <Text className='user-id'>ID: {userInfo && userInfo.id}</Text>
                <Text className='user-bio'>添加个人简介，让厨房更了解你</Text>
              </View>
            </View>
            <View className='user-stats'>
              <View
                className='stat-item'
                onClick={() => {
                  const uid = userInfo && userInfo.id
                  if (!uid) return
                  Taro.navigateTo({ url: `/package-user/pages/user-list/index?userId=${uid}&type=following` })
                }}
              >
                <Text className='stat-value'>{myFollowingCount}</Text>
                <Text className='stat-label'>关注</Text>
              </View>
              <View
                className='stat-item'
                onClick={() => {
                  const uid = userInfo && userInfo.id
                  if (!uid) return
                  Taro.navigateTo({ url: `/package-user/pages/user-list/index?userId=${uid}&type=followers` })
                }}
              >
                <Text className='stat-value'>{myFollowerCount}</Text>
                <Text className='stat-label'>粉丝</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className='login-section'>
            <AtButton type='primary' className='login-btn' onClick={handleLogin}>微信一键登录</AtButton>
            <Text className='login-hint'>登录后即可管理您的私人菜谱</Text>
          </View>
        )}
      </View>

      <View className='menu-section'>
        <AtList>
          <AtListItem title='我的菜肴' arrow='right' iconInfo={{ size: 20, color: '#ff9900', value: 'list', }} />
          <AtListItem
            title='我的收藏'
            arrow='right'
            iconInfo={{ size: 20, color: '#ff9900', value: 'heart' }}
            onClick={() => Taro.navigateTo({ url: '/package-user/pages/favorites/index' })}
          />
          <AtListItem
            title='我的菜单'
            arrow='right'
            iconInfo={{ size: 20, color: '#ff9900', value: 'folder' }}
            onClick={() => Taro.navigateTo({ url: '/package-menus/pages/menu-list/index' })}
          />
          <AtListItem
            title='购物清单'
            arrow='right'
            iconInfo={{ size: 20, color: '#ff9900', value: 'shopping-cart' }}
            onClick={() => {
              if (!token) {
                Taro.showToast({ title: '请先登录', icon: 'none' })
                return
              }
              Taro.navigateTo({ url: '/package-shopping/pages/shopping-list/index' })
            }}
          />
          <AtListItem
            title='饮食日记'
            arrow='right'
            iconInfo={{ size: 20, color: '#ff9900', value: 'calendar' }}
            onClick={() => {
              if (!token) {
                Taro.showToast({ title: '请先登录', icon: 'none' })
                return
              }
              Taro.navigateTo({ url: '/package-meal/pages/meal-day/index' })
            }}
          />
        </AtList>
      </View>

      <View className='settings-section'>
        <AtList>
          <AtListItem title='关于我们' arrow='right' />
          {token && (
            <AtListItem title='退出登录' onClick={handleLogout} />
          )}
        </AtList>
      </View>

      {token && (
        <View className='works-section'>
          <View className='works-tabs'>
            <View
              className={`works-tab-item ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <Text className='tab-text'>菜谱 {myDishes.length}</Text>
            </View>
            <View
              className={`works-tab-item ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => setActiveTab('works')}
            >
              <Text className='tab-text'>作品 0</Text>
            </View>
          </View>

          {activeTab === 'recipes' && myDishesLoading && myDishes.length === 0 ? (
            <View className='works-loading'>
              <Text className='works-loading-text'>加载中...</Text>
            </View>
          ) : activeTab === 'recipes' && myDishes.length > 0 ? (
            <ScrollView scrollY className='works-dish-scroll'>
              <View className='works-dish-grid'>
                {myDishes.map((dish) => (
                  <View
                    key={dish.id}
                    className='works-dish-card'
                    onClick={() =>
                      Taro.navigateTo({ url: `/package-recipes/pages/dish-detail/index?id=${dish.id}` })
                    }
                  >
                    <Image
                      className='works-dish-thumb'
                      src={dish.image_url || 'https://via.placeholder.com/400'}
                      mode='aspectFill'
                    />
                    <View className='works-dish-info'>
                      <Text className='works-dish-title'>{dish.name}</Text>
                      <Text className='works-dish-desc'>
                        {dish.description != null ? dish.description : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className='works-empty'>
              <Text className='empty-copy'>
                {activeTab === 'recipes'
                  ? '创建菜谱的人是厨房里的天使'
                  : '上传你的作品，记录每一次下厨成就'}
              </Text>
              <AtButton
                type='primary'
                className='create-btn'
                onClick={() => {
                  if (activeTab === 'recipes') {
                    Taro.navigateTo({ url: '/package-recipes/pages/add-dish/index' })
                  } else {
                    Taro.showToast({ title: '作品发布开发中', icon: 'none' })
                  }
                }}
              >
                {activeTab === 'recipes' ? '开始创建第一道菜谱' : '开始发布第一条作品'}
              </AtButton>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

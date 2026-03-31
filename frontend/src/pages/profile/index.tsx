import { View, Text } from '@tarojs/components'
import { AtList, AtListItem, AtButton, AtAvatar, AtIcon } from 'taro-ui'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { RootState } from '../../store'
import { setUserInfo, setToken, logout } from '../../store/slices/userSlice'
import { login, getProfile } from '../../services/user'
import './index.scss'

export default function Profile() {
  const dispatch = useDispatch()
  const { userInfo, token } = useSelector((state: RootState) => state.user)
  const [activeTab, setActiveTab] = useState<'recipes' | 'works'>('recipes')

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
        if (err?.response?.status === 401) {
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
                image={userInfo?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                size='large'
              />
              <View className='user-text'>
                <Text className='nickname'>{userInfo?.nickname || '主厨'}</Text>
                <Text className='user-id'>ID: {userInfo?.id}</Text>
                <Text className='user-bio'>添加个人简介，让厨房更了解你</Text>
              </View>
            </View>
            <View className='user-stats'>
              <View className='stat-item'>
                <Text className='stat-value'>0</Text>
                <Text className='stat-label'>关注</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>0</Text>
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
          <AtListItem title='我的收藏' arrow='right' iconInfo={{ size: 20, color: '#ff9900', value: 'heart', }} />
          <AtListItem title='我的菜单' arrow='right' iconInfo={{ size: 20, color: '#ff9900', value: 'folder', }} />
          <AtListItem title='购物清单' arrow='right' iconInfo={{ size: 20, color: '#ff9900', value: 'shopping-cart', }} />
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
              <Text className='tab-text'>菜谱 0</Text>
            </View>
            <View
              className={`works-tab-item ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => setActiveTab('works')}
            >
              <Text className='tab-text'>作品 0</Text>
            </View>
          </View>

          <View className='works-empty'>
            <Text className='empty-copy'>
              {activeTab === 'recipes'
                ? '创建菜谱的人是厨房里的天使'
                : '上传你的作品，记录每一次下厨成就'}
            </Text>
            <AtButton type='primary' className='create-btn'>
              {activeTab === 'recipes' ? '开始创建第一道菜谱' : '开始发布第一条作品'}
            </AtButton>
          </View>
        </View>
      )}
    </View>
  )
}

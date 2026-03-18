import { View, Text, Image } from '@tarojs/components'
import { AtList, AtListItem, AtButton, AtAvatar } from 'taro-ui'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro from '@tarojs/taro'
import { RootState } from '../../store'
import { setUserInfo, setToken, logout } from '../../store/slices/userSlice'
import { login, getProfile } from '../../services/user'
import './index.scss'

export default function Profile() {
  const dispatch = useDispatch()
  const { userInfo, token } = useSelector((state: RootState) => state.user)

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

  useEffect(() => {
    // Try to restore from storage on mount
    const savedToken = Taro.getStorageSync('token')
    const savedUserInfo = Taro.getStorageSync('userInfo')
    
    if (savedToken && savedUserInfo) {
      dispatch(setToken(savedToken))
      dispatch(setUserInfo(savedUserInfo))
    }
  }, [])

  return (
    <View className='profile-page'>
      <View className='user-header'>
        {token ? (
          <View className='user-info-section'>
            <AtAvatar 
              circle 
              image={userInfo?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
              size='large'
            />
            <View className='user-text'>
              <Text className='nickname'>{userInfo?.nickname || '主厨'}</Text>
              <Text className='user-id'>ID: {userInfo?.id}</Text>
            </View>
          </View>
        ) : (
          <View className='login-section'>
            <AtButton type='primary' onClick={handleLogin}>微信一键登录</AtButton>
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
    </View>
  )
}

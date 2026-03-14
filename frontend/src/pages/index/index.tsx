import { View, Text } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Index () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='index'>
      <Text>Hello world!</Text>
      <AtButton type='primary'>Taro UI Button</AtButton>
    </View>
  )
}

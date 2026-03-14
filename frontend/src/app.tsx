import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { useLaunch } from '@tarojs/taro'
import { store } from './store'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

export default App

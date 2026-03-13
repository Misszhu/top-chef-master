import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import Taro from '@tarojs/taro';
import { store } from './store';
import './app.scss';

interface AppProps {
  children?: React.ReactNode;
}

const App: React.FC<AppProps> = ({ children }) => {
  useEffect(() => {
    // 初始化应用
    console.log('TopChef App initialized');

    // 可以在这里执行一些初始化逻辑
    // 如加载用户数据、初始化第三方服务等
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

export default App;

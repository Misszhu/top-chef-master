import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

interface AppContainerProps {
  children?: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default AppContainer;

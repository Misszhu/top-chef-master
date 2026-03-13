/**
 * Redux Store 配置
 */

import { configureStore } from '@reduxjs/toolkit';
import dishReducer from './slices/dishSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    dish: dishReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

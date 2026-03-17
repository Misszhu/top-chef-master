import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import dishReducer from './slices/dishSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    dish: dishReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

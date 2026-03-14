import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userInfo: any | null;
  token: string | null;
}

const initialState: UserState = {
  userInfo: null,
  token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<any>) => {
      state.userInfo = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
    },
  },
});

export const { setUserInfo, setToken, logout } = userSlice.actions;
export default userSlice.reducer;

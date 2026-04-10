import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Dish } from '../../types/dish';

interface DishState {
  dishes: Dish[];
  currentDish: Dish | null;
  loading: boolean;
  error: string | null;
}

const initialState: DishState = {
  dishes: [],
  currentDish: null,
  loading: false,
  error: null,
};

const dishSlice = createSlice({
  name: 'dish',
  initialState,
  reducers: {
    setDishes: (state, action: PayloadAction<Dish[]>) => {
      state.dishes = action.payload;
    },
    appendDishes: (state, action: PayloadAction<Dish[]>) => {
      state.dishes.push(...action.payload);
    },
    setCurrentDish: (state, action: PayloadAction<Dish | null>) => {
      state.currentDish = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setDishes, appendDishes, setCurrentDish, setLoading, setError } = dishSlice.actions;
export default dishSlice.reducer;

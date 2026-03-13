/**
 * Dish Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Dish, DishFormData, FilterOptions } from '../../types';
import { DishService } from '../../services';

interface DishState {
  dishes: Dish[];
  filteredDishes: Dish[];
  currentDish: Dish | null;
  favorites: Dish[];
  allTags: string[];
  loading: boolean;
  error: string | null;
  statistics: {
    total: number;
    favoriteCount: number;
    byDifficulty: Record<string, number>;
  };
}

const initialState: DishState = {
  dishes: [],
  filteredDishes: [],
  currentDish: null,
  favorites: [],
  allTags: [],
  loading: false,
  error: null,
  statistics: {
    total: 0,
    favoriteCount: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
  },
};

// 异步 thunks
export const fetchDishes = createAsyncThunk('dish/fetchDishes', async () => {
  return await DishService.getAllDishes();
});

export const fetchDishById = createAsyncThunk('dish/fetchDishById', async (id: string) => {
  return await DishService.getDishById(id);
});

export const createNewDish = createAsyncThunk<Dish, DishFormData>(
  'dish/createNewDish',
  async (dishData, { rejectWithValue }) => {
    try {
      return await DishService.createDish(dishData);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateExistingDish = createAsyncThunk<Dish, { id: string; updates: Partial<DishFormData> }>(
  'dish/updateExistingDish',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await DishService.updateDish(id, updates);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const deleteExistingDish = createAsyncThunk('dish/deleteExistingDish', async (id: string) => {
  await DishService.deleteDish(id);
  return id;
});

export const searchDishesAsync = createAsyncThunk(
  'dish/searchDishes',
  async (keyword: string) => {
    return await DishService.searchDishes(keyword);
  },
);

export const filterDishesAsync = createAsyncThunk<Dish[], FilterOptions>(
  'dish/filterDishes',
  async (options) => {
    return await DishService.filterDishes(options);
  },
);

export const fetchFavoriteDishes = createAsyncThunk('dish/fetchFavoriteDishes', async () => {
  return await DishService.getFavoriteDishes();
});

export const toggleFavoriteAsync = createAsyncThunk<boolean, string>(
  'dish/toggleFavorite',
  async (id) => {
    return await DishService.toggleFavorite(id);
  },
);

export const fetchAllTags = createAsyncThunk('dish/fetchAllTags', async () => {
  return await DishService.getAllTags();
});

export const fetchStatistics = createAsyncThunk('dish/fetchStatistics', async () => {
  return await DishService.getStatistics();
});

const dishSlice = createSlice({
  name: 'dish',
  initialState,
  reducers: {
    setCurrentDish: (state, action: PayloadAction<Dish | null>) => {
      state.currentDish = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchDishes
    builder
      .addCase(fetchDishes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.loading = false;
        state.dishes = action.payload;
        state.filteredDishes = action.payload;
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dishes';
      });

    // fetchDishById
    builder
      .addCase(fetchDishById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDishById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDish = action.payload;
      })
      .addCase(fetchDishById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dish';
      });

    // createNewDish
    builder
      .addCase(createNewDish.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewDish.fulfilled, (state, action) => {
        state.loading = false;
        state.dishes.push(action.payload);
        state.filteredDishes.push(action.payload);
      })
      .addCase(createNewDish.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // updateExistingDish
    builder
      .addCase(updateExistingDish.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingDish.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.dishes.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.dishes[index] = action.payload;
          state.filteredDishes[index] = action.payload;
        }
        state.currentDish = action.payload;
      })
      .addCase(updateExistingDish.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // deleteExistingDish
    builder
      .addCase(deleteExistingDish.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExistingDish.fulfilled, (state, action) => {
        state.loading = false;
        state.dishes = state.dishes.filter(d => d.id !== action.payload);
        state.filteredDishes = state.filteredDishes.filter(d => d.id !== action.payload);
      })
      .addCase(deleteExistingDish.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete dish';
      });

    // searchDishesAsync
    builder
      .addCase(searchDishesAsync.fulfilled, (state, action) => {
        state.filteredDishes = action.payload;
      });

    // filterDishesAsync
    builder
      .addCase(filterDishesAsync.fulfilled, (state, action) => {
        state.filteredDishes = action.payload;
      });

    // fetchFavoriteDishes
    builder
      .addCase(fetchFavoriteDishes.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });

    // toggleFavoriteAsync
    builder.addCase(toggleFavoriteAsync.fulfilled, (state) => {
      // 重新获取数据将在组件中处理
    });

    // fetchAllTags
    builder.addCase(fetchAllTags.fulfilled, (state, action) => {
      state.allTags = action.payload;
    });

    // fetchStatistics
    builder.addCase(fetchStatistics.fulfilled, (state, action) => {
      state.statistics = action.payload;
    });
  },
});

export const { setCurrentDish, clearError, setLoading } = dishSlice.actions;
export default dishSlice.reducer;

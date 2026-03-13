/**
 * UI Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterOptions } from '../../types';

interface UIState {
  searchText: string;
  filterOptions: FilterOptions;
  currentTab: string;
  isLoading: boolean;
  showSearchBar: boolean;
  currentPage: number;
  pageSize: number;
  sortBy: 'recent' | 'difficulty' | 'cookingTime';
}

const initialState: UIState = {
  searchText: '',
  filterOptions: {},
  currentTab: 'home',
  isLoading: false,
  showSearchBar: false,
  currentPage: 1,
  pageSize: 10,
  sortBy: 'recent',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },
    setFilterOptions: (state, action: PayloadAction<FilterOptions>) => {
      state.filterOptions = action.payload;
    },
    setCurrentTab: (state, action: PayloadAction<string>) => {
      state.currentTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleSearchBar: (state) => {
      state.showSearchBar = !state.showSearchBar;
    },
    clearFilters: (state) => {
      state.filterOptions = {};
      state.searchText = '';
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'recent' | 'difficulty' | 'cookingTime'>) => {
      state.sortBy = action.payload;
    },
  },
});

export const {
  setSearchText,
  setFilterOptions,
  setCurrentTab,
  setLoading,
  toggleSearchBar,
  clearFilters,
  setCurrentPage,
  setSortBy,
} = uiSlice.actions;

export default uiSlice.reducer;

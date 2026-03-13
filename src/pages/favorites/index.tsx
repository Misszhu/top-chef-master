import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavoriteDishes } from '../../store/slices/dishSlice';
import { RootState, AppDispatch } from '../../store';
import Taro from '@tarojs/taro';
import './index.scss';

const Favorites: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { favorites, loading } = useSelector((state: RootState) => state.dish);

  useEffect(() => {
    dispatch(fetchFavoriteDishes());
  }, [dispatch]);

  const handleDishClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/dish-detail/index?id=${id}` });
  };

  return (
    <View className="favorites-page">
      <View className="favorites-header">
        <Text className="title">我的收藏</Text>
      </View>

      <View className="favorites-container">
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View className="empty-state">
            <Text>还没有收藏菜肴</Text>
          </View>
        ) : (
          <View className="dishes-list">
            {favorites.map(dish => (
              <View key={dish.id} className="dish-card" onClick={() => handleDishClick(dish.id)}>
                <View className="dish-image">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.name} />
                  ) : (
                    <View className="no-image">无图片</View>
                  )}
                </View>
                <View className="dish-info">
                  <Text className="dish-name">{dish.name}</Text>
                  <Text className="dish-desc">{dish.description}</Text>
                  <View className="dish-meta">
                    <Text className="meta-item">⏱ {dish.cookingTime}分钟</Text>
                    <Text className="meta-item">📊 {dish.difficulty}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Favorites;

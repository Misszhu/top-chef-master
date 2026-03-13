import React, { useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDishes } from '../../store/slices/dishSlice';
import { RootState, AppDispatch } from '../../store';
import './index.scss';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dishes, loading } = useSelector((state: RootState) => state.dish);

  useEffect(() => {
    // 加载菜肴列表
    dispatch(fetchDishes());
  }, [dispatch]);

  const handleAddDish = () => {
    Taro.navigateTo({ url: '/pages/add-dish/index' });
  };

  const handleDishClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/dish-detail/index?id=${id}` });
  };

  return (
    <View className="home-page">
      <View className="home-header">
        <Text className="title">我的菜谱</Text>
        <Button className="add-btn" onClick={handleAddDish}>
          + 添加菜肴
        </Button>
      </View>

      <View className="dishes-container">
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : dishes.length === 0 ? (
          <View className="empty-state">
            <Text>还没有菜肴，快来添加一个吧！</Text>
            <Button onClick={handleAddDish}>添加菜肴</Button>
          </View>
        ) : (
          <View className="dishes-list">
            {dishes.map(dish => (
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

export default Home;

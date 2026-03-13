import React, { useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDishes, fetchStatistics } from '../../store/slices/dishSlice';
import { RootState, AppDispatch } from '../../store';
import Taro from '@tarojs/taro';
import './index.scss';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { statistics } = useSelector((state: RootState) => state.dish);

  useEffect(() => {
    dispatch(fetchStatistics());
  }, [dispatch]);

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'info' });
  };

  return (
    <View className="profile-page">
      <View className="profile-header">
        <View className="profile-avatar">👨‍🍳</View>
        <Text className="profile-name">我的菜谱</Text>
      </View>

      <View className="statistics-section">
        <Text className="section-title">统计信息</Text>
        <View className="stats-grid">
          <View className="stat-card">
            <Text className="stat-value">{statistics.total}</Text>
            <Text className="stat-label">总菜肴数</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">{statistics.favoriteCount}</Text>
            <Text className="stat-label">收藏数</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">{statistics.byDifficulty.easy}</Text>
            <Text className="stat-label">简单</Text>
          </View>
        </View>
        <View className="stats-grid">
          <View className="stat-card">
            <Text className="stat-value">{statistics.byDifficulty.medium}</Text>
            <Text className="stat-label">中等</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-value">{statistics.byDifficulty.hard}</Text>
            <Text className="stat-label">困难</Text>
          </View>
        </View>
      </View>

      <View className="menu-section">
        <Text className="section-title">功能菜单</Text>
        <Button className="menu-item" onClick={handleShare}>
          分享菜谱
        </Button>
        <Button className="menu-item">
          备份数据
        </Button>
        <Button className="menu-item">
          关于我们
        </Button>
      </View>

      <View className="footer">
        <Text>TopChef v1.0.0</Text>
        <Text>让烹饪更简单</Text>
      </View>
    </View>
  );
};

export default Profile;

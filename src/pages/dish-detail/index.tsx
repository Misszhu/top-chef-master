import React, { useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRoute } from '@tarojs/taro';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDishById, toggleFavoriteAsync, deleteExistingDish } from '../../store/slices/dishSlice';
import { RootState, AppDispatch } from '../../store';
import './index.scss';

const DishDetail: React.FC = () => {
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { currentDish, loading } = useSelector((state: RootState) => state.dish);
  const dishId = (route.params?.id as string) || '';

  useEffect(() => {
    if (dishId) {
      dispatch(fetchDishById(dishId));
    }
  }, [dishId, dispatch]);

  const handleEdit = () => {
    if (currentDish) {
      Taro.navigateTo({ url: `/pages/edit-dish/index?id=${currentDish.id}` });
    }
  };

  const handleDelete = () => {
    if (!currentDish) return;

    Taro.showModal({
      title: '确认删除',
      content: `确定要删除菜肴"${currentDish.name}"吗？`,
      confirmText: '删除',
      cancelText: '取消',
      success: async (result) => {
        if (result.confirm) {
          await dispatch(deleteExistingDish(currentDish.id));
          Taro.showToast({ title: '删除成功', icon: 'success' });
          Taro.navigateBack();
        }
      },
    });
  };

  const handleToggleFavorite = async () => {
    if (currentDish) {
      await dispatch(toggleFavoriteAsync(currentDish.id));
    }
  };

  if (loading) {
    return (
      <View className="dish-detail-page">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!currentDish) {
    return (
      <View className="dish-detail-page">
        <Text>菜肴不存在</Text>
      </View>
    );
  }

  return (
    <View className="dish-detail-page">
      <ScrollView scrollY={true} className="detail-scroll">
        {/* 菜肴图片 */}
        <View className="dish-image-section">
          {currentDish.image ? (
            <img src={currentDish.image} alt={currentDish.name} className="dish-image" />
          ) : (
            <View className="no-image-placeholder">无图片</View>
          )}
          <Button className={`favorite-btn ${currentDish.isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite}>
            {currentDish.isFavorite ? '★' : '☆'}
          </Button>
        </View>

        {/* 基本信息 */}
        <View className="dish-basic-info">
          <Text className="dish-name">{currentDish.name}</Text>
          <Text className="dish-description">{currentDish.description}</Text>

          <View className="info-grid">
            <View className="info-item">
              <Text className="label">难度</Text>
              <Text className="value">{currentDish.difficulty}</Text>
            </View>
            <View className="info-item">
              <Text className="label">烹饪时间</Text>
              <Text className="value">{currentDish.cookingTime} 分钟</Text>
            </View>
            <View className="info-item">
              <Text className="label">份量</Text>
              <Text className="value">{currentDish.servings} 人份</Text>
            </View>
          </View>

          {currentDish.tags.length > 0 && (
            <View className="tags">
              {currentDish.tags.map(tag => (
                <View key={tag} className="tag">
                  {tag}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 食材 */}
        <View className="section">
          <Text className="section-title">食材</Text>
          <View className="ingredients-list">
            {currentDish.ingredients.map(ing => (
              <View key={ing.id} className="ingredient-item">
                <Text className="ingredient-name">{ing.name}</Text>
                <Text className="ingredient-quantity">
                  {ing.quantity} {ing.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 制作步骤 */}
        <View className="section">
          <Text className="section-title">制作步骤</Text>
          <View className="steps-list">
            {currentDish.steps.map(step => (
              <View key={step.id} className="step-item">
                <View className="step-number">{step.stepNumber}</View>
                <View className="step-content">
                  <Text className="step-description">{step.description}</Text>
                  {step.image && <img src={step.image} alt={`步骤 ${step.stepNumber}`} className="step-image" />}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="action-buttons">
          <Button className="edit-btn" onClick={handleEdit}>
            编辑
          </Button>
          <Button className="delete-btn" onClick={handleDelete}>
            删除
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

export default DishDetail;

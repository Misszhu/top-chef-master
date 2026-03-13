import React, { useState } from 'react';
import { View, Text, Input, Button, Form, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDispatch } from 'react-redux';
import { createNewDish } from '../../store/slices/dishSlice';
import { AppDispatch } from '../../store';
import { ImageService } from '../../services/image-service';
import './index.scss';

const AddDish: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'easy',
    cookingTime: 30,
    servings: 2,
    image: '',
    tags: [] as string[],
    ingredients: [] as any[],
    steps: [] as any[],
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async () => {
    try {
      const imagePath = await ImageService.selectImage();
      const base64 = await ImageService.convertToBase64(imagePath);
      handleInputChange('image', base64);
      Taro.showToast({ title: '图片上传成功', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '图片上传失败', icon: 'error' });
    }
  };

  const handleAddIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: `ing_${Date.now()}`, name: '', quantity: 0, unit: '' },
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        { id: `step_${Date.now()}`, stepNumber: prev.steps.length + 1, description: '', image: '' },
      ],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '菜名不能为空', icon: 'error' });
      return;
    }

    if (formData.ingredients.length === 0) {
      Taro.showToast({ title: '至少需要一个食材', icon: 'error' });
      return;
    }

    if (formData.steps.length === 0) {
      Taro.showToast({ title: '至少需要一个制作步骤', icon: 'error' });
      return;
    }

    setLoading(true);
    try {
      await dispatch(createNewDish(formData));
      Taro.showToast({ title: '菜肴添加成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch (error) {
      Taro.showToast({ title: '添加失败，请重试', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="add-dish-page">
      <View className="form-container">
        <Form>
          {/* 基本信息 */}
          <View className="form-section">
            <Text className="section-title">基本信息</Text>

            <View className="form-group">
              <Text className="label">菜名</Text>
              <Input
                placeholder="输入菜名"
                value={formData.name}
                onInput={e => handleInputChange('name', e.detail.value)}
                className="input"
              />
            </View>

            <View className="form-group">
              <Text className="label">描述</Text>
              <Textarea
                placeholder="输入菜肴描述"
                value={formData.description}
                onInput={e => handleInputChange('description', e.detail.value)}
                className="textarea"
              />
            </View>

            <View className="form-row">
              <View className="form-group">
                <Text className="label">难度</Text>
                <select
                  value={formData.difficulty}
                  onChange={e => handleInputChange('difficulty', e.target.value)}
                  className="select"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </View>

              <View className="form-group">
                <Text className="label">烹饪时间（分钟）</Text>
                <Input
                  type="number"
                  value={String(formData.cookingTime)}
                  onInput={e => handleInputChange('cookingTime', Number(e.detail.value))}
                  className="input"
                />
              </View>

              <View className="form-group">
                <Text className="label">份量（人）</Text>
                <Input
                  type="number"
                  value={String(formData.servings)}
                  onInput={e => handleInputChange('servings', Number(e.detail.value))}
                  className="input"
                />
              </View>
            </View>
          </View>

          {/* 图片 */}
          <View className="form-section">
            <Text className="section-title">菜肴图片</Text>
            <Button className="upload-btn" onClick={handleImageUpload}>
              {formData.image ? '更换图片' : '上传图片'}
            </Button>
            {formData.image && <img src={formData.image} alt="preview" className="image-preview" />}
          </View>

          {/* 食材 */}
          <View className="form-section">
            <View className="section-header">
              <Text className="section-title">食材</Text>
              <Button className="add-btn-small" onClick={handleAddIngredient}>
                + 添加食材
              </Button>
            </View>

            <>
              {formData.ingredients.map((ing, index) => (
                <View key={ing.id} className="form-row ingredient-row">
                  <Input
                    placeholder="食材名称"
                    value={ing.name}
                    onInput={e => {
                      const newIng = [...formData.ingredients];
                      newIng[index].name = e.detail.value;
                      handleInputChange('ingredients', newIng);
                    }}
                    className="input"
                  />
                  <Input
                    type="number"
                    placeholder="数量"
                    value={String(ing.quantity)}
                    onInput={e => {
                      const newIng = [...formData.ingredients];
                      newIng[index].quantity = Number(e.detail.value);
                      handleInputChange('ingredients', newIng);
                    }}
                    className="input-short"
                  />
                  <Input
                    placeholder="单位"
                    value={ing.unit}
                    onInput={e => {
                      const newIng = [...formData.ingredients];
                      newIng[index].unit = e.detail.value;
                      handleInputChange('ingredients', newIng);
                    }}
                    className="input-short"
                  />
                  <Button className="remove-btn" onClick={() => handleRemoveIngredient(index)}>
                    删除
                  </Button>
                </View>
              ))}
            </>
          </View>

          {/* 制作步骤 */}
          <View className="form-section">
            <View className="section-header">
              <Text className="section-title">制作步骤</Text>
              <Button className="add-btn-small" onClick={handleAddStep}>
                + 添加步骤
              </Button>
            </View>

            <>
              {formData.steps.map((step, index) => (
                <View key={step.id} className="step-form-item">
                  <View className="step-number">{index + 1}</View>
                  <View className="step-form-content">
                    <Textarea
                      placeholder="步骤描述"
                      value={step.description}
                      onInput={e => {
                        const newSteps = [...formData.steps];
                        newSteps[index].description = e.detail.value;
                        handleInputChange('steps', newSteps);
                      }}
                      className="textarea"
                    />
                    <Button className="remove-btn" onClick={() => handleRemoveStep(index)}>
                      删除此步
                    </Button>
                  </View>
                </View>
              ))}
            </>
          </View>
        </Form>

        {/* 提交按钮 */}
        <View className="form-actions">
          <Button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存菜肴'}
          </Button>
          <Button className="cancel-btn" onClick={() => Taro.navigateBack()}>
            取消
          </Button>
        </View>
      </View>
    </View>
  );
};

export default AddDish;

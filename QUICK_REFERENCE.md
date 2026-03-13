# 快速参考指南

## 📁 重要文件和目录

### 项目配置
- `package.json` - 项目依赖和脚本命令
- `tsconfig.json` - TypeScript 配置
- `.eslintrc.js` - ESLint 代码规范配置
- `.prettierrc` - Prettier 代码格式化配置
- `config/index.ts` - Taro 框架配置

### 源代码目录
- `src/app.tsx` - 应用入口
- `src/app.config.ts` - 小程序配置（页面、导航栏等）
- `src/pages/` - 所有页面
- `src/components/` - 可复用组件
- `src/services/` - 业务逻辑层
- `src/store/` - Redux 状态管理
- `src/types/` - TypeScript 类型定义
- `src/utils/` - 工具函数
- `src/styles/` - 全局样式

### 文档
- `README.md` - 项目概览
- `SETUP.md` - 初始化和开发指南
- `PRODUCT_DESIGN.md` - 产品设计文档
- `TECHNICAL_DESIGN.md` - 技术设计文档

---

## 🚀 快速命令

```bash
# 安装依赖
npm install

# 开发模式（微信小程序）
npm run dev:weapp

# 开发模式（H5 Web）
npm run dev:h5

# 生产构建
npm run build:weapp

# 代码检查
npm run lint

# 自动修复代码
npm run lint:fix

# 格式化代码
npm run format
```

---

## 📂 新增页面快速清单

```
src/pages/my-page/
├── index.tsx        # 页面组件
└── index.scss       # 页面样式
```

1. 创建页面文件夹
2. 在 `src/app.config.ts` 的 `pages` 数组中添加 `'pages/my-page/index'`
3. 如需要在 TabBar 显示，更新 `tabBar.list`

---

## 🛠 Redux 状态管理速查

```typescript
// 导入相关模块
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchDishes } from '../../store/slices/dishSlice';

// 在组件中使用
const Component = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dishes = useSelector((state: RootState) => state.dish.dishes);

  useEffect(() => {
    dispatch(fetchDishes());
  }, [dispatch]);

  return <View>{dishes.length}</View>;
};
```

---

## 🎨 样式系统速查

```scss
// 使用预定义的变量和混合
@import '../../styles/variables';
@import '../../styles/mixins';

.component {
  @include flex-center;  // 使用混合
  color: $primary-color; // 使用变量
  padding: $spacing-md;
}
```

---

## 🔧 常用 API

### DishService
- `getAllDishes()` - 获取所有菜肴
- `createDish(data)` - 创建菜肴
- `updateDish(id, data)` - 更新菜肴
- `deleteDish(id)` - 删除菜肴
- `searchDishes(keyword)` - 搜索菜肴
- `toggleFavorite(id)` - 切换收藏

### StorageService
- `setItem(key, data)` - 保存数据
- `getItem(key)` - 读取数据
- `removeItem(key)` - 删除数据
- `clear()` - 清空所有

### ImageService
- `selectImage()` - 选择图片
- `convertToBase64(path)` - 转换为 Base64
- `compressImage(path)` - 压缩图片

---

## 📚 学习资源

- Taro 官方: https://docs.taro.zone/
- Redux Toolkit: https://redux-toolkit.js.org/
- TypeScript: https://www.typescriptlang.org/docs/
- React: https://react.dev/
- micro:bit 小程序: https://developers.weixin.qq.com/

---

## 🎯 开发流程模板

### 1. 创建新功能
- [ ] 定义类型（如需）
- [ ] 创建服务
- [ ] 创建 Redux slice
- [ ] 创建页面或组件
- [ ] 编写样式
- [ ] 测试功能
- [ ] 代码检查和格式化

### 2. 修复 Bug
- [ ] 定位问题代码
- [ ] 理解问题原因
- [ ] 实现修复
- [ ] 测试修复
- [ ] 验证没有回归

### 3. 性能优化
- [ ] 识别瓶颈
- [ ] 制定优化方案
- [ ] 实现优化
- [ ] 测试性能提升
- [ ] 文档更新

---

**Version**: 1.0.0 | **Updated**: 2026-03-13

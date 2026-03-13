# 项目初始化和开发指南

## 🎯 项目初始化步骤

### 1. 安装依赖

```bash
cd /Users/zhuhuiting/Documents/projects/top-chef-master
npm install
```

如果使用 yarn：
```bash
yarn install
```

### 2. 开发环境设置

#### 2.1 编译为微信小程序

```bash
npm run dev:weapp
```

此命令将：
- 监听源码文件变化
- 自动编译 TypeScript、SCSS 等
- 编译输出到 `dist` 目录

#### 2.2 在微信开发者工具中预览

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 选择 "导入项目"
3. 选择项目文件夹：`/Users/zhuhuiting/Documents/projects/top-chef-master`
4. 输入微信小程序 AppID（可选，开发时可跳过）
5. 点击 "导入"

微信开发者工具会监听文件变化，实时预览效果。

### 3. 代码规范

#### 3.1 检查代码规范

```bash
npm run lint
```

#### 3.2 自动修复代码规范问题

```bash
npm run lint:fix
```

#### 3.3 格式化代码

```bash
npm run format
```

### 4. 生产构建

#### 4.1 构建微信小程序版本

```bash
npm run build:weapp
```

编译完成后，用微信开发者工具打开 `dist` 目录，点击右上角的 "上传" 按钮提交审核。

#### 4.2 构建 H5 版本（可选，用于浏览器预览）

```bash
npm run build:h5
```

## 📝 第一次使用指南

### 1. 了解项目结构

查看 [README.md](./README.md) 了解项目结构和主要功能。

### 2. 阅读设计文档

- 产品需求：[PRODUCT_DESIGN.md](./PRODUCT_DESIGN.md)
- 技术实现：[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)

### 3. 开发工作流

#### 添加新功能的步骤：

1. **定义类型**（如需要）
   ```typescript
   // 在 src/types/ 中定义新的类型
   export interface NewFeature {
     // ...
   }
   ```

2. **创建服务**（如需要）
   ```typescript
   // 在 src/services/ 中创建新的服务类
   export class NewService {
     static methodName() {
       // 实现业务逻辑
     }
   }
   ```

3. **创建 Redux Slice**（如需要）
   ```typescript
   // 在 src/store/slices/ 中创建 slice
   const newSlice = createSlice({
     name: 'new',
     initialState: {},
     reducers: {},
   });
   ```

4. **创建页面或组件**
   ```typescript
   // 在 src/pages/ 或 src/components/ 中创建文件
   const Component: React.FC = () => {
     return <View>Hello</View>;
   };
   ```

5. **编写样式**
   ```scss
   // 在同级目录创建 .scss 文件
   .component-class {
     // 样式定义
   }
   ```

6. **测试**
   - 在微信开发者工具中预览
   - 修复可能出现的问题

7. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

## 🔨 常见开发任务

### 添加新的页面

1. 在 `src/pages/` 中创建新文件夹
2. 创建 `index.tsx` 和 `index.scss`
3. 在 `src/app.config.ts` 中的 `pages` 数组中添加新页面路径
4. 如果需要在 TabBar 中显示，更新 `app.config.ts` 中的 `tabBar` 配置

### 添加新的组件

1. 在 `src/components/` 中创建新文件夹
2. 创建 `index.tsx` 和 `index.scss`
3. 导出组件
4. 在需要的地方导入使用

### 修改全局样式

- 修改全局样式变量：`src/styles/variables.scss`
- 修改全局样式混合：`src/styles/mixins.scss`
- 修改全局应用样式：`src/app.scss`

### 使用 Redux

```typescript
// 在组件中使用 Redux 数据和方法
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchDishes } from '../../store/slices/dishSlice';

const Component: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dishes = useSelector((state: RootState) => state.dish.dishes);

  useEffect(() => {
    dispatch(fetchDishes());
  }, [dispatch]);

  return <View>{dishes.length} 道菜肴</View>;
};
```

## 🐛 调试技巧

### 1. 使用微信开发者工具的调试器

- 打开微信开发者工具的 "Console" 标签
- 查看 JavaScript 错误和日志输出
- 使用 `console.log()` 调试代码

### 2. 使用 Source Map

编译时会自动生成 source map 文件，可以在浏览器中调试原始 TypeScript 代码。

### 3. 检查存储内容

在微信开发者工具中：
- 点击 "Storage" 标签
- 展开 "Local Storage"
- 查看保存的数据

### 4. 模拟移动设备

在微信开发者工具中：
- 点击右上角的 "设备" 按钮
- 选择不同的设备型号查看适配效果

## 📱 微信小程序特殊事项

### 权限申请

需要图片权限时，在 `src/app.config.ts` 中配置：

```typescript
permission: {
  'scope.camera': {
    desc: '拍照需要访问你的相机',
  },
}
```

### 分享功能

在小程序中实现分享：

```typescript
import Taro from '@tarojs/taro';

Taro.showShareMenu({
  withShareTicket: true,
});
```

### 顶部导航栏

自定义导航栏：

```typescript
// 在 src/app.config.ts 中配置
window: {
  navigationBarTitleText: '我的菜谱',
  navigationBarBackgroundColor: '#ffffff',
}
```

## 🚀 部署流程

### 1. 本地测试完成

```bash
npm run build:weapp
```

### 2. 在微信开发者工具中上传

- 用微信开发者工具打开 `dist` 目录
- 点击右上角 "上传" 按钮
- 输入版本号和描述
- 点击 "上传"

### 3. 在微信公众平台进行审核

- 访问 [微信公众平台](https://mp.weixin.qq.com/)
- 进入小程序管理后台
- 在 "版本管理"中找到刚上传的版本
- 提交审核

### 4. 审核通过后发布

审核通过后，在后台点击 "发布" 按钮即可上线。

## 📊 性能优化建议

### 1. 减少页面加载时间

- 使用代码分割
- 懒加载组件和资源
- 压缩图片大小

### 2. 优化 Redux Store

- 只在必要时更新状态
- 使用 selectors 避免不必要的重新渲染
- 使用 Redux DevTools 监控状态变化

### 3. 优化列表性能

- 为列表项添加唯一的 key
- 使用虚拟滚动处理大列表
- 缓存列表数据

### 4. 监控存储容量

定期检查本地存储使用情况：

```typescript
const info = await StorageService.getStorageInfo();
console.log(`已用: ${info.currentSize}, 总容量: ${info.limitSize}`);
```

## 🆘 遇到问题？

### 常见错误

| 错误 | 解决方案 |
|------|--------|
| `Cannot find module '@tarojs/taro'` | 运行 `npm install` |
| `TypeScript errors` | 检查 tsconfig.json 配置 |
| `页面无法加载` | 检查 app.config.ts 中的路径是否正确 |
| `样式不生效` | 检查 SCSS 导入和类名是否正确 |
| `Redux 数据为空` | 确保在使用前调用了 dispatch thunk |

### 获取帮助

1. 查看错误信息中的文件和行号
2. 检查本项目的 [README.md](./README.md)
3. 查看 Taro 官方文档：https://docs.taro.zone/
4. 查看 Redux 官方文档：https://redux.js.org/
5. 查看微信开发者工具文档

## 📚 相关文档链接

- [Taro 官方文档](https://docs.taro.zone/)
- [Redux Toolkit 文档](https://redux-toolkit.js.org/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [React Hooks 文档](https://react.dev/reference/react)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/)
- [ESLint 配置指南](https://eslint.org/)
- [Prettier 配置指南](https://prettier.io/)

---

**Last Updated**: 2026-03-13

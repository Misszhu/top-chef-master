# TopChef - 我的菜谱

一个基于 Taro 框架开发的微信小程序，用于记录和管理您自己会做的菜肴。

## 📱 项目简介

TopChef 是一个个人菜肴管理应用，帮助用户：
- 📝 记录自己会做的菜肴
- 📸 拍照保存菜肴图片
- 🥘 详细记录食材和烹饪步骤
- ⭐ 收藏喜欢的菜肴
- 🔍 快速搜索和分类查看

## 🛠 技术栈

- **框架**: Taro 4.x（跨平台小程序开发框架）
- **编程语言**: TypeScript + React Hooks
- **状态管理**: Redux Toolkit
- **UI 组件**: Taro Components
- **样式**: SCSS/SASS
- **本地存储**: 微信小程序 Storage API
- **构建工具**: Webpack 5
- **代码规范**: ESLint + Prettier

## 📁 项目结构

```
top-chef-master/
├── src/
│   ├── app.tsx                 # 应用入口
│   ├── app.config.ts          # 应用配置
│   ├── app.scss               # 全局样式
│   ├── pages/                 # 页面
│   │   ├── home/              # 首页
│   │   ├── dish-detail/       # 菜肴详情
│   │   ├── add-dish/          # 添加菜肴
│   │   ├── edit-dish/         # 编辑菜肴
│   │   ├── favorites/         # 收藏列表
│   │   ├── category/          # 分类浏览
│   │   └── profile/           # 个人中心
│   ├── components/            # 可复用组件
│   ├── services/              # 业务逻辑层
│   │   ├── storage-service.ts # 存储服务
│   │   ├── dish-service.ts    # 菜肴服务
│   │   └── image-service.ts   # 图片服务
│   ├── store/                 # Redux 状态管理
│   │   ├── slices/
│   │   │   ├── dishSlice.ts   # 菜肴数据 slice
│   │   │   └── uiSlice.ts     # UI 状态 slice
│   │   └── index.ts
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数
│   └── styles/                # 全局样式
├── config/                    # Taro 配置
├── package.json
├── tsconfig.json
├── .eslintrc.js               # ESLint 配置
├── .prettierrc                # Prettier 配置
├── PRODUCT_DESIGN.md          # 产品设计文档
├── TECHNICAL_DESIGN.md        # 技术设计文档
└── README.md
```

## 🚀 快速开始

### 前置要求
- Node.js >= 14.0
- npm 或 yarn
- 微信开发者工具

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

编译为微信小程序并监听文件变化：

```bash
npm run dev:weapp
```

编译为 H5 版本（浏览器预览）：

```bash
npm run dev:h5
```

### 生产构建

构建微信小程序：

```bash
npm run build:weapp
```

构建 H5 版本：

```bash
npm run build:h5
```

### 预览小程序

1. 用微信开发者工具打开 `dist` 目录
2. 点击"预览"或"上传"按钮

## 📝 主要功能

### 1. 首页 (Home)
- 显示所有菜肴的列表
- 支持搜索、排序和筛选
- 快速添加新菜肴

### 2. 菜肴详情 (Dish Detail)
- 展示菜肴的完整信息
- 显示食材列表和制作步骤
- 支持编辑和删除
- 收藏/取消收藏

### 3. 添加菜肴 (Add Dish)
- 输入菜名、描述、难度等基本信息
- 上传菜肴图片
- 动态添加食材
- 动态添加烹饪步骤

### 4. 编辑菜肴 (Edit Dish)
- 修改已有菜肴的信息（开发中）

### 5. 收藏列表 (Favorites)
- 查看所有收藏的菜肴
- 快速访问常用菜肴

### 6. 分类浏览 (Category)
- 按标签分类浏览
- 按难度级别分类
- （开发中）

### 7. 个人中心 (Profile)
- 显示菜肴统计信息
- 分享功能
- 应用设置

## 💾 数据存储

所有数据都存储在微信小程序的本地存储中：

### 存储键值对
- `dishes:list` - 菜肴列表
- `favorites:ids` - 收藏 ID 列表
- `app:settings` - 应用设置

## 🔧 配置说明

### Taro 配置 (config/index.ts)
- 设计稿宽度：750px
- 框架：React
- 编译器：Webpack 5

### TypeScript 配置 (tsconfig.json)
- 严格模式启用
- 支持路径别名 (`@/*`)
- 目标：ES2020

## 📚 核心服务 API

### DishService（菜肴服务）

```typescript
// 获取所有菜肴
DishService.getAllDishes(): Promise<Dish[]>

// 创建菜肴
DishService.createDish(dishData: DishFormData): Promise<Dish>

// 更新菜肴
DishService.updateDish(id: string, updates: Partial<DishFormData>): Promise<Dish>

// 删除菜肴
DishService.deleteDish(id: string): Promise<void>

// 搜索菜肴
DishService.searchDishes(keyword: string): Promise<Dish[]>

// 筛选菜肴
DishService.filterDishes(options: FilterOptions): Promise<Dish[]>

// 切换收藏
DishService.toggleFavorite(id: string): Promise<boolean>

// 获取统计信息
DishService.getStatistics(): Promise<Statistics>
```

## 🎨 样式系统

### 颜色变量
- 主色：`#ff6b35`
- 次色：`#f7931e`
- 成功：`#4caf50`
- 出错：`#f44336`
- 警告：`#ff9800`

## 🐛 常见问题

### Q: 如何在微信开发者工具中预览？
A: 编译完成后，用微信开发者工具打开 `dist` 目录即可。

### Q: 数据存储的容量限制是多少？
A: 微信小程序本地存储容量通常为 10MB。

### Q: 如何上传图片？
A: 点击添加菜肴页面的"上传图片"按钮，选择从相册或拍照。

## 📄 文档

- [产品设计文档](./PRODUCT_DESIGN.md) - 产品需求和商业逻辑
- [技术设计文档](./TECHNICAL_DESIGN.md) - 技术架构和实现细节

## 🚧 开发计划

### Phase 1（当前）
- ✅ 项目初始化完成
- ✅ 基础目录结构建立
- ✅ 类型定义和工具函数
- ✅ 服务层实现
- ✅ Redux 状态管理配置
- 🔄 页面功能完善

### Phase 2（后续）
- 云端数据同步
- 菜肴分享功能
- 高级搜索和筛选

### Phase 3（增强）
- AI 菜肴推荐
- 社区功能

---

**Last Updated**: 2026-03-13 | **Version**: 1.0.0
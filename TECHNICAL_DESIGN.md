# 技术设计文档 - 顶级主厨（TopChef）

## 1. 技术架构概述

### 1.1 技术栈选择
- **框架**：Taro 4.x（跨平台小程序开发框架）
- **编程语言**：TypeScript + React Hooks
- **UI 库**：NutUI for Taro（或 Taro UI）
- **状态管理**：Redux Toolkit
- **本地存储**：微信小程序 Storage API（wx.setStorage/getStorage）
- **构建工具**：Webpack 5（Taro 内置）
- **CSS 预处理**：SCSS/SASS
- **代码规范**：ESLint + Prettier

### 1.2 架构图
```
┌─────────────────────────────────────────────┐
│         微信小程序前端（Taro + React）      │
│  ┌──────────────────────────────────────┐  │
│  │          Page Layer                   │  │
│  │  (Pages: Home, Detail, Add, etc.)    │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │        Component Layer                │  │
│  │  (通用组件、业务组件)                  │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │         Service Layer                 │  │
│  │  (API 调用、数据处理、业务逻辑)       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │         Storage Layer                 │  │
│  │  (本地存储、缓存管理)                  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │
         │ 调用
         ▼
┌─────────────────────────────────────────────┐
│         微信小程序内置 API                  │
│  (Storage、Image、File 等)                  │
└─────────────────────────────────────────────┘
```

---

## 2. 后端架构设计

### 2.1 后端技术栈
- **框架**：Node.js + Express.js（或 Fastify）
- **编程语言**：TypeScript / JavaScript
- **数据库**：
  - 主库：PostgreSQL（结构化数据）
  - 缓存层：Redis（热数据缓存）
  - 文件存储：阿里 OSS / 腾讯 COS（图片存储）
- **API 文档**：Swagger/OpenAPI
- **认证**：JWT Token + 微信登录
- **日志**：Winston / Bunyan
- **监控**：Prometheus + Grafana
- **消息队列**：RabbitMQ / Kafka（可选，用于异步任务）
- **部署**：Docker + Kubernetes / 云原生（可选）

### 2.2 后端架构图
```
┌────────────────────────────────────────────────────────┐
│           微信小程序客户端 (顶级主厨)                  │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ HTTP/RESTful API
                     │ (HTTPS)
                     ▼
┌────────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer               │
│           (nginx / Cloud Load Balancer)                │
└─────────────────────┬──────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  API Server  │ │  API Server  │ │  API Server  │
│  Instance 1  │ │  Instance 2  │ │  Instance N  │
│              │ │              │ │              │
│ ┌──────────┐ │ └──────────────┘ └──────────────┘
│ │ Express  │ │
│ │ Routes   │ │
│ │ & Logic  │ │
│ └────┬─────┘ │
│      │       │
│ ┌────┴──────────────────────────────┐
│ │  Service Layer                    │
│ │  - DishService                    │
│ │  - UserService                    │
│ │  - CommentService                 │
│ │  - ShareService                   │
│ └────┬──────────────────────────────┘
│      │
│ ┌────┴──────────────────────────────┐
│ │  Data Access Layer                │
│ │  - Repository Pattern             │
│ │  - Query Builder / ORM            │
│ └──────────────────────────────────┘
└──────────────────────────────────────┘
        │         │         │
        │         │         │
    ┌───┴──┐  ┌──┴──┐  ┌──┴──────┐
    │      │  │     │  │         │
    ▼      ▼  ▼     ▼  ▼         ▼
 ┌──────┐┌────────┐┌──────┐┌─────────┐
 │ DB   ││ Redis  ││ OSS  ││ Message │
 │Pools ││ Cache  ││Files ││ Queue   │
 │(PG)  │└────────┘└──────┘└─────────┘
 └──────┘
   │
   ▼
 PostgreSQL
```

### 2.3 后端项目结构
```
backend/
├── src/
│   ├── app.ts                           # Express 应用主文件
│   ├── server.ts                        # 服务器启动文件
│   ├── config/                          # 配置文件
│   │   ├── index.ts                     # 环境变量配置
│   │   ├── database.ts                  # 数据库连接配置
│   │   └── redis.ts                     # Redis 连接配置
│   ├── routes/                          # 路由定义
│   │   ├── index.ts                     # 路由汇总
│   │   ├── dish.routes.ts               # 菜肴相关路由
│   │   ├── user.routes.ts               # 用户相关路由
│   │   ├── comment.routes.ts            # 评论相关路由
│   │   ├── share.routes.ts              # 分享相关路由
│   │   ├── menu.routes.ts               # 菜单相关路由（新增）
│   │   └── shopping-list.routes.ts      # 购物清单路由（新增）
│   ├── controllers/                     # 控制层
│   │   ├── dish.controller.ts           # 菜肴控制器
│   │   ├── user.controller.ts           # 用户控制器
│   │   ├── comment.controller.ts        # 评论控制器
│   │   ├── share.controller.ts          # 分享控制器
│   │   ├── menu.controller.ts           # 菜单控制器（新增）
│   │   └── shopping-list.controller.ts  # 购物清单控制器（新增）
│   ├── services/                        # 业务逻辑层
│   │   ├── dish.service.ts              # 菜肴服务
│   │   ├── user.service.ts              # 用户服务
│   │   ├── comment.service.ts           # 评论服务
│   │   ├── share.service.ts             # 分享服务
│   │   ├── auth.service.ts              # 认证服务
│   │   ├── file.service.ts              # 文件上传服务
│   │   ├── menu.service.ts              # 菜单服务（新增）
│   │   └── shopping-list.service.ts     # 购物清单服务（新增）
│   ├── repositories/                    # 数据访问层
│   │   ├── base.repository.ts           # 基础 Repository
│   │   ├── dish.repository.ts           # 菜肴仓储
│   │   ├── user.repository.ts           # 用户仓储
│   │   ├── comment.repository.ts        # 评论仓储
│   │   ├── share.repository.ts          # 分享仓储
│   │   ├── menu.repository.ts           # 菜单仓储（新增）
│   │   └── shopping-list.repository.ts  # 购物清单仓储（新增）
│   ├── models/                          # 数据模型
│   │   ├── dish.model.ts                # 菜肴模型
│   │   ├── user.model.ts                # 用户模型
│   │   ├── comment.model.ts             # 评论模型
│   │   ├── share.model.ts               # 分享模型
│   │   ├── menu.model.ts                # 菜单模型（新增）
│   │   ├── menu-item.model.ts           # 菜单项模型（新增）
│   │   ├── shopping-list.model.ts       # 购物清单模型（新增）
│   │   ├── shopping-list-item.model.ts  # 购物清单项模型（新增）
│   │   └── index.ts                     # 模型初始化
│   ├── middleware/                      # 中间件
│   │   ├── auth.middleware.ts           # 身份验证中间件
│   │   ├── error.middleware.ts          # 错误处理中间件
│   │   ├── logger.middleware.ts         # 日志中间件
│   │   ├── validator.middleware.ts      # 数据验证中间件
│   │   └── ratelimit.middleware.ts      # 限流中间件
│   ├── utils/                           # 工具函数
│   │   ├── logger.ts                    # 日志工具
│   │   ├── jwt.ts                       # JWT 工具
│   │   ├── wechat.ts                    # 微信接口工具
│   │   ├── file-upload.ts               # 文件上传工具
│   │   └── error.ts                     # 错误处理工具
│   ├── types/                           # TypeScript 类型
│   │   ├── index.ts                     # 通用类型
│   │   ├── express.d.ts                 # Express 扩展类型
│   │   └── wechat.d.ts                  # 微信相关类型
│   └── database/                        # 数据库相关
│       ├── migrations/                  # 数据库迁移
│       ├── seeds/                       # 数据填充
│       └── queries/                     # SQL 查询
├── tests/                               # 单元测试和集成测试
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env                                 # 环境变量
├── .env.example
├── docker-compose.yml                   # Docker 编排
├── Dockerfile
├── package.json
├── tsconfig.json
├── jest.config.js                       # 测试配置
├── README.md
└── DEPLOYMENT.md                        # 部署文档
```

### 2.4 数据库设计（PostgreSQL）

#### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_openid VARCHAR(100) UNIQUE NOT NULL,
  wechat_unionid VARCHAR(100) UNIQUE,
  nickname VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  status ENUM('active', 'banned', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

#### 菜肴表 (dishes)
```sql
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50), -- easy, medium, hard
  cooking_time INTEGER, -- 分钟
  servings INTEGER,
  image_url TEXT,
  tags TEXT[], -- 存储标签数组
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### 食材表 (ingredients)
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount VARCHAR(50),
  unit VARCHAR(20),
  sequence INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  INDEX idx_dish_id (dish_id)
);
```

#### 烹饪步骤表 (cooking_steps)
```sql
CREATE TABLE cooking_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  INDEX idx_dish_id (dish_id),
  UNIQUE (dish_id, step_number)
);
```

#### 收藏表 (favorites)
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dish_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  UNIQUE (user_id, dish_id),
  INDEX idx_user_id (user_id),
  INDEX idx_dish_id (dish_id)
);
```

#### 评论表 (comments)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER, -- 1-5 星评分
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dish_id (dish_id),
  INDEX idx_user_id (user_id)
);
```

#### 分享记录表 (shares)
```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL,
  user_id UUID NOT NULL,
  share_type VARCHAR(50), -- wechat_friend, wechat_group, qrcode
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dish_id (dish_id),
  INDEX idx_user_id (user_id)
);
```

#### 菜单表 (menus)（新增）
```sql
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tags TEXT[], -- 菜单标签数组
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

#### 菜单项表 (menu_items)（新增）
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL,
  dish_id UUID NOT NULL,
  servings DECIMAL(5,2) DEFAULT 1, -- 份量，支持小数
  notes TEXT,
  sequence INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  UNIQUE (menu_id, dish_id),
  INDEX idx_menu_id (menu_id),
  INDEX idx_dish_id (dish_id)
);
```

#### 购物清单表 (shopping_lists)（新增）
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  menu_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_menu_id (menu_id)
);
```

#### 购物清单项表 (shopping_list_items)（新增）
```sql
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  category VARCHAR(50), -- 蔬菜、肉类、调料、其他
  is_checked BOOLEAN DEFAULT false,
  notes TEXT,
  sequence INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  INDEX idx_shopping_list_id (shopping_list_id)
);
```

### 2.5 后端RESTful API 设计

#### 身份验证接口
```
POST /api/v1/auth/login
  请求：{ code: "微信登录授权码" }
  响应：{ token: "JWT Token", user: {...} }

POST /api/v1/auth/logout
  请求：无
  响应：{ message: "退出成功" }

POST /api/v1/auth/refresh
  请求：无（使用 Cookie 中的 refresh_token）
  响应：{ token: "新的 JWT Token" }
```

#### 菜肴接口
```
GET /api/v1/dishes
  参数：?page=1&limit=20&sort=latest&tag=快手菜&difficulty=easy
  响应：{ data: [...], total: 100, page: 1 }

GET /api/v1/dishes/:id
  响应：{ id, name, description, ingredients, steps, comments, ... }

POST /api/v1/dishes
  请求：{ name, description, difficulty, cookingTime, ... }
  响应：{ id, ... }  [需要认证]

PUT /api/v1/dishes/:id
  请求：{ name, description, ... }
  响应：{ id, ... }  [需要认证，需要是创建者]

DELETE /api/v1/dishes/:id
  响应：{ message: "删除成功" }  [需要认证，需要是创建者]

POST /api/v1/dishes/:id/image/upload
  请求：FormData（image 文件）
  响应：{ imageUrl: "..." }  [需要认证]
```

#### 收藏接口
```
GET /api/v1/favorites
  响应：[{ id, name, ... }]  [需要认证]

POST /api/v1/favorites/:dishId
  响应：{ message: "已收藏" }  [需要认证]

DELETE /api/v1/favorites/:dishId
  响应：{ message: "已取消收藏" }  [需要认证]

GET /api/v1/favorites/:dishId/status
  响应：{ isFavorited: true/false }  [需要认证]
```

#### 评论接口
```
GET /api/v1/dishes/:id/comments
  参数：?page=1&limit=10
  响应：{ data: [...], total: 50 }

POST /api/v1/dishes/:id/comments
  请求：{ content, rating: 5 }
  响应：{ id, content, ... }  [需要认证]

DELETE /api/v1/comments/:id
  响应：{ message: "删除成功" }  [需要认证，需要是作者]
```

#### 分享接口
```
POST /api/v1/shares
  请求：{ dishId, shareType: "wechat_friend" }
  响应：{ shareUrl: "..." }  [需要认证]

GET /api/v1/shares/stats/:dishId
  响应：{ shareCount: 100, viewCount: 500 }
```

#### 用户接口
```
GET /api/v1/users/profile
  响应：{ id, nickname, avatar, ... }  [需要认证]

PUT /api/v1/users/profile
  请求：{ nickname, phone, email }
  响应：{ id, nickname, ... }  [需要认证]

GET /api/v1/users/:id/dishes
  参数：?page=1&limit=20
  响应：{ data: [...], total: 30 }

GET /api/v1/users/:id/followers
  响应：{ data: [...], total: 100 }

POST /api/v1/users/:id/follow
  响应：{ message: "已关注" }  [需要认证]

DELETE /api/v1/users/:id/follow
  响应：{ message: "已取消关注" }  [需要认证]
```

#### 菜单接口（新增）
```
GET /api/v1/menus
  参数：?page=1&limit=20&sort=latest
  响应：{ data: [...], total: 100 }  [需要认证]

GET /api/v1/menus/:id
  响应：{ id, name, description, dishes: [...], ... }

POST /api/v1/menus
  请求：{ name, description, tags: [], coverImage }
  响应：{ id, ... }  [需要认证]

PUT /api/v1/menus/:id
  请求：{ name, description, tags, coverImage }
  响应：{ id, ... }  [需要认证，需要是创建者]

DELETE /api/v1/menus/:id
  响应：{ message: "删除成功" }  [需要认证，需要是创建者]

POST /api/v1/menus/:id/copy
  请求：{ newName? }
  响应：{ id, copiedFrom, ... }  [需要认证]

POST /api/v1/menus/:id/items
  请求：{ dishId, servings, notes }
  响应：{ id, ... }  [需要认证]

DELETE /api/v1/menus/:id/items/:itemId
  响应：{ message: "删除成功" }  [需要认证]

PUT /api/v1/menus/:id/items/:itemId
  请求：{ servings, notes }
  响应：{ id, ... }  [需要认证]

PUT /api/v1/menus/:id/publish
  请求：{ isPublic: true }
  响应：{ isPublic, shareUrl, ... }  [需要认证]

GET /api/v1/menus/:id/share-stats
  响应：{ shareCount: 100 }
```

#### 购物清单接口（新增）
```
POST /api/v1/shopping-lists
  请求：{ menuId? }
  响应：{ id, items: [], ... }  [需要认证]

GET /api/v1/shopping-lists/:id
  响应：{ id, items: [...], estimatedCost, ... }  [需要认证]

PUT /api/v1/shopping-lists/:id/items/:itemId
  请求：{ isChecked: true, quantity, notes }
  响应：{ id, ... }  [需要认证]

POST /api/v1/shopping-lists/:id/items
  请求：{ ingredientName, quantity, unit, category, notes }
  响应：{ id, ... }  [需要认证]

DELETE /api/v1/shopping-lists/:id/items/:itemId
  响应：{ message: "删除成功" }  [需要认证]

DELETE /api/v1/shopping-lists/:id
  响应：{ message: "删除成功" }  [需要认证]

POST /api/v1/shopping-lists/:id/from-menu/:menuId
  请求：无
  响应：{ id, items: [], ... }  [需要认证]
```

### 2.6 认证与安全

#### JWT Token 设计
```typescript
// Token payload
{
  sub: "用户ID",
  iat: 1710230400,
  exp: 1710316800,  // 24小时过期
  aud: "topcheif",
  iss: "topcheif-backend"
}

// Refresh Token（7天过期，存储在 HttpOnly Cookie）
{
  sub: "用户ID",
  type: "refresh",
  iat: 1710230400,
  exp: 1710835200
}
```

#### 微信认证流程
```
1. 小程序端调用 wx.login() 获取 code
2. 小程序端发送 code 到后端 POST /api/v1/auth/login
3. 后端使用 appid + appsecret + code 调用微信接口获取 openid
4. 后端根据 openid 查询或创建用户
5. 后端返回 JWT Token 和刷新令牌
6. 小程序端存储 Token，用于后续请求
```

#### 安全措施
- **HTTPS**：所有通信使用 HTTPS
- **CORS**：配置严格的 CORS 策略，仅允许微信小程序域名
- **限流**：API 限流防止暴力请求（用户级别限流）
- **SQL 注入防护**：使用参数化查询和 ORM
- **XSS 防护**：输入验证，输出编码
- **CSRF 防护**：检查微信小程序请求完整性
- **密钥管理**：敏感信息（appid、appsecret）存储在环境变量
- **请求签名**：可选的请求签名验证

### 2.7 缓存策略

#### Redis 缓存设计
```typescript
// 热点数据缓存
- user:{userId}          // 用户基本信息，TTL 1小时
- dish:{dishId}          // 菜肴信息，TTL 2小时
- dish:list:{page}       // 菜肴列表，TTL 30分钟
- favorites:{userId}     // 用户收藏，TTL 1小时
- comments:{dishId}      // 菜肴评论，TTL 30分钟

// 计数器缓存
- dish:{dishId}:views    // 浏览数，TTL 无限，定期同步到数据库
- dish:{dishId}:likes    // 点赞数
- user:{userId}:follows  // 粉丝数
```

#### 缓存更新策略
- **主动更新**：修改数据时删除相关缓存
- **被动更新**：缓存过期后重新加载
- **预热**：应用启动时预加载热点数据

### 2.8 日志与监控

#### 日志记录
```typescript
// Winston 日志级别
- error   : 错误日志（用户操作错误、系统错误）
- warn    : 警告日志（潜在问题、不规范操作）
- info    : 信息日志（关键操作：登录、删除、分享）
- debug   : 调试日志（开发环境的详细信息）

// 日志格式
{
  timestamp: "2024-03-13T10:00:00Z",
  level: "info",
  userId: "uuid",
  action: "dish.create",
  details: {...},
  ip: "192.168.1.1",
  userAgent: "..."
}
```

#### 监控指标（Prometheus）
```
- 请求延迟：按接口统计 P50, P95, P99
- 错误率：按接口统计 5xx, 4xx 错误
- 数据库性能：查询延迟、连接池状态
- 缓存命中率：Redis 命中率
- QPS：每秒请求数
```

### 2.9 部署架构

#### 生产环境架构
```
┌─────────────────────────────────────┐
│     CDN / 静态资源加速               │
└────────────────────┬────────────────┘
                     │
┌────────────────────┼────────────────┐
│           Load Balancer             │
│      (Nginx / AWS ELB)              │
└────────────────────┬────────────────┘
                     │
        ┌────────────┼────────────────┐
        │            │                │
    ┌───▼──┐    ┌───▼──┐         ┌───▼──┐
    │ API  │    │ API  │  ...    │ API  │
    │ Pod1 │    │ Pod2 │         │ PodN │
    │(Node)│    │(Node)│         │(Node)│
    └───┬──┘    └───┬──┘         └───┬──┘
        │           │                │
    ┌───┴───────────┼────────────────┴──┐
    │               │                    │
┌───▼────┐  ┌──────▼──────┐  ┌──────────▼────┐
│PostgreSQL│ │    Redis    │  │   OSS/COS    │
│Primary+ │ │   Cluster   │  │(File Storage)│
│Replicas │ │             │  │              │
└─────────┘ └─────────────┘  └──────────────┘
```

---

## 3. 项目结构（前端部分）

```
top-chef-master/
├── src/
│   ├── app.tsx                      # 应用入口
│   ├── app.scss                     # 全局样式
│   ├── pages/                       # 页面
│   │   ├── home/                    # 首页
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── dish-detail/             # 菜肴详情
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── add-dish/                # 添加菜肴
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── edit-dish/               # 编辑菜肴
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── favorites/               # 收藏列表
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── category/                # 分类浏览
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   └── profile/                 # 个人中心
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── components/                  # 可复用组件
│   │   ├── dish-card/               # 菜肴卡片
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── ingredient-list/         # 食材列表组件
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── cooking-step/            # 烹饪步骤组件
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   ├── search-bar/              # 搜索条组件
│   │   │   ├── index.tsx
│   │   │   └── index.scss
│   │   └── header/                  # 页面头部
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── store/                       # Redux 状态管理
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── dishSlice.ts         # 菜肴数据 slice
│   │   │   └── uiSlice.ts           # UI 状态 slice
│   │   └── types.ts
│   ├── services/                    # 业务逻辑层
│   │   ├── dish-service.ts          # 菜肴相关服务
│   │   ├── storage-service.ts       # 存储服务
│   │   └── image-service.ts         # 图片处理服务
│   ├── types/                       # TypeScript 类型定义
│   │   ├── dish.ts
│   │   ├── ingredient.ts
│   │   └── common.ts
│   ├── utils/                       # 工具函数
│   │   ├── format.ts                # 格式化工具
│   │   ├── validate.ts              # 验证工具
│   │   ├── uuid.ts                  # UUID 生成
│   │   └── constants.ts             # 常量定义
│   └── styles/                      # 全局样式
│       ├── variables.scss           # 样式变量
│       └── mixins.scss              # 样式混合
├── config/
│   ├── index.ts                     # Taro 配置
│   └── dev.ts                       # 开发环境配置
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## 4. 数据存储设计

### 4.1 本地存储方案
采用微信小程序原生 Storage API，数据以 JSON 格式存储。

### 4.2 存储结构
```
存储键值对：

1. dishes:list
   [
     {
       id: "uuid-1",
       name: "宫保鸡丁",
       description: "...",
       difficulty: "medium",
       cookingTime: 30,
       servings: 2,
       image: "base64或本地路径",
       tags: ["快手菜", "家常菜"],
       ingredients: [...],
       steps: [...],
       isFavorite: true,
       createdAt: 1710230400000,
       updatedAt: 1710230400000
     },
     ...
   ]

2. favorites:ids
   ["uuid-1", "uuid-3", ...]

3. app:settings
   {
     theme: "light",
     language: "zh",
     ...
   }
```

### 4.3 存储操作
- **查询**：获取完整菜肴列表
- **创建**：添加新菜肴，生成唯一 UUID
- **更新**：修改菜肴信息
- **删除**：删除菜肴，同时从收藏列表移除

---

## 5. 核心模块设计

### 5.1 菜肴管理模块（Dish Service）
```typescript
// services/dish-service.ts

export interface DishService {
  // 查询
  getAllDishes(): Promise<Dish[]>;
  getDishById(id: string): Promise<Dish | null>;
  searchDishes(keyword: string): Promise<Dish[]>;
  getDishesByTag(tag: string): Promise<Dish[]>;
  getDishesByDifficulty(difficulty: string): Promise<Dish[]>;

  // 创建
  createDish(dish: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dish>;

  // 更新
  updateDish(id: string, dish: Partial<Dish>): Promise<Dish>;

  // 删除
  deleteDish(id: string): Promise<void>;

  // 收藏操作
  toggleFavorite(id: string): Promise<void>;
  getFavoriteDishes(): Promise<Dish[]>;
}
```

### 5.2 存储服务（Storage Service）
```typescript
// services/storage-service.ts

export interface StorageService {
  // 基础操作
  setItem(key: string, data: any): Promise<void>;
  getItem(key: string): Promise<any>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  // 特殊操作
  getDishesList(): Promise<Dish[]>;
  setDishesList(dishes: Dish[]): Promise<void>;
  getFavoriteIds(): Promise<string[]>;
  setFavoriteIds(ids: string[]): Promise<void>;
}
```

### 5.3 图片处理服务（Image Service）
```typescript
// services/image-service.ts

export interface ImageService {
  // 图片选择和上传
  selectImage(): Promise<string>;
  compressImage(imagePath: string): Promise<string>;
  uploadImage(imagePath: string): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}
```

---

## 6. 状态管理设计（Redux）

### 6.1 Store 结构
```typescript
// store/types.ts
export interface RootState {
  dish: DishState;
  ui: UIState;
}

export interface DishState {
  dishes: Dish[];
  favoriteIds: string[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  searchText: string;
  selectedFilter: FilterOptions;
  currentTab: string;
  loading: boolean;
}
```

### 6.2 Redux Slices
```typescript
// store/slices/dishSlice.ts
- fetchDishes()        // 从存储加载菜肴
- addDish()           // 添加菜肴
- updateDish()        // 更新菜肴
- deleteDish()        // 删除菜肴
- toggleFavorite()    // 切换收藏状态

// store/slices/uiSlice.ts
- setSearchText()     // 设置搜索文本
- setFilter()         // 设置筛选条件
- setLoading()        // 设置加载状态
```

---

## 7. 关键功能实现

### 7.1 搜索功能
- **实现方式**：客户端搜索（基于本地数据）
- **搜索范围**：菜名 + 标签 + 描述
- **搜索算法**：模糊匹配
- **性能优化**：防抖处理（debounce）

### 7.2 图片处理
- **上传方式**：选择本地图库或拍照
- **存储方式**：转换为 Base64 存储在 localStorage
- **优化策略**：图片压缩（宽度不超过 750px）
- **大小限制**：单个图片不超过 500KB

### 7.3 收藏功能
- **实现方式**：维护收藏 ID 列表
- **存储**：单独的 `favorites:ids` 键值对
- **操作**：快速切换，实时保存

### 7.4 排序和筛选
```typescript
// 排序选项
- 最新添加
- 按难度（简单 → 困难）
- 按烹饪时间

// 筛选选项
- 按标签
- 按难度
- 按收藏状态
```

---

## 8. 页面设计细节

### 8.1 首页（Home）
- 顶部：搜索框 + 筛选按钮
- 中间：菜肴卡片列表（虚拟滚动优化）
- 底部：标签栏导航

### 8.2 菜肴详情（DishDetail）
- 头部：菜肴图片 + 收藏按钮
- 基本信息：菜名、难度、时间、份量
- 食材列表：可复制
- 烹饪步骤：带图片和序号
- 底部：编辑和删除按钮

### 8.3 添加/编辑菜肴（AddDish/EditDish）
- 表单字段：菜名、描述、难度、时间、份量
- 图片上传：选择或拍照
- 食材编辑：动态添加/删除
- 步骤编辑：动态添加/删除
- 标签选择：多选下拉菜单
- 提交按钮：保存草稿 + 提交

---

## 9. 性能优化方案

### 9.1 渲染优化
- 使用 React.memo 包装不必要重渲染的组件
- 使用 useMemo 和 useCallback 优化函数引用
- 列表使用虚拟滚动（Virtual Scrolling）
- 图片使用懒加载

### 9.2 存储优化
- 使用分页加载（如果数据量很大）
- 缓存热点数据
- 定期清理过期缓存

### 9.3 网络优化
- 不涉及网络，所有操作本地化
- 支持离线使用

---

## 10. 错误处理和验证

### 10.1 数据验证
```typescript
// utils/validate.ts
- validateDishName(name): boolean
- validateDifficulty(difficulty): boolean
- validateCookingTime(time): boolean
- validateIngredients(ingredients): boolean
- validateSteps(steps): boolean
```

### 10.2 错误处理
- Try-catch 捕获异常
- 用户友好的错误提示
- 操作确认对话框（删除操作）

---

## 11. 开发和部署

### 11.1 开发流程
```bash
# 安装依赖
npm install

# 开发环境
npm run dev

# 编译为微信小程序
npm run build:weapp

# 预览小程序
# 使用微信开发者工具打开 dist 目录
```

### 11.2 代码规范
- TypeScript 严格模式
- ESLint + Prettier 自动格式化
- Commit 规范：Conventional Commits

### 11.3 测试策略
- 单元测试：Jest（关键业务逻辑）
- 组件测试：React Testing Library
- E2E 测试：可选（基于小程序自动化框架）

---

## 12. 微信小程序配置

### 12.1 app.json 配置
```json
{
  "pages": [
    "pages/home/index",
    "pages/dish-detail/index",
    "pages/add-dish/index",
    "pages/edit-dish/index",
    "pages/favorites/index",
    "pages/category/index",
    "pages/profile/index"
  ],
  "window": {
    "navigationBarTitleText": "顶级主厨",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#ff6b35",
    "backgroundColor": "#fafafa",
    "list": [
      {
        "pagePath": "pages/home/index",
        "text": "菜肴"
      },
      {
        "pagePath": "pages/favorites/index",
        "text": "收藏"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的"
      }
    ]
  }
}
```

---

## 13. 后续可扩展性设计

### 13.1 云端同步（Phase 2）
- 集成云存储（云数据库）
- 用户登录认证
- 多设备数据同步

### 13.2 社交功能（Phase 2）
- 分享菜谱给好友
- 菜谱评分和评论
- 菜谱推荐系统

### 13.3 增强功能（Phase 3）
- 营养信息计算
- AI 推荐菜肴
- 视频教程集成

### 13.4 菜单和购物清单高级功能（Phase 2-3）
- **AI 菜单生成**
  - 基于用户偏好和季节推荐菜单
  - 根据预算自动生成菜单
  - 根据食材库存智能推荐菜单

- **购物清单智能优化**
  - 与本地超市价格展示对接
  - 购物路线优化（按超市分布）
  - 自动去重和价格比较

- **菜单分享和协作**
  - 多人协作编辑菜单
  - 菜单版本管理和历史记录
  - 家庭用户共享菜单

- **菜单模板库**
  - 官方菜单模板库
  - 社区用户推荐菜单
  - 按季节和场景的菜单分类

- **积分和奖励**
  - 菜单分享积分激励
  - 购物清单完成度成就
  - 积分兑换优惠券

---

## 14. 技术债务和风险

### 14.1 风险识别
- localStorage 容量限制（通常 10MB）
- Base64 图片存储效率低
- 微信小程序版本差异

### 14.2 缓解方案
- 监控存储使用量
- 提供图片清理功能
- 测试不同微信版本
- 使用条件编译处理版本差异

---

## 15. 文档和注释

### 15.1 代码注释规范
- 函数注释：JSDoc 格式
- 复杂逻辑：行内注释
- 组件注释：说明 props 和功能

### 15.2 维护文档
- API 文档
- 组件库文档
- 部署指南
- 故障排查指南

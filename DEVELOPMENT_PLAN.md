# 开发计划（TopChef）— 云端同步优先

> 本文用于团队持续跟踪开发进度。勾选框请在任务完成后打勾（`[x]`）。
>
> 约定：后端 API 统一 `/api/v1`；JSON 响应统一为 `{ statusCode, msg, data, meta? }`（成功）与 `{ statusCode, msg, data: null, error }`（失败）；分页信息在 `meta.pagination`；并发更新使用 `ifMatchVersion` + `409 VERSION_CONFLICT`（`error.details` 携带 `serverSnapshot` 等）。

## 当前状态概览

### 已开发完成（已落库）

#### Backend
- [x] **DB migration 按 `TECHNICAL_DESIGN.md` 重做**（UUID、`visibility/comments_enabled/version/deleted_at`、tags GIN 索引等）
- [x] **统一错误响应与 requestId**
- [x] **鉴权**：`POST /api/v1/auth/login`（微信 `jscode2session` → openid；需配置 `WECHAT_APPID` / `WECHAT_APPSECRET`）
- [x] **用户**：`GET /api/v1/users/profile`
- [x] **菜谱**
  - [x] `GET /api/v1/dishes`（分页 + 基础过滤）
  - [x] `GET /api/v1/dishes/:id`（可见性过滤 + 防枚举）
  - [x] `POST/PUT/DELETE /api/v1/dishes`（软删；PUT 支持 `ifMatchVersion` 冲突回包含 `serverSnapshot`）
- [x] **点赞**：`POST/DELETE /api/v1/dishes/:id/like`（含 `409 DUPLICATE_LIKE`）
- [x] **评论模块（可用）**
  - [x] `GET /api/v1/dishes/:id/comments`
  - [x] `POST /api/v1/dishes/:id/comments`（upsert：一人一菜一条）
  - [x] `PUT/DELETE /api/v1/comments/:id`
- [x] **可见性权限过滤**：列表/详情按 `public/private/followers + follows` 过滤（未登录仅 public）

#### Frontend
- [x] **请求层 baseURL 注入**：`API_BASE_URL`（dev/prod）+ `request.ts` 使用注入常量
- [x] **service 层对齐 `/api/v1` 且解包统一响应**
- [x] **UUID 适配**：菜谱 id 从 number 改为 string（列表/详情基础可用）
- [x] **评论/点赞**：service 与详情页 UI 已接入

### 进行中（M1 收尾 + 生产准备）

- [x] **`.env.example`**：`backend/.env.example`（DB / JWT / 微信 / CORS / 限流 / `TRUST_PROXY`）
- [x] **CORS 白名单**：`CORS_ORIGINS` 逗号分隔；开发未配时使用内置 localhost 默认；无 `Origin` 的请求（小程序等）放行
- [x] **基础限流**：`POST /auth/login` 单独限流；`/api/v1` 下写方法（POST/PUT/PATCH/DELETE）统一限流（登录路径跳过写限流，避免重复计数）
- [x] **首页列表**：分页 + 搜索；`GET /dishes` 仍支持 `difficulty`/`tag`/`sort` 等 query（发现首页小程序端**不展示**外露筛选条，默认 `sort=latest`）；列表为**虚拟滚动**双列（见 `TECHNICAL_DESIGN.md` §1.1.2）。
- [x] **列表 `sort` 枚举**：`latest`（默认）/ `cooking_time_asc` / `cooking_time_desc` / `popular`（点赞数）；未知值回退 `latest`

### 待开发（后续迭代）

- [ ] **菜谱封面 / 图片存储演进**：当前实现将上传文件落在**本机磁盘**——封面在 `backend/uploads/dishes/`，步骤等通用配图在 `backend/uploads/recipe-media/`（均经 `GET /uploads/...` 访问）。进程重启**不会**删文件；但在无持久卷的容器、多实例或换机部署时文件会丢失或不一致。**后续需优化为对象存储**（如阿里云 OSS、腾讯云 COS、S3），数据库只存可公开访问的 URL（可选 CDN）。
- [x] 收藏、关注与用户主页（M2 主体）
- [x] 分享统计闭环（微信分享入口、`POST /shares`、详情浏览/分享数展示）
- [x] **M3-A（主体）**：菜单与聚餐点菜（`menus` / `menu_items`，从菜谱加入、排序、乐观锁、复制；单人）
- [ ] **（可选演进）菜单整单保存**：在保留现有 `PUT /menus/:id` 与 `.../items/*` 的前提下，评审是否增加「一次提交菜单元信息 + 菜单项列表」的接口（草案见 `TECHNICAL_DESIGN.md` 菜单接口「可选演进」、产品口径见 `PRODUCT_DESIGN.md` §2.1.8）。**当前实现维持分接口，未承诺排期。**
- [ ] **菜单多人编辑 — 阶段一（弱协作）**：共享成员 + 仍主要依赖 `ifMatchVersion` 与 **409 异步合并**；可选 **菜单项认领**（租约）；**无 WebSocket**。产品口径 `PRODUCT_DESIGN.md` §2.1.8「多人协作」；技术草案 `TECHNICAL_DESIGN.md`「多人编辑（分两阶段）」。
- [ ] **菜单多人编辑 — 阶段二（实时协同）**：中心化操作流 + **WebSocket**（或等价通道）+ 广播/冲突策略；**在阶段一之后再评审排期**。弱协作阶段后端宜保持 **原子操作语义**，便于演进（见技术文档说明）。
- [x] **M3-B**：购物清单（从菜单生成、勾选/编辑、跨端同步；弱网离线缓存另迭代）
- [x] **M4**：饮食日记（`meal_log_entries` + `/api/v1/meal-logs`，按日查询与 CRUD；迁移见 `002_meal_log_entries.sql`）
- [ ] 内容安全/举报/封禁与可观测性

---

## 里程碑（Milestones）

### M1：MVP 主链路闭环（可测试、可演示）
验收标准（建议）：
- [x] 能登录（微信 `code` → 服务端换 openid；需小程序与后端微信配置一致）
- [x] 能创建/编辑/删除菜谱（含可见性、评论开关）
- [x] 列表/详情可见性正确（public/followers/private）
- [x] 详情页可点赞、可评论/评分（含“一人一菜一条评论”）
- [x] 409 冲突（`VERSION_CONFLICT`）前端有明确提示与处理入口（编辑/封面上传：弹窗 + 重新加载；未做与 `serverSnapshot` 的逐字段对比 UI）

### M2：社交与增长（关注/收藏/分享）
验收标准（建议）：
- [x] 关注/取消关注、粉丝/关注列表（API + 用户主页 + 列表页；见 `users/:id/*`）
- [x] 收藏/取消收藏、收藏列表（API + 详情收藏 +「我的收藏」页；详情带 `favorited_by_me`）
- [x] 分享入口 + 分享统计回传（share/view；详情 `useShare*` + `POST /shares`；浏览量由详情 `GET /dishes/:id` 侧异步累加）

### M3：菜单、聚餐点菜与购物清单（跨端同步，分阶段交付）
> 产品口径见 `PRODUCT_DESIGN.md` §2.1.8；技术口径见 `TECHNICAL_DESIGN.md` §2.4 / §13.4。  
> **菜单多人编辑**：先做 **弱协作**（Iteration 3.5），**实时协同** 排期在阶段一之后，见三端文档对应小节。

**M3-A（菜单闭环，单人聚餐点菜）** 验收标准（建议）：
- [x] `menus` CRUD（含 `version` + `ifMatchVersion`，冲突 409）
- [x] `menu_items` 增删改；**从菜谱加入**时校验 dish 可见性；**排序**（`PUT .../items/reorder` + `sequence`）
- [x] 菜单复制（`POST /menus/:id/copy` 或等价）
- [x] 小程序：菜单列表 / 编辑页、菜谱详情「加入菜单」入口（最小闭环；多菜单时跳转列表选目标）
- [ ] （可选）菜单编辑页改为「整单保存」交互：依赖「菜单整单保存」接口落地后再验收

**M3-A 协作（多人菜单，分两阶段；当前均未落地）**  
> 阶段一优先于阶段二；详见 `PRODUCT_DESIGN.md` §2.1.8、`TECHNICAL_DESIGN.md` 菜单「多人编辑」。

- [ ] **阶段一（弱协作）**：成员模型（邀请/踢人/角色）、协作者写权限校验；编辑冲突 **409** + 重拉；可选 **认领行** API 与 UI；小程序编辑页/详情入口（范围随评审收紧）
- [ ] **阶段二（实时协同）**：WebSocket 指令通道、断线重连与版本补偿；**依赖阶段一数据模型与操作语义稳定后再做**

**M3-B（购物清单）** 验收标准（建议）：
- [x] 从菜单生成购物清单（合并食材规则与产品一致：`POST /shopping-lists` 带 `menu_id` + `POST .../from-menu/:menuId`）
- [x] `shopping_list_items` 勾选/改量/增删；清单级乐观锁（`PUT /shopping-lists/:id` 带 `estimated_cost` + `ifMatchVersion`）
- [x] 小程序：购物清单列表/详情、个人中心与菜单编辑入口（最小闭环）
- [ ] 弱网/离线缓存与冲突合并 UI（与技术文档 §4 一致；另迭代）

### M4：饮食日记
验收标准（建议）：
- [x] 新建迁移：`meal_log_entries`（含 `meal_slot` ENUM、`version`、软删）— `backend/src/database/migrations/002_meal_log_entries.sql`
- [x] `GET /meal-logs?from&to` 分页；`POST/PUT/DELETE` 单条 CRUD；`PUT` 带 `ifMatchVersion`（冲突 409）
- [x] 写入时 `dish_id` 非空则校验可见性（与菜谱详情一致）；关联菜谱时 `title` 用菜谱名快照
- [x] 小程序：日视图 + 编辑页 + 选菜谱页（个人中心「饮食日记」入口）

### M5：内容安全与治理 + 可观测性
验收标准（建议）：
- [ ] 文本/图片内容安全校验接入
- [ ] 举报闭环 + 封禁策略落地
- [ ] requestId 串联日志 + 基础指标（错误率/延迟）

---

## 迭代计划（按优先级）

## Iteration 0：联调与环境可跑通（1-2 天）

### Backend
- [x] **微信登录**：`code -> openid`（`WECHAT_APPID` / `WECHAT_APPSECRET`）
- [x] **`.env.example`**：见 `backend/.env.example`
- [x] **CORS 白名单**：`CORS_ORIGINS`；生产环境须配置；反向代理后建议 `TRUST_PROXY=1` 以便限流按真实 IP
- [x] **基础限流（最小）**：见 `rate-limit.middleware.ts`（429 + `RATE_LIMIT`）
- [ ] （可选）**首页虚拟滚动压测数据**：在 `backend/` 配置数据库后执行 `npm run seed:bulk-dishes`（默认插入 150 条公开菜谱；可调 `BULK_DISH_COUNT`，上限 500）。会先删掉名称前缀为 `【虚拟滚动测试】` 的旧数据。库中需至少有一名用户（可先 `npm run seed`）。脚本见 `backend/src/database/seed-bulk-dishes.ts`。

### Frontend
- [x] **登录态策略**：token / userInfo 存 Storage；`request` 拦截器带 Bearer；profile 同步遇 401 清理并提示重新登录

---

## Iteration 1：MVP 主链路（3-7 天）

### Frontend
- [x] **菜谱创建/编辑页**
  - [x] 表单：name/description/difficulty/cooking_time/servings
  - [x] tags：与后端 `TEXT[]` 对齐（当前为逗号分隔输入）
  - [x] visibility：private/followers/public
  - [x] commentsEnabled：开关
  - [x] ingredients/steps：可增删改序
- [x] **详情页：点赞**
  - [x] 点赞/取消点赞按钮
  - [x] `like_count` 实时更新
- [x] **详情页：评论/评分**
  - [x] 评论列表分页（详情页：排序 + 加载更多）
  - [x] 写评论（upsert）/删除评论
  - [x] 展示评分（`rating_avg` / 评论星级）
- [x] **冲突处理 UI（409 VERSION_CONFLICT）**
  - [x] 弹窗提示 + 重新加载（未做与 `serverSnapshot` 的逐字段差异展示）

### Backend
- [x] **写评论校验**
  - [x] dish 可见性校验（不可见统一 404）
  - [x] `comments_enabled=false` 禁止评论（口径与实现一致）
- [x] **评分聚合维护**
  - [x] 评论 upsert 后更新 `dishes.rating_avg/rating_count`
- [ ] **列表排序/过滤完善**
  - [ ] `sort=latest` 等枚举（按文档）；当前固定按 `created_at DESC`

---

## Iteration 2：社交闭环（5-10 天）

### Backend
- [x] **收藏**
  - [x] `POST/DELETE /favorites/:dishId`、`GET /favorites`（分页）、`GET /favorites/:dishId/status`
- [x] **关注**
  - [x] `POST/DELETE /users/:id/follow`
  - [x] `GET /users/:id/followers`、`GET /users/:id/following`（分页）
  - [x] `GET /users/:id/public`（粉丝/关注/可见菜谱数、`is_following`）
  - [x] `GET /users/:id/dishes`（与列表相同可见性规则）
- [ ] **分享统计**
  - [ ] share 记录入库
  - [ ] stats 查询

### Frontend
- [x] 收藏按钮 + 收藏列表页
- [x] 用户主页 + 关注按钮 + 粉丝/关注列表页
- [ ] 分享入口 + 分享回传

---

## Iteration 3：M3-A 菜单与聚餐点菜（5-10 天）

### Backend
- [x] `menus` CRUD + 软删 + `version`/`ifMatchVersion`（与现有 `dishes` 模式对齐）
- [x] `menu_items` CRUD；`UNIQUE(menu_id, dish_id)` 行为与产品一致
- [x] 菜单项排序接口（`PUT .../items/reorder` 全量 `itemIds`）
- [x] `POST /menus/:id/copy`（`publish`/分享仍属后续）
- [ ] （可选）整单保存：扩展 `PUT /menus/:id` 或新增 `.../snapshot` 等（见 `TECHNICAL_DESIGN.md`）

### Frontend
- [x] 分包 `package-menus`：菜单列表、菜单编辑（含上移/下移、份量、复制/删菜单）
- [x] 菜谱详情「加入菜单」：无菜单时一键新建；有菜单时跳转列表带 `dishId` 点选加入
- [ ] （可选）`PUT /menus/:id` 扩展或新增整单保存路径 + 前端改为单次提交（见技术文档草案）

---

## Iteration 3.5：菜单多人编辑 — 阶段一弱协作（估 5–15 天，随成员模型与认领范围浮动）

> **策略**：先做 **异步合并 + 可选认领行**；**不做** 实时 WebSocket。阶段二（实时协同）单列待办，见上文「待开发」与技术文档。

### Backend（草案，落地时以 `TECHNICAL_DESIGN.md` 为准）
- [ ] 成员与权限：如 `menu_members`（`menu_id`、`user_id`、`role`）或等价；`GET/POST/DELETE .../members`；写 `menus` / `menu_items` 时校验角色
- [ ] 沿用 `menus.version` + `ifMatchVersion`；协作者冲突 **409 `VERSION_CONFLICT`** + `serverSnapshot`
- [ ] （可选）`menu_items` 认领字段 + `lock` / `unlock` 接口与租约过期策略

### Frontend
- [ ] 邀请协作者 / 成员列表（与产品稿一致的最小闭环）
- [ ] 编辑页：他人正在编辑提示、409 引导重拉；若认领落地则展示锁状态

### 阶段二（实时协同）
- [ ] 不纳入本迭代；排期见「待开发 — 菜单多人编辑 — 阶段二」

---

## Iteration 4：M3-B 购物清单（5-10 天）

### Backend
- [x] `shopping_lists` + `shopping_list_items` 写路径与清单级 `version`（`GET/POST /shopping-lists`、`GET/PUT/DELETE /shopping-lists/:id`）
- [x] `POST .../from-menu/:menuId` 生成逻辑（食材合并）
- [x] 条目勾选/数量/备注的更新接口（`POST/PUT/DELETE .../items`）

### Frontend
- [x] 购物清单页（分类、勾选、编辑）
- [x] 从菜单「生成购物清单」入口

---

## Iteration 5：M4 饮食日记（5-10 天）

### Backend
- [x] migration：`meal_log_entries` + 索引（`user_id, eaten_date`，`WHERE deleted_at IS NULL`）
- [x] `/api/v1/meal-logs` 区间查询与单资源 CRUD；关联 `dish_id` 时复用可见性校验
- [x] 软删与列表过滤

### Frontend
- [x] 饮食日记日视图、记录编辑页、选菜谱页（分包 `package-meal`）
- [x] 409 冲突提示（toast + 重拉，与现有最小处理一致）

---

## Iteration 6：内容安全与可观测（持续）

### Backend
- [ ] 文本/图片内容安全能力接入
- [ ] 举报接口与后台处理（MVP 可先记录 + 隐藏）
- [ ] 日志字段标准化（userId/action/requestId）
- [ ] 指标：延迟、错误率、DB 慢查询、缓存命中率（如引入 Redis）

### Frontend
- [ ] 举报入口与状态提示
- [ ] 全局错误兜底页与重试

---

## 下一阶段迭代（优先级：A → C → B → D）

> **来源**：与产品/技术文档对齐的落地顺序约定。**A**＝M1 收尾；**C**＝基础设施（存储/弱网等）；**B**＝M5 治理与可观测；**D**＝菜单多人协作等大功能。  
> **测试约定**：后端以 **Jest（单元 + 集成）** 为主，对关键模块设用例或覆盖率门槛；**契约**为关键 API 的请求/响应与统一包 `{ statusCode, msg, data, meta? }` 及分页 `meta.pagination` 一致；小程序端以 **手工用例清单** 验收主路径。**CI** 建议在仓库中增加 `lint` + `test` 流水线（与本地一致），本小节「测试对应」列的是**应覆盖的验证类型**，落地时把用例落到 `backend/tests/` 与清单文档即可。

### Wave A：M1 收尾（首页列表 · 排序 · 可选评论分页）

#### 范围与验收标准

**Backend**
- [x] **`GET /api/v1/dishes` 的 `sort` 查询参数**：`latest` | `cooking_time_asc` | `cooking_time_desc` | `popular`；未知值回退 `latest`（与文档示例 `sort=latest` 一致，并已扩展烹饪时间/点赞序）。
- [x] 列表过滤：`difficulty`、`tag` 与现有 schema 一致；`page`/`limit` 含边界钳制（limit 最大 100）。
- [x] 分页：`meta.pagination` 与列表一致；评论列表 `limit` 最大 50，支持 `sort=latest|popular`。

**Frontend（微信小程序）**
- [x] **首页/菜谱列表**：**虚拟滚动**双列 + 触底分页；搜索栏；加载中与「没有更多了」提示；**不展示**难度/标签/排序条（降低首屏干扰，后端 query 能力保留）。
- [x] **筛选/排序（服务端能力）**：`difficulty` / `tag` / `sort` 仍可通过 API 使用；其它页面或后续入口可接。
- [x] **评论列表分页**（可选）：详情页排序（最新 / 高分优先）+「加载更多」；每页 15 条。

#### 测试对应关系

| 验证类型 | 内容 |
|----------|------|
| **后端 Jest** | `DishService` / list repository：`sort` 各枚举的 SQL 或排序字段；`difficulty`/`tag` 组合过滤；分页 total、边界。 |
| **契约** | `GET /api/v1/dishes`：query 组合与成功响应的 `data` 列表结构、`meta.pagination`（及失败时 `statusCode`/`error`）。 |
| **手工清单** | 未登录仅 public；登录后 followers/public/private 组合；搜索清空与提交后列表自顶重拉；虚拟列表快速滑动无错位（行高约 392rpx）；末页与网络失败重试。 |

---

### Wave C：基础设施（图片存储 · 弱网体验，可分 sprint）

#### 范围与验收标准

**存储（优先于多实例/容器化部署一致性）**
- [ ] 封面与步骤等媒体 **从本机磁盘迁移到对象存储**（或抽象 `FileStorage` 接口，实现可切换 OSS/COS/S3），DB 存可访问 URL；`GET /uploads/...` 行为与迁移策略在 `TECHNICAL_DESIGN.md` / 部署说明中可查。
- [ ] 已有上传数据迁移或兼容策略明确（开发/预发可清空重建的说明亦可）。

**弱网 / 离线（与产品「缓存与弱网」一致，可分二期）**
- [ ] 关键列表/详情 **缓存读后展示** + 失败降级（与技术文档非功能需求对齐即可，不承诺全离线编辑）。
- [ ] （可选）写操作队列与 409 冲突提示与现有乐观锁策略一致，不破坏 `ifMatchVersion` 语义。

#### 测试对应关系

| 验证类型 | 内容 |
|----------|------|
| **后端 Jest** | 上传服务/存储适配单元测试；签名 URL 或回调（若采用）的边界；迁移脚本或启动检查（若有）的冒烟。 |
| **契约** | 与上传、资源 URL 相关的接口响应字段（如 `cover_image_url`）仍为客户端可消费的完整 URL。 |
| **手工清单** | 真机弱网下列表/详情是否可用缓存；新上传图片在多端/多环境 URL 可访问；大文件与失败重试。 |

---

### Wave B：M5 内容安全与治理 + 可观测性

#### 范围与验收标准

**Backend**
- [ ] 文本/图片 **内容安全**接入（策略：拦截、替换或人工复核口径与产品一致）。
- [ ] **举报**接口与最小闭环（记录、状态、必要时隐藏或下架 — 按 `PRODUCT_DESIGN.md` MVP 口径）。
- [ ] **日志**：requestId 串联；关键字段含 `userId` / action（与 Iteration 6 一致）。
- [ ] **指标**（最小集）：错误率、延迟或慢查询记录（Prometheus 可选，先文件/日志指标亦可）。

**Frontend**
- [ ] 举报入口与用户侧状态提示；**全局错误兜底**与重试（与 Iteration 6 一致）。

#### 测试对应关系

| 验证类型 | 内容 |
|----------|------|
| **后端 Jest** | 举报 CRUD/状态机；内容安全 hook 的 mock 与拒绝路径；日志中间件带 requestId。 |
| **契约** | 举报相关 API 的统一响应格式；与鉴权、404/403 行为一致。 |
| **手工清单** | 触发敏感词/图片策略；举报提交与反馈文案；错误页与重试是否覆盖主路径。 |

---

### Wave D：菜单多人编辑及其它大功能（在 A/C/B 之后评审排期）

#### 范围与验收标准

> 以 `PRODUCT_DESIGN.md` §2.1.8「多人协作」与 `TECHNICAL_DESIGN.md` 菜单「多人编辑」为准；**阶段一弱协作**优先于 WebSocket 实时协同。

**Backend（阶段一示例）**
- [ ] 成员模型（如 `menu_members`）、邀请/踢人/角色；写菜单与菜单项时 **校验写权限**。
- [ ] 沿用 `version` + `ifMatchVersion`，冲突 **409** + `serverSnapshot`。
- [ ] （可选）菜单项认领与租约释放。

**Frontend**
- [ ] 成员列表与邀请流程（最小闭环）；编辑页 409 引导重拉；（若认领落地）锁状态展示。

**阶段二（实时协同）**
- [ ] 不在本 wave 必选内；阶段一稳定后再单列里程碑。

#### 测试对应关系

| 验证类型 | 内容 |
|----------|------|
| **后端 Jest** | 权限矩阵（owner/editor/viewer）；无权限写操作 403/404；409 冲突体；多用户顺序写版本递增。 |
| **契约** | 成员与菜单写接口的请求/响应与错误码与文档一致。 |
| **手工清单** | 双账号协作文档；同时编辑同项冲突提示；认领过期后他人可编辑（若实现认领）。 |

---

### Wave UI（与 Wave A 可并行，以「全局视觉 + 首页→详情→编辑」为主）

> 目标平台 **仅微信小程序**；无设计稿时先定风格参考再改组件与主题 token，避免与 Wave A 接口改动打架时以 **接口与验收标准** 为准。

#### 范围与验收标准（建议）

- [ ] **设计 token**：颜色、字号、圆角、间距在 SCSS 变量或主题层统一，主要页面引用同一套。
- [ ] **关键路径**：首页列表卡片、菜谱详情、创建/编辑页布局与动效（骨架屏、过渡、按钮反馈）一致且可访问性合理。
- [x] **发现首页信息架构**：外露筛选条已收敛为**仅搜索**；长列表以**虚拟滚动**保证性能（与 `TECHNICAL_DESIGN.md` §1.1.2 一致）。

#### 测试对应关系

| 验证类型 | 内容 |
|----------|------|
| **后端 Jest** | 一般不增（除非 UI 带动新接口）。 |
| **契约** | 无新增接口时可不扩展；若新增埋点/配置接口再补。 |
| **手工清单** | 真机不同机型截图对比；关键路径录屏；动效是否卡顿、是否误触。 |

---

## 风险与注意事项（持续更新）
- **DB 迁移风险**：当前采用“按文档重做 schema”路线，旧库需要重建或写迁移脚本。
- **可见性与防枚举**：对不可见资源推荐统一返回 404。
- **离线冲突**：写请求带 `ifMatchVersion`；409 必带 `serverSnapshot` 供前端处理。
- **小程序环境**：生产环境 `API_BASE_URL` 必须替换成真实域名并配置合法域名白名单。
- **CORS**：小程序请求通常无 `Origin`，与浏览器 H5 不同；若部署 Taro H5，须把 H5 的 Origin 加入 `CORS_ORIGINS`。
- **限流与代理**：经 nginx 等转发时设置 `TRUST_PROXY=1`，否则单 IP 限流可能把大量用户算成同一地址。
- **菜单与日记边界**：菜单项引用 `dish_id`；日记可引用 `dish_id` 或自由文本，**禁止**用菜单表存「已吃记录」。
- **菜单多人编辑**：**阶段一**为弱协作（HTTP + 乐观锁，可选认领）；**阶段二**为实时协同（WebSocket 等），须在阶段一之后评审；后端宜尽早按 **原子操作** 建模菜单项写入，便于阶段二复用指令集（见 `TECHNICAL_DESIGN.md`）。
- **Schema 增量**：`001_init_schema.sql` 已含 `menus`/`shopping_lists`；`meal_log_entries` 需**新迁移**落地，避免与线上已执行迁移冲突；协作成员表、认领字段等另起迁移，勿与未评审草案混入主分支。


# 开发计划（TopChef）— 云端同步优先

> 本文用于团队持续跟踪开发进度。勾选框请在任务完成后打勾（`[x]`）。
>
> 约定：后端 API 统一 `/api/v1`；响应结构 `{ data, meta }` / `{ error }`；并发更新使用 `ifMatchVersion` + `409 VERSION_CONFLICT`（携带 `serverSnapshot/serverVersion`）。

## 当前状态概览

### 已开发完成（已落库）

#### Backend
- [x] **DB migration 按 `TECHNICAL_DESIGN.md` 重做**（UUID、`visibility/comments_enabled/version/deleted_at`、tags GIN 索引等）
- [x] **统一错误响应与 requestId**
- [x] **鉴权（开发版）**：`POST /api/v1/auth/login`（当前 mock openid，便于联调）
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
- [x] **评论/点赞 service 已补齐**（页面 UI 尚未接入）

### 进行中（本周目标）

- [x] **前端详情页接入评论与点赞 UI**
- [x] **前端编辑/创建菜谱页（含 visibility/commentsEnabled/tags/ingredients/steps）**
- [x] **后端：评论开关与可见性校验更严格（写操作）**
- [x] **后端：评分聚合字段维护（`rating_avg/rating_count`）**

### 待开发（后续迭代）

- [ ] 收藏、关注、分享统计闭环
- [ ] **M3-A**：菜单与聚餐点菜（`menus` / `menu_items`，从菜谱加入、排序、乐观锁；单人）
- [ ] **M3-B**：购物清单（从菜单生成、勾选/编辑、跨端同步）
- [ ] **M4**：饮食日记（`meal_log_entries` + `/api/v1/meal-logs`，按日查询与 CRUD）
- [ ] 内容安全/举报/封禁与可观测性

---

## 里程碑（Milestones）

### M1：MVP 主链路闭环（可测试、可演示）
验收标准（建议）：
- [ ] 能登录（开发版/真实微信二选一）
- [ ] 能创建/编辑/删除菜谱（含可见性、评论开关）
- [ ] 列表/详情可见性正确（public/followers/private）
- [ ] 详情页可点赞、可评论/评分（含“一人一菜一条评论”）
- [ ] 409 冲突（`VERSION_CONFLICT`）前端有明确提示与处理入口

### M2：社交与增长（关注/收藏/分享）
验收标准（建议）：
- [ ] 关注/取消关注、粉丝/关注列表
- [ ] 收藏/取消收藏、收藏列表
- [ ] 分享入口 + 分享统计回传（share/view）

### M3：菜单、聚餐点菜与购物清单（跨端同步，分阶段交付）
> 产品口径见 `PRODUCT_DESIGN.md` §2.1.8；技术口径见 `TECHNICAL_DESIGN.md` §2.4 / §13.4。

**M3-A（菜单闭环，单人聚餐点菜）** 验收标准（建议）：
- [ ] `menus` CRUD（含 `version` + `ifMatchVersion`，冲突 409）
- [ ] `menu_items` 增删改；**从菜谱加入**时校验 dish 可见性；**排序**（`sequence` 或 `reorder` 接口二选一落地）
- [ ] 菜单复制（`POST /menus/:id/copy` 或等价）
- [ ] 小程序：菜单列表 / 编辑页、菜谱详情「加入菜单」入口（可先做最小闭环）

**M3-B（购物清单）** 验收标准（建议）：
- [ ] 从菜单生成购物清单（合并食材规则与产品一致）
- [ ] `shopping_list_items` 勾选/改量/增删；清单级乐观锁
- [ ] 小程序：购物清单页、弱网缓存策略（与技术文档 §4 一致）

### M4：饮食日记
验收标准（建议）：
- [ ] 新建迁移：`meal_log_entries`（含 `meal_slot`、`version`、软删）
- [ ] `GET /meal-logs?from&to` 分页；`POST/PUT/DELETE` 单条 CRUD；`PUT` 带 `ifMatchVersion`
- [ ] 写入时 `dish_id` 非空则校验 viewer 对菜可见；`title` 快照策略与 `PRODUCT_DESIGN.md` §3 一致
- [ ] 小程序：日视图 + 编辑页（菜谱选择器或自由文本）

### M5：内容安全与治理 + 可观测性
验收标准（建议）：
- [ ] 文本/图片内容安全校验接入
- [ ] 举报闭环 + 封禁策略落地
- [ ] requestId 串联日志 + 基础指标（错误率/延迟）

---

## 迭代计划（按优先级）

## Iteration 0：联调与环境可跑通（1-2 天）

### Backend
- [ ] **替换 mock openid**：接入真实微信 `code -> openid`（或至少抽象接口，支持 dev/prod 切换）
- [ ] **`.env.example`**：补齐 DB/JWT/WeChat 配置示例
- [ ] **CORS 白名单**：按小程序域名配置
- [ ] **基础限流（最小）**：登录/写接口限流

### Frontend
- [ ] **登录态策略**：token 存储、401 处理（刷新/重新登录跳转）

---

## Iteration 1：MVP 主链路（3-7 天）

### Frontend
- [ ] **菜谱创建/编辑页**
  - [ ] 表单：name/description/difficulty/cooking_time/servings
  - [ ] tags：多选或自由输入（与后端 `TEXT[]` 对齐）
  - [ ] visibility：private/followers/public
  - [ ] commentsEnabled：开关
  - [ ] ingredients/steps：可增删改序
- [ ] **详情页：点赞**
  - [ ] 点赞/取消点赞按钮
  - [ ] `like_count` 实时更新
- [ ] **详情页：评论/评分**
  - [ ] 评论列表分页
  - [ ] 写评论（upsert）/删除评论
  - [ ] 展示评分（若后端聚合未做，先用评论数据计算或隐藏）
- [ ] **冲突处理 UI（409 VERSION_CONFLICT）**
  - [ ] 弹窗：展示 `serverSnapshot` 与本地修改差异（MVP 可先提示并提供“覆盖/重新编辑”）

### Backend
- [ ] **写评论校验**
  - [ ] dish 可见性校验（不可见统一 404）
  - [ ] `comments_enabled=false` 禁止评论（403 或 404 口径统一）
- [ ] **评分聚合维护**
  - [ ] 评论 upsert 后更新 `dishes.rating_avg/rating_count`
- [ ] **列表排序/过滤完善**
  - [ ] `sort=latest` 等枚举（按文档）

---

## Iteration 2：社交闭环（5-10 天）

### Backend
- [ ] **收藏**
  - [ ] `POST/DELETE /favorites/:dishId`（或等价）
  - [ ] `GET /favorites`
- [ ] **关注**
  - [ ] follow/unfollow
  - [ ] followers/following 列表
- [ ] **分享统计**
  - [ ] share 记录入库
  - [ ] stats 查询

### Frontend
- [ ] 收藏按钮 + 收藏列表页
- [ ] 用户主页 + 关注按钮 + 列表
- [ ] 分享入口 + 分享回传

---

## Iteration 3：M3-A 菜单与聚餐点菜（5-10 天）

### Backend
- [ ] `menus` CRUD + 软删 + `version`/`ifMatchVersion`（与现有 `dishes` 模式对齐）
- [ ] `menu_items` CRUD；`UNIQUE(menu_id, dish_id)` 行为与产品一致
- [ ] 菜单项排序接口（`PUT .../reorder` 或逐项 `sequence`）
- [ ] `POST /menus/:id/copy`（及可选 `publish`/分享占位，**不做**多人协作）

### Frontend
- [ ] 菜单列表页、菜单编辑页
- [ ] 菜谱详情「加入菜单」（选择目标菜单或默认新建）

---

## Iteration 4：M3-B 购物清单（5-10 天）

### Backend
- [ ] `shopping_lists` + `shopping_list_items` 写路径与清单级 `version`
- [ ] `POST .../from-menu/:menuId` 生成逻辑（食材合并）
- [ ] 条目勾选/数量/备注的更新接口

### Frontend
- [ ] 购物清单页（分类、勾选、编辑）
- [ ] 从菜单「生成购物清单」入口

---

## Iteration 5：M4 饮食日记（5-10 天）

### Backend
- [ ] migration：`meal_log_entries` + 索引（`user_id, eaten_date`）
- [ ] `/api/v1/meal-logs` 区间查询与单资源 CRUD；关联 `dish_id` 时复用可见性校验
- [ ] 软删与列表过滤

### Frontend
- [ ] 饮食日记日视图、记录编辑页
- [ ] 409 冲突提示（与菜谱编辑一致的最小处理）

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

## 风险与注意事项（持续更新）
- **DB 迁移风险**：当前采用“按文档重做 schema”路线，旧库需要重建或写迁移脚本。
- **可见性与防枚举**：对不可见资源推荐统一返回 404。
- **离线冲突**：写请求带 `ifMatchVersion`；409 必带 `serverSnapshot` 供前端处理。
- **小程序环境**：生产环境 `API_BASE_URL` 必须替换成真实域名并配置合法域名白名单。
- **菜单与日记边界**：菜单项引用 `dish_id`；日记可引用 `dish_id` 或自由文本，**禁止**用菜单表存「已吃记录」。
- **Schema 增量**：`001_init_schema.sql` 已含 `menus`/`shopping_lists`；`meal_log_entries` 需**新迁移**落地，避免与线上已执行迁移冲突。


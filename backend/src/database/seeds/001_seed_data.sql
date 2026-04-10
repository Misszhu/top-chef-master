-- Seed data (TECHNICAL_DESIGN.md compatible)
-- 注意：你需要先把数据库迁移到新的 schema（UUID + visibility/comments_enabled/version + dishes.tags）
-- 说明：PostgreSQL 的 WITH 只能作用于**下一条** SQL；原稿把 ingredients/steps/favorites/comments 拆成多条语句后仍引用 d1/u1 会报 relation does not exist。
-- 本版改为：TRUNCATE → INSERT users → INSERT dishes → 后续用子查询按 name / wechat_openid 关联。

TRUNCATE TABLE
  shopping_list_items,
  shopping_lists,
  menu_items,
  menus,
  comments,
  dish_likes,
  follows,
  favorites,
  cooking_steps,
  ingredients,
  dishes,
  users
RESTART IDENTITY CASCADE;

INSERT INTO users (wechat_openid, wechat_unionid, nickname, avatar_url) VALUES
  ('mock_openid_chef_a', NULL, '王大厨', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefA'),
  ('mock_openid_chef_b', NULL, '李小美', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefB'),
  ('mock_openid_chef_c', NULL, '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefC');

INSERT INTO dishes (
  user_id, name, description, difficulty, cooking_time, servings,
  image_url, tags, visibility, comments_enabled
)
SELECT u.id, v.name, v.description, v.difficulty, v.cooking_time, v.servings, v.image_url, v.tags, v.visibility, v.comments_enabled
FROM users u
CROSS JOIN (VALUES
  ('mock_openid_chef_a', '红烧肉', '肥而不腻，入口即化的经典家常菜', 'medium', 60, 2,
   'https://images.unsplash.com/photo-1606787366850-de6330128bfc',
   ARRAY['家常菜','硬菜']::text[], 'public'::dish_visibility, true),
  ('mock_openid_chef_a', '清蒸鱼', '保留鱼肉最鲜嫩的味道', 'easy', 20, 2,
   'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
   ARRAY['家常菜','低脂']::text[], 'public'::dish_visibility, true),
  ('mock_openid_chef_b', '番茄炒蛋', '最简单的美味，酸甜适口', 'easy', 10, 2,
   'https://images.unsplash.com/photo-1594759842811-9f9a4c8d4523',
   ARRAY['快手菜','早餐']::text[], 'public'::dish_visibility, true)
) AS v(chef_openid, name, description, difficulty, cooking_time, servings, image_url, tags, visibility, comments_enabled)
WHERE u.wechat_openid = v.chef_openid;

INSERT INTO ingredients (dish_id, name, quantity, unit, note, sequence)
SELECT d.id, '五花肉', 500, '克', NULL, 1 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '冰糖', 30, '克', NULL, 2 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '生抽', 2, '勺', NULL, 3 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '老抽', 1, '勺', NULL, 4 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '料酒', 2, '勺', NULL, 5 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '姜片', 5, '片', NULL, 6 FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '鸡蛋', 3, '个', NULL, 1 FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '番茄', 2, '个', NULL, 2 FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '白糖', 1, '勺', NULL, 3 FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, '葱花', NULL, NULL, NULL, 4 FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL;

INSERT INTO cooking_steps (dish_id, step_number, description)
SELECT d.id, 1, '五花肉切块，冷水下锅焯水捞出沥干' FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 2, '锅内少许油，下五花肉煸炒至出油微焦' FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 3, '放入冰糖炒出糖色，加入姜片、生抽、老抽、料酒翻炒均匀' FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 4, '加入没过肉的热水，大火烧开转小火焖煮45分钟' FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 5, '大火收汁，待汤汁浓稠即可出锅' FROM dishes d WHERE d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 1, '鸡蛋打散，番茄切块' FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 2, '油热下蛋液炒熟盛出备用' FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 3, '留底油炒番茄出汁' FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL
UNION ALL SELECT d.id, 4, '加入鸡蛋、盐、糖翻炒均匀即可' FROM dishes d WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL;

INSERT INTO favorites (user_id, dish_id)
SELECT u.id, d.id FROM users u, dishes d
WHERE u.wechat_openid = 'mock_openid_chef_b' AND d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL
SELECT u.id, d.id FROM users u, dishes d
WHERE u.wechat_openid = 'mock_openid_chef_c' AND d.name = '红烧肉' AND d.deleted_at IS NULL
UNION ALL
SELECT u.id, d.id FROM users u, dishes d
WHERE u.wechat_openid = 'mock_openid_chef_a' AND d.name = '番茄炒蛋' AND d.deleted_at IS NULL;

INSERT INTO comments (dish_id, user_id, content, rating)
SELECT d.id, u.id, '按照步骤做的，颜色非常漂亮！', 5
FROM dishes d, users u
WHERE d.name = '红烧肉' AND d.deleted_at IS NULL AND u.wechat_openid = 'mock_openid_chef_b'
UNION ALL
SELECT d.id, u.id, '味道不错，就是煮的时间还可以再长一点', 4
FROM dishes d, users u
WHERE d.name = '红烧肉' AND d.deleted_at IS NULL AND u.wechat_openid = 'mock_openid_chef_c'
UNION ALL
SELECT d.id, u.id, '经典的做法，很好吃', 5
FROM dishes d, users u
WHERE d.name = '番茄炒蛋' AND d.deleted_at IS NULL AND u.wechat_openid = 'mock_openid_chef_a';

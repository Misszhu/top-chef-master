-- Seed data (TECHNICAL_DESIGN.md compatible)
-- 注意：你需要先把数据库迁移到新的 schema（UUID + visibility/comments_enabled/version + dishes.tags）
-- 这里使用 CTE 返回的 UUID 以确保主外键引用正确。

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

WITH
  u1 AS (
    INSERT INTO users (wechat_openid, wechat_unionid, nickname, avatar_url)
    VALUES ('mock_openid_chef_a', NULL, '王大厨', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefA')
    RETURNING id
  ),
  u2 AS (
    INSERT INTO users (wechat_openid, wechat_unionid, nickname, avatar_url)
    VALUES ('mock_openid_chef_b', NULL, '李小美', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefB')
    RETURNING id
  ),
  u3 AS (
    INSERT INTO users (wechat_openid, wechat_unionid, nickname, avatar_url)
    VALUES ('mock_openid_chef_c', NULL, '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefC')
    RETURNING id
  ),
  d1 AS (
    INSERT INTO dishes (
      user_id, name, description, difficulty, cooking_time, servings,
      image_url, tags, visibility, comments_enabled
    )
    SELECT
      u1.id,
      '红烧肉',
      '肥而不腻，入口即化的经典家常菜',
      'medium',
      60,
      2,
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc',
      ARRAY['家常菜','硬菜']::text[],
      'public',
      true
    FROM u1
    RETURNING id, user_id
  ),
  d2 AS (
    INSERT INTO dishes (
      user_id, name, description, difficulty, cooking_time, servings,
      image_url, tags, visibility, comments_enabled
    )
    SELECT
      u1.id,
      '清蒸鱼',
      '保留鱼肉最鲜嫩的味道',
      'easy',
      20,
      2,
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
      ARRAY['家常菜','低脂']::text[],
      'public',
      true
    FROM u1
    RETURNING id, user_id
  ),
  d3 AS (
    INSERT INTO dishes (
      user_id, name, description, difficulty, cooking_time, servings,
      image_url, tags, visibility, comments_enabled
    )
    SELECT
      u2.id,
      '番茄炒蛋',
      '最简单的美味，酸甜适口',
      'easy',
      10,
      2,
      'https://images.unsplash.com/photo-1594759842811-9f9a4c8d4523',
      ARRAY['快手菜','早餐']::text[],
      'public',
      true
    FROM u2
    RETURNING id, user_id
  )
INSERT INTO ingredients (dish_id, name, quantity, unit, note, sequence)
SELECT d1.id, '五花肉', 500, '克', NULL, 1 FROM d1
UNION ALL SELECT d1.id, '冰糖', 30, '克', NULL, 2 FROM d1
UNION ALL SELECT d1.id, '生抽', 2, '勺', NULL, 3 FROM d1
UNION ALL SELECT d1.id, '老抽', 1, '勺', NULL, 4 FROM d1
UNION ALL SELECT d1.id, '料酒', 2, '勺', NULL, 5 FROM d1
UNION ALL SELECT d1.id, '姜片', 5, '片', NULL, 6 FROM d1

UNION ALL SELECT d3.id, '鸡蛋', 3, '个', NULL, 1 FROM d3
UNION ALL SELECT d3.id, '番茄', 2, '个', NULL, 2 FROM d3
UNION ALL SELECT d3.id, '白糖', 1, '勺', NULL, 3 FROM d3
UNION ALL SELECT d3.id, '葱花', NULL, NULL, NULL, 4 FROM d3;

-- Steps
INSERT INTO cooking_steps (dish_id, step_number, description)
SELECT d1.id, 1, '五花肉切块，冷水下锅焯水捞出沥干' FROM d1
UNION ALL SELECT d1.id, 2, '锅内少许油，下五花肉煸炒至出油微焦' FROM d1
UNION ALL SELECT d1.id, 3, '放入冰糖炒出糖色，加入姜片、生抽、老抽、料酒翻炒均匀' FROM d1
UNION ALL SELECT d1.id, 4, '加入没过肉的热水，大火烧开转小火焖煮45分钟' FROM d1
UNION ALL SELECT d1.id, 5, '大火收汁，待汤汁浓稠即可出锅' FROM d1

UNION ALL SELECT d3.id, 1, '鸡蛋打散，番茄切块' FROM d3
UNION ALL SELECT d3.id, 2, '油热下蛋液炒熟盛出备用' FROM d3
UNION ALL SELECT d3.id, 3, '留底油炒番茄出汁' FROM d3
UNION ALL SELECT d3.id, 4, '加入鸡蛋、盐、糖翻炒均匀即可' FROM d3;

-- Favorites
INSERT INTO favorites (user_id, dish_id)
SELECT u2.id, d1.id FROM u2, d1
UNION ALL SELECT u3.id, d1.id FROM u3, d1
UNION ALL SELECT u1.id, d3.id FROM u1, d3;

-- Comments (一人一菜一条)
INSERT INTO comments (dish_id, user_id, content, rating)
SELECT d1.id, u2.id, '按照步骤做的，颜色非常漂亮！', 5 FROM d1, u2
UNION ALL SELECT d1.id, u3.id, '味道不错，就是煮的时间还可以再长一点', 4 FROM d1, u3
UNION ALL SELECT d3.id, u1.id, '经典的做法，很好吃', 5 FROM d3, u1;

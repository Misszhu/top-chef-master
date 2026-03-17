-- Clear existing data
TRUNCATE TABLE shopping_list_items, shopping_lists, menu_items, menus, comments, favorites, dish_tags, tags, steps, ingredients, dishes, users RESTART IDENTITY CASCADE;

-- 1. Insert Users
INSERT INTO users (openid, nickname, avatar_url) VALUES
('mock_openid_chef_a', '王大厨', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefA'),
('mock_openid_chef_b', '李小美', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefB'),
('mock_openid_chef_c', '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefC');

-- 2. Insert Tags
INSERT INTO tags (name) VALUES
('家常菜'), ('川菜'), ('粤菜'), ('快手菜'), ('甜点'), ('早餐'), ('硬菜'), ('低脂');

-- 3. Insert Dishes for 王大厨 (User ID: 1)
INSERT INTO dishes (user_id, name, description, difficulty, cooking_time, image_url, is_public) VALUES
(1, '红烧肉', '肥而不腻，入口即化的经典家常菜', 'Medium', 60, 'https://images.unsplash.com/photo-1606787366850-de6330128bfc', true),
(1, '清蒸鱼', '保留鱼肉最鲜嫩的味道', 'Easy', 20, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2', true);

-- 4. Insert Ingredients for 红烧肉 (Dish ID: 1)
INSERT INTO ingredients (dish_id, name, amount, unit, sort_order) VALUES
(1, '五花肉', '500', '克', 1),
(1, '冰糖', '30', '克', 2),
(1, '生抽', '2', '勺', 3),
(1, '老抽', '1', '勺', 4),
(1, '料酒', '2', '勺', 5),
(1, '姜片', '5', '片', 6);

-- 5. Insert Steps for 红烧肉 (Dish ID: 1)
INSERT INTO steps (dish_id, step_number, description) VALUES
(1, 1, '五花肉切块，冷水下锅焯水捞出沥干'),
(1, 2, '锅内少许油，下五花肉煸炒至出油微焦'),
(1, 3, '放入冰糖炒出糖色，加入姜片、生抽、老抽、料酒翻炒均匀'),
(1, 4, '加入没过肉的热水，大火烧开转小火焖煮45分钟'),
(1, 5, '大火收汁，待汤汁浓稠即可出锅');

-- 6. Insert Dish Tags for 红烧肉 (Dish ID: 1)
INSERT INTO dish_tags (dish_id, tag_id) VALUES
(1, 1), -- 家常菜
(1, 7); -- 硬菜

-- 7. Insert Dishes for 李小美 (User ID: 2)
INSERT INTO dishes (user_id, name, description, difficulty, cooking_time, image_url, is_public) VALUES
(2, '番茄炒蛋', '最简单的美味，酸甜适口', 'Easy', 10, 'https://images.unsplash.com/photo-1594759842811-9f9a4c8d4523', true);

-- 8. Insert Ingredients for 番茄炒蛋 (Dish ID: 3)
INSERT INTO ingredients (dish_id, name, amount, unit, sort_order) VALUES
(3, '鸡蛋', '3', '个', 1),
(3, '番茄', '2', '个', 2),
(3, '白糖', '1', '勺', 3),
(3, '葱花', '少许', '', 4);

-- 9. Insert Steps for 番茄炒蛋 (Dish ID: 3)
INSERT INTO steps (dish_id, step_number, description) VALUES
(3, 1, '鸡蛋打散，番茄切块'),
(3, 2, '油热下蛋液炒熟盛出备用'),
(3, 3, '留底油炒番茄出汁'),
(3, 4, '加入鸡蛋、盐、糖翻炒均匀即可');

-- 10. Insert Favorites
INSERT INTO favorites (user_id, dish_id) VALUES
(2, 1), -- 李小美收藏了红烧肉
(3, 1), -- 张三收藏了红烧肉
(1, 3); -- 王大厨收藏了番茄炒蛋

-- 11. Insert Comments
INSERT INTO comments (user_id, dish_id, content, rating) VALUES
(2, 1, '按照步骤做的，颜色非常漂亮！', 5),
(3, 1, '味道不错，就是煮的时间还可以再长一点', 4),
(1, 3, '经典的做法，很好吃', 5);

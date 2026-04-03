-- M4 饮食日记：与 001_init_schema 分离，便于已部署环境单独执行
-- meal_slot：早餐/午餐/晚餐/加餐/其他；可为 NULL 表示未区分餐次

DO $$ BEGIN
  CREATE TYPE meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS meal_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  eaten_date DATE NOT NULL,
  meal_slot meal_slot,
  dish_id UUID,
  title VARCHAR(200) NOT NULL,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL,
  CHECK (length(trim(title)) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_meal_log_entries_user_eaten_date
  ON meal_log_entries(user_id, eaten_date)
  WHERE deleted_at IS NULL;

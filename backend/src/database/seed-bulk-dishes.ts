/**
 * 为首页虚拟滚动压测批量插入「公开」菜谱。
 *
 * 用法（在 backend 目录、配置好 .env 数据库变量后）：
 *   npm run seed:bulk-dishes
 *   BULK_DISH_COUNT=300 npm run seed:bulk-dishes
 *
 * 会先删除名称以「【虚拟滚动测试】」开头的旧压测菜（硬删，级联删食材/步骤等），
 * 再向库中**第一个**用户（按 created_at）插入新数据。若无用户请先执行 `npm run seed`。
 */
import pool from '../config/database';

const NAME_PREFIX = '【虚拟滚动测试】';
const DEFAULT_COUNT = 150;
const MAX_COUNT = 500;

const IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
];

async function main() {
  const raw = process.env.BULK_DISH_COUNT;
  let count = raw ? parseInt(raw, 10) : DEFAULT_COUNT;
  if (Number.isNaN(count) || count < 1) count = DEFAULT_COUNT;
  count = Math.min(MAX_COUNT, count);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const del = await client.query(`DELETE FROM dishes WHERE name LIKE $1`, [`${NAME_PREFIX}%`]);
    console.log(`Removed ${del.rowCount ?? 0} previous bulk test dishes (if any).`);

    const userRes = await client.query(
      `SELECT id, nickname FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`
    );
    if (userRes.rows.length === 0) {
      throw new Error('No user in DB. Run: npm run seed');
    }
    const userId: string = userRes.rows[0].id;
    const nickname: string = userRes.rows[0].nickname ?? '(no name)';
    console.log(`Target user: ${nickname} (${userId})`);

    const insertSql = `
      INSERT INTO dishes (
        user_id, name, description, difficulty, cooking_time, servings,
        image_url, tags, visibility, comments_enabled, like_count,
        created_at, updated_at
      )
      SELECT
        $1::uuid,
        $2 || n::text,
        '首页虚拟滚动压测 #' || n::text || ' · 公开可见',
        (ARRAY['easy', 'medium', 'hard']::varchar[])[1 + ((n - 1) % 3)],
        10 + ((n * 7) % 90),
        2 + (n % 4),
        (ARRAY[$3::text, $4::text, $5::text, $6::text])[1 + ((n - 1) % 4)],
        ARRAY['压测', '虚拟滚动', '批次' || ((n % 5) + 1)::text]::text[],
        'public'::dish_visibility,
        false,
        (n * 13) % 200,
        NOW() - (($7::int - n) * INTERVAL '1 minute'),
        NOW() - (($7::int - n) * INTERVAL '1 minute')
      FROM generate_series(1, $7::int) AS n
    `;

    const ins = await client.query(insertSql, [
      userId,
      NAME_PREFIX,
      IMAGES[0],
      IMAGES[1],
      IMAGES[2],
      IMAGES[3],
      count,
    ]);

    await client.query('COMMIT');
    console.log(`Inserted ${ins.rowCount ?? count} public dishes (${NAME_PREFIX}1 … ${NAME_PREFIX}${count}).`);
    console.log(`首页默认 sort=latest，约需拉取 ${Math.ceil(count / 20)} 页（每页 20 条）可见全部。`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();

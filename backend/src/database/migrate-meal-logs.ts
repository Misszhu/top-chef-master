/**
 * 对已有数据库补建 M4 饮食日记表（等价于执行 migrations/002_meal_log_entries.sql）。
 * 用法：在 backend 目录执行  yarn db:migrate:meal-logs
 * 依赖：.env 中 DATABASE_URL 或 config/database 所需变量已配置。
 */
import dotenv from 'dotenv';

dotenv.config();

import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function main() {
  const sqlPath = path.join(__dirname, 'migrations', '002_meal_log_entries.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Applied:', sqlPath);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

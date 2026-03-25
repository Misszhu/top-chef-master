#!/usr/bin/env bash
# 按新 migration 重建 topchef 数据库并执行 seed（需本机 PostgreSQL 已启动，且 psql 在 PATH 中）
# 用法：在项目根目录执行
#   chmod +x scripts/reset-db.sh
#   ./scripts/reset-db.sh
#
# 可通过环境变量覆盖：DB_HOST DB_PORT DB_USER DB_NAME DB_PASSWORD

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v psql >/dev/null 2>&1; then
  echo "未找到 psql，请先安装 PostgreSQL 客户端并将 bin 加入 PATH（例如 Postgres.app）。" >&2
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-topchef}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

echo "连接: host=$DB_HOST port=$DB_PORT user=$DB_USER db=$DB_NAME"

# 若数据库不存在则创建（在 postgres 库上执行）
EXISTS="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" || true)"
if [[ "$EXISTS" != "1" ]]; then
  echo "创建数据库: $DB_NAME"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"
fi

echo "清空 public schema 并重建..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "执行 migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$ROOT/backend/src/database/migrations/001_init_schema.sql"

echo "执行 seed..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$ROOT/backend/src/database/seeds/001_seed_data.sql"

echo "完成。"

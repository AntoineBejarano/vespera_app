#!/bin/sh
set -eu

echo "[start] NODE_ENV=${NODE_ENV:-} PORT=${PORT:-3000} HOSTNAME=${HOSTNAME:-0.0.0.0}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[start] ERROR: DATABASE_URL is not set. Add Railway Postgres and link DATABASE_URL."
  exit 1
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "[start] ERROR: AUTH_SECRET is not set."
  exit 1
fi

echo "[start] Applying Prisma schema..."
npx prisma db push --skip-generate || {
  echo "[start] WARNING: prisma db push failed; continuing so logs are visible"
}

echo "[start] Starting Next.js server..."
exec node server.js

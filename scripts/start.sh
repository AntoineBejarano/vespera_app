#!/bin/sh
set -eu

# HOSTNAME=0.0.0.0 is only the listen bind address (Docker/Railway).
# Public redirects must use APP_URL / x-forwarded-host — never 0.0.0.0.
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "[start] NODE_ENV=${NODE_ENV:-} PORT=${PORT} bind=${HOSTNAME}"
echo "[start] APP_URL=${APP_URL:-"(unset — set to https://your-domain)"}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[start] ERROR: DATABASE_URL is not set. Add Railway Postgres and link DATABASE_URL."
  exit 1
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "[start] ERROR: AUTH_SECRET is not set."
  exit 1
fi

if [ -z "${APP_URL:-}" ]; then
  echo "[start] WARN: APP_URL is unset. Redirects may break behind Railway. Set APP_URL=https://<public-host>"
fi

echo "[start] Applying Prisma schema..."
# Production may need index/constraint renames; accept-data-loss only covers
# non-destructive unique-constraint warnings Prisma still flags as data-loss.
npx prisma db push --accept-data-loss || {
  echo "[start] ERROR: prisma db push failed"
  exit 1
}

echo "[start] Starting Next.js server..."
exec node server.js

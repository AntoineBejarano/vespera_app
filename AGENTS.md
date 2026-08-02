<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database

There is **no local Postgres**. The only database is Railway Postgres. Never start Docker/local Postgres for this repo; use `DATABASE_PUBLIC_URL` / `DATABASE_URL` from Railway for migrations and local `npm run dev`. See `CLAUDE.md`.

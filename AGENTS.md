<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Briefing completo del producto: [CLAUDE.md](./CLAUDE.md).

## Database

There is **no local Postgres**. The only database is Railway Postgres. Never start Docker/local Postgres for this repo; use `DATABASE_PUBLIC_URL` / `DATABASE_URL` from Railway for migrations and local `npm run dev`. Prefer `npx prisma migrate deploy` (not `prisma migrate dev` / `npm run db:migrate`). See `CLAUDE.md`.

## Non-negotiables

- Next 16: proxy lives in `src/proxy.ts`, not `middleware.ts`.
- Auth: Hexclave (`hexclave.config.ts`, `src/hexclave/`). Product authz is Prisma `WorkspaceMember`, not Hexclave RBAC.
- After Dark (`xxx.vesperer.com`) stays off the apex; no adult copy on `vesperer.com`. Stripe keys are apex-only.
- No sexual content involving minors / age-play. Policy: `src/lib/content-policy/`.
- Reply in Spanish if the user writes in Spanish; code and identifiers in English.
- Minimal diffs. Do not invent Next/Hexclave/Prisma APIs — read installed packages and `.claude/skills/`.

## Architecture (Core vs reasoning)

Vesperer is a platform for creating persistent AI personas. It owns identity, relationships and continuity, provides its own native reasoning experience by default, and allows advanced personas to attach an external reasoning runtime without changing who the persona is.

- Domain facade: `src/lib/core/` (envelope, identity, relationship, continuity, `recordInteraction`).
- Reasoning: `src/lib/reasoning/` (`native` = AI SDK + OpenRouter, `external` = HTTP adapter). Never `src/lib/hermes/`.
- Adult / After Dark personas stay Native. Runtime API is SFW-only (`POST /api/v1/runtime/envelope` + `interactions`).
- `RuntimeBinding.authSecretRef` names a Railway env var; secrets do not live in Prisma.
- Tools/capabilities are optional and separate from reasoning.

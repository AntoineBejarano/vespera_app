# Vespera

Plataforma web de **relaciones ficticias adultas persistentes** (18+): personalidad coherente, memoria real, chat streaming uncensored vía OpenRouter. Hosting en **Railway**.

## Stack

- Next.js (App Router) + AI SDK
- OpenRouter (modelos uncensored, routing por env/ajustes)
- Postgres (Railway) + Prisma
- Upstash Redis (historial + límites; fallback en memoria)
- Upstash Vector (memoria larga; fallback Postgres)
- Auth.js (credenciales + age gate)

## Arranque local

1. Copia `.env.example` → `.env` y rellena al menos:
   - `DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `OPENROUTER_API_KEY`
2. `npm install`
3. `npx prisma db push`
4. `npm run dev`

## Railway

1. Nuevo proyecto → Add Postgres → Add servicio desde este repo
2. Variables: las de `.env.example` (`DATABASE_URL` la inyecta el plugin Postgres)
3. Deploy con `Dockerfile` / `railway.toml`
4. Upstash Redis + Vector (opcionales pero recomendados en producción)

## Flujos MVP

- `/` landing → `/age-gate` → registro 18+
- `/chat/new` onboarding conversacional → ficha `identityJson`
- `/chat` streaming + intensidad 1–5 + multi-personaje (free: 1, premium stub: 2)
- `/memory` editar/borrar recuerdos
- `/settings` modelo, exportar/borrar cuenta, límite diario

## Telegram / pagos

- Stub: `telegram/bot.ts` + `POST /api/telegram`
- Monetización: free con límite diario; Premium vía Stars/procesador adult (no Stripe)

## Seguridad

Línea roja: nada de contenido sexual con menores / age-play. Bloqueo en API + reglas de system prompt.

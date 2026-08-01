# Vesperer

Plataforma de **identidades conversacionales con memoria persistente**: companions, mentores, empleados IA, creadores y After Dark (18+). Apex en `vesperer.com`; adulto en `xxx.vesperer.com`. Hosting en **Railway**.

## Producto

| Superficie | Rol |
|---|---|
| `/` | Landing emocional (curiosidad → demo → cuenta) |
| `/explore` | Personas y paths compartibles |
| `/business` | Infraestructura B2B: workspaces, API, handoff, ownership |
| `/business/agencies` | Operación multi-talent |
| `/business/platforms` | Integración API / multi-tenant |
| `/after-dark` | After Dark 18+ (deseo, privacidad, continuidad) |
| `/docs` | API & CLI |
| `/technology` | Capas de identidad y memoria |

Operador: **Deevly Labs LTD**. Contacto: `legal@vesperer.com`.

## Stack

- Next.js (App Router) + React 19 + AI SDK
- Auth: Hexclave (`@hexclave/next`)
- OpenRouter (modelos; routing por env/ajustes)
- Postgres + Prisma 7
- Upstash Redis + Vector (con fallbacks)
- Voice: ElevenLabs (server-only)
- Deploy: Railway + Docker

## Arranque local

1. Copia `.env.example` → `.env` y rellena al menos:
   - `DATABASE_URL`
   - Hexclave (vía `npx @hexclave/cli dev` en desarrollo)
   - `OPENROUTER_API_KEY`
2. `npm install`
3. `npx prisma db push`
4. `npm run dev`

Probar After Dark en local: `http://xxx.localhost:3000`

## Railway

1. Nuevo proyecto → Add Postgres → Add servicio desde este repo
2. Variables: las de `.env.example` (`DATABASE_URL` la inyecta el plugin Postgres)
3. Deploy con `Dockerfile` / `railway.toml`
4. Upstash Redis + Vector (opcionales pero recomendados en producción)

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run db:push
npm run vesperer   # CLI personas / API keys
```

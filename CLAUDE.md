# Vesperer — instrucciones para agentes

@AGENTS.md

## Producto

**Empresa:** [Deevly Labs LTD](https://deevlylabs.com) (Companies House 16506991) — estudio / operadora legal.

**Producto:** **Vesperer** (`vesperer.com`) — plataforma de personajes IA con identidad persistente, memoria a largo plazo y continuidad entre canales (web, Telegram, voice, API/CLI). After Dark vive en `xxx.vesperer.com`. Vesperer no es la empresa; es un producto de Deevly Labs.

Contacto producto: `legal@mail.vesperer.com`. Studio: `https://deevlylabs.com`.

Dos superficies de marca en el **mismo deploy** (Railway):

| Host | Superficie |
|------|------------|
| `vesperer.com` | Producto principal / B2B / marketing SFW |
| `xxx.vesperer.com` | **After Dark** (18+) — companions adultos |

Routing por host en `src/proxy.ts` + helpers en `src/lib/hosts.ts`.
- Apex: `/after-dark` → 308 a `https://xxx.vesperer.com/`
- XXX: `/` se reescribe internamente a `/after-dark`
- Localhost / `*.railway.app`: `/after-dark` sigue funcionando sin hop a prod
- Probar XXX en local: `http://xxx.localhost:3000`

Constantes: `SITE_URL`, `AFTER_DARK_URL`, `AFTER_DARK_HOST` en `src/lib/site.ts` / `src/lib/hosts.ts`.
Env: `NEXT_PUBLIC_AFTER_DARK_HOST`, `NEXT_PUBLIC_AFTER_DARK_URL` (ver `.env.example`).

## Stack

- **Next.js 16** App Router + React 19 — **no asumas APIs antiguas**; lee `node_modules/next/dist/docs/`
- En Next 16, `middleware.ts` → **`src/proxy.ts`** (runtime Node)
- Auth: **Hexclave** (`@hexclave/next`) — primario; NextAuth legacy aún presente
- DB: Postgres + Prisma 7 (`@prisma/adapter-pg`) — **solo Railway** (ver abajo)
- AI: AI SDK + OpenRouter
- Voice: ElevenLabs (server-only)
- Cache/memoria: Upstash Redis + Vector (con fallbacks)
- Deploy: Railway + Docker (`Dockerfile`, `railway.toml`)
- CLI: `npm run vesperer` (`cli/`)

## Base de datos (obligatorio)

**No hay Postgres local.** La única base de datos es el plugin Postgres del proyecto Railway.

- No levantar Docker/`postgres` en `127.0.0.1`, no `prisma dev`, no DB de desarrollo aparte.
- `DATABASE_URL` en `.env` local = URL **pública** de Railway (`DATABASE_PUBLIC_URL` del servicio Postgres), o usar `railway run` / variables del servicio.
- Migraciones: `npx prisma migrate deploy` contra esa URL (nunca inventar un schema local vacío).
- `db push` solo si counsel/ops lo pide explícitamente; el camino normal es migraciones en Railway.

## Estructura clave

```
src/app/           # rutas App Router
src/proxy.ts       # age gate cookie + host routing XXX
src/components/    # UI (LandingPage, AfterDarkLanding, AppNav…)
src/lib/           # dominio (chat, personas, voice, legal, seo, hosts…)
src/hexclave/      # client + server Hexclave apps
prisma/            # schema + migraciones
cli/               # CLI con account API keys (vsk_…)
docs/              # planes (compliance, persona, telegram…)
```

## Convenciones

- Responde y documenta en **español** si el usuario habla español; código/identificadores en inglés.
- Cambios mínimos y enfocados; no refactors colaterales ni docs no pedidas.
- No inventes APIs de Next/Hexclave/Prisma: mira el código instalado y los skills en `.claude/skills/`.
- Age gate: cookie `vesperer_adult` = `LEGAL_VERSION` (`src/lib/legal/constants.ts`). Zona `standard` vs `adult`.
- After Dark = marca **XXX**; no mezclar copy adulto en el apex.
- Hexclave: si añades rutas de auth custom, actualiza `urls` del SDK; al añadir `xxx.vesperer.com`, hay que permitir ese dominio en Hexclave.
- Prisma: relaciones bidireccionales, timestamps, índices en campos consultados a menudo.
- Frontend marketing: una composición por viewport, marca hero-level, sin cards en el hero; After Dark usa `variant="after-dark"` / `data-theme="after-dark"`.

## Línea roja (safety)

Prohibido contenido sexual con menores / age-play. Enforcement en API + prompts + políticas legales (`/legal/*`, Acceptable Use, Adult Content Notice).

## Comandos

```bash
npm run dev          # desarrollo (app local; DB = Railway)
npm run build        # prisma generate + next build
npm run lint
npm run db:migrate   # preferir: DATABASE_URL=<Railway public> npx prisma migrate deploy
npm run vesperer     # CLI personas / API keys
```

## SEO Explore (growth)

Taxonomía canónica: `/explore`, `/meet/[slug]`, `/learn/[slug]`, `/hire/[slug]`, `/create/[slug]`.
Catálogo editorial en `src/lib/seo/catalog/` (no thin pages). Aliases 308: `/characters/*`, `/historical-figures/*` → meet; `/use-cases/*` → hire/learn/create.
Chat demo real: `/c/[slug]` (showcase en `src/lib/characters/showcase.ts`). Adulto fuera del apex.

## Al tocar After Dark / XXX

1. Links públicos → `AFTER_DARK_URL`, no hardcodear path en el apex para SEO.
2. Nav After Dark: anchors `#section` (valen en `/` del subdominio y en `/after-dark` local).
3. Tras DNS: CNAME `xxx` + custom domain en Railway + dominio permitido en Hexclave.
4. Canonical/sitemap/OG deben apuntar a `https://xxx.vesperer.com/`.

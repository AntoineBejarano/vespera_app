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
- Auth: **Hexclave** (`@hexclave/next`) — primario (`AUTH_PROVIDER=hexclave`); NextAuth legacy aún presente
- DB: Postgres + Prisma 7 (`@prisma/adapter-pg`) — **solo Railway** (ver abajo)
- AI: AI SDK + OpenRouter
- Voice: ElevenLabs (server-only; nunca `NEXT_PUBLIC_`)
- Cache/memoria: Upstash Redis + Vector (con fallbacks)
- Knowledge packs: ingest + R2/S3 (Postgres guarda `objectKey`, nunca el fichero)
- Email: Resend (`mail.vesperer.com`)
- Billing: Stripe **solo apex SFW** (Creator/Studio)
- Telegram: bot + link de cuenta (`telegram/`, `src/lib/telegram/`)
- Deploy: Railway + Docker (`Dockerfile`, `railway.toml`)
- CLI: `npm run vesperer` (`cli/`) — API keys `vsk_` / chat keys `vesp_`

## Base de datos (obligatorio)

**No hay Postgres local.** La única base de datos es el plugin Postgres del proyecto Railway.

- No levantar Docker/`postgres` en `127.0.0.1`, no `prisma dev`, no DB de desarrollo aparte.
- `DATABASE_URL` en `.env` local = URL **pública** de Railway (`DATABASE_PUBLIC_URL` del servicio Postgres), o usar `railway run` / variables del servicio.
- Migraciones: `npx prisma migrate deploy` contra esa URL (nunca inventar un schema local vacío).
- `npm run db:migrate` apunta a `prisma migrate dev` — **no usarlo** en este repo; el camino normal es `migrate deploy` contra Railway.
- `db push` solo si counsel/ops lo pide explícitamente.

## Estructura clave

```
src/app/              # rutas App Router
src/proxy.ts          # age gate cookie + host routing XXX
src/components/       # UI (LandingPage, AfterDarkLanding, AppNav…)
src/lib/              # dominio (chat, personas, voice, legal, seo, hosts, stripe, knowledge…)
src/hexclave/         # client + server Hexclave apps
hexclave.config.ts    # config Hexclave (urls, RBAC mirror)
prisma/               # schema + migraciones
cli/                  # CLI con account API keys (vsk_…)
telegram/             # bot Telegram
docs/                 # planes (compliance, persona, telegram, workspaces…)
```

Authz de producto: **Prisma `WorkspaceMember` + mapa de capabilities** (`src/lib/workspace/`). Hexclave Teams/RBAC en `hexclave.config.ts` es espejo opcional, no la fuente de verdad.

## Convenciones

- Responde y documenta en **español** si el usuario habla español; código/identificadores en inglés.
- Cambios mínimos y enfocados; no refactors colaterales ni docs no pedidas.
- No inventes APIs de Next/Hexclave/Prisma: mira el código instalado y los skills en `.claude/skills/`. Hexclave: pregunta a skill.hexclave.com / MCP `ask_hexclave`, no a memoria.
- Age gate: cookie `vesperer_adult` = `LEGAL_VERSION` (`src/lib/legal/constants.ts`). Zona `standard` vs `adult`. Consent adulto extra: `vesperer_adult_ok`.
- After Dark = marca **XXX**; no mezclar copy adulto en el apex.
- Hexclave: si añades rutas de auth custom, actualiza `urls` del SDK; al añadir `xxx.vesperer.com`, hay que permitir ese dominio en Hexclave. Dev: `npx @hexclave/cli dev --config-file hexclave.config.ts -- npm run dev` (no pedir al usuario que pegue secrets a mano).
- Prisma: relaciones bidireccionales, timestamps, índices en campos consultados a menudo.
- Frontend marketing: una composición por viewport, marca hero-level, sin cards en el hero; After Dark usa `variant="after-dark"` / `data-theme="after-dark"`.
- Stripe / `PREMIUM_*`: solo `vesperer.com`. After Dark no usa esas keys.
- ElevenLabs, Resend, Hexclave secret, Stripe secret: server-only.

## Línea roja (safety)

Prohibido contenido sexual con menores / age-play. Enforcement en API + prompts + políticas legales (`/legal/*`, Acceptable Use, Adult Content Notice) y `src/lib/content-policy/`.

- Kill switch: `SAFETY_KILL_SWITCH=true` bloquea respuestas AI de salida.
- Tests: `npm run test:policy`.
- Core / reasoning: `npm run test:core`.

## Architecture (personas + reasoning)

Vesperer **is the complete product**: identity, relationship, continuity **and** native reasoning (AI SDK + OpenRouter). An external runtime (Hermes, etc.) is an optional plugin of that brain, not the reason Vesperer exists.

- Facade: `src/lib/core/` — `ContextEnvelope`, identity linking (evidence only), relationship stage + `proposed_relationship_update` (proposal, never a privileged mutation).
- Reasoning: `src/lib/reasoning/` — `native` | `external`. Default `Character.reasoningMode = native`.
- Infrastructure vs identity: `RuntimeBinding` (workspace `baseUrl` + `authSecretRef`) vs `Character.reasoningMode` / `reasoningBindingId`. Secrets stay in Railway env.
- After Dark (`isAdult`) never uses external runtime or `/api/v1/runtime/*`.
- Capabilities (`capabilitiesJson`) are optional and are not tools-as-requirement.

Pipeline: `prepareTurn → ContextEnvelope → ReasoningRuntime → ReasoningResult → recordInteraction`.

## Billing, email, Telegram

- Stripe: planes Creator/Studio en apex (`src/lib/stripe/`, `/api/billing/*`). After Dark no se cobra con esas keys.
- Resend: transaccional + inbound en `mail.vesperer.com`; webhook `/api/webhooks/resend`.
- Telegram: producto conversacional; la web es admin/test. Ver `docs/telegram.md`.

## Comandos

```bash
npm run dev            # desarrollo (app local; DB = Railway)
npm run build          # prisma generate + next build --webpack
npm run lint
npm run test:policy    # content policy
npm run test:core      # envelope, identity, reasoning isolation
npx prisma migrate deploy   # contra DATABASE_URL pública de Railway
npm run vesperer       # CLI personas / API keys
npm run telegram       # bot Telegram
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

# Vesperer API reference

Base URL: `https://vesperer.com`  
Auth: `X-Api-Key: vsk_…` (management) or `vesp_…` (chat / runtime pull). `Authorization: Bearer` is accepted on the same routes.

All management queries are scoped to the key's workspace. Foreign IDs return **404**, not 403.

## Account API (`vsk_`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/personas` | List personas you own |
| POST | `/api/v1/personas` | Create. Direct layers or `mode: "generate"` |
| GET | `/api/v1/personas/:id` | Layers (no chat key) |
| PATCH | `/api/v1/personas/:id` | Update layers / flags / reasoning |
| DELETE | `/api/v1/personas/:id` | Delete persona |
| POST | `/api/v1/personas/import` | Character Card / SillyTavern JSON |
| GET/POST | `/api/v1/personas/:id/chat-key` | Reveal / rotate `vesp_` |
| GET/POST | `/api/v1/knowledge/packs` | List / create packs |
| POST | `/api/v1/knowledge/packs/:id/links` | Link pack to your personas |
| GET/POST | `/api/v1/bots` | List / bind Telegram bots |
| GET/POST | `/api/v1/runtime-bindings` | List / create HTTP runtime bindings |
| PATCH/DELETE | `/api/v1/runtime-bindings/:id` | Update / delete a binding |

## Chat API (`vesp_` only)

`POST /api/v1/chat`

`vsk_` on this route returns 401.

### Body

| Field | Required | Notes |
|---|---|---|
| `message` | yes | Max 8000 chars |
| `peerId` | no | Stable end-user id. Isolates memory. Use it in production. |
| `displayName` | no | Shown in relationship context |
| `endUserAgeAttested` | adult only | Must be `true` for After Dark / `isAdult` personas |

## Create persona body

Direct (preferred for agents):

```json
{
  "mode": "direct",
  "name": "Alex",
  "soul": "…",
  "style": "…",
  "rules": "…",
  "context": "…",
  "intensity": 2
}
```

Aliases `soulMd` / `styleMd` / `rulesMd` / `contextMd` are accepted on PATCH.

Generate (LLM expands onboarding fields): `mode: "generate"` plus `name`, `personality`, `relationship`, `style`, optional `attractions`, `irritations`, `intensity`.

### PATCH extras

| Field | Notes |
|---|---|
| `reasoningMode` | `"native"` (default) or `"external"` |
| `reasoningBindingId` | RuntimeBinding id in the same workspace, or `null` |
| `capabilities` | `{ "items": [{ "id", "kind", "enabled" }] }` — optional, not tools-as-requirement |
| `preferredModel` | OpenRouter model id, or `null` to clear |
| `isAdult` | Adult personas are forced to Native reasoning |
| `isPublic` / `slug` / `tagline` / `openingLine` | Registry / public landing |

Rotating a chat key or publishing may require operator attestation in the studio.

## CLI (`npm run vesperer`)

From the Vesperer repo, or any checkout with the CLI:

```bash
npm run vesperer -- login --key vsk_YOUR_SECRET
npm run vesperer -- personas create --from persona.json
npm run vesperer -- personas list --json
npm run vesperer -- personas get <id>
npm run vesperer -- personas update <id> --soul ./soul.md --style ./style.md
npm run vesperer -- personas chat-key <id>
npm run vesperer -- personas chat-key <id> --rotate --accept-operator
npm run vesperer -- personas import --from card.json --permission-confirmed
npm run vesperer -- knowledge packs create --name "Product FAQ"
npm run vesperer -- knowledge packs link <packId> --character <personaId>
npm run vesperer -- chat --key vesp_… --message "Hello" --peer customer_123 --age-attested
npm run vesperer -- bots create --token <BotFather> --username <name> --character <id> --accept-operator
```

Env: `VESPERER_API_KEY`, `VESPERER_API_URL`.

## Errors

| Status | Meaning |
|---|---|
| 400 | Invalid body (Zod details in `details`) |
| 401 | Missing / wrong key, or `vsk_` used on chat |
| 403 | Isolation (adult runtime), age attestation, or operator gate |
| 404 | Unknown id **in this workspace** (do not retry as another tenant) |
| 429 | Rate limit. Honor `Retry-After` / `retryAfterSec` |

## Rate limits (per minute)

| Bucket | Limit |
|---|---|
| management | 120 |
| create | 30 |
| import | 10 |
| knowledge | 60 |
| chat | 90 |
| runtime | 60 |

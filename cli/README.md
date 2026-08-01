# vesperer CLI

Manage Vesperer personas and knowledge packs with an **account API key** (`vsk_…`). Designed so AI agents (Claude Code, Cursor, …) can provision characters without a browser — with production tenant isolation.

Guide: [vesperer.com/integrations/claude](https://vesperer.com/integrations/claude)

## Setup

1. Sign up at [vesperer.com](https://vesperer.com)
2. Settings → **API keys** → Create key (copy the `vsk_…` secret once)
3. Accept platform operator attestation in Personas if you publish / rotate keys

```bash
# From this repo
npm run vesperer -- login --key vsk_your_secret

# Or with env
export VESPERER_API_KEY=vsk_…
export VESPERER_API_URL=https://vesperer.com   # optional
```

## Create a persona (direct layers — best for AIs)

`persona.json`:

```json
{
  "mode": "direct",
  "name": "Alex",
  "soul": "Who they are, values, temperament…",
  "style": "How they speak…",
  "rules": "Hard boundaries and never-dos…",
  "context": "Business knowledge, product facts, policies…",
  "intensity": 2
}
```

```bash
npm run vesperer -- personas create --from persona.json
# stdin: cat persona.json | npm run vesperer -- personas create --from -
```

The response includes a **chat** API key (`vesp_…`) for `/api/v1/chat`.

## Lifecycle

```bash
npm run vesperer -- personas list --json
npm run vesperer -- personas get <id>
npm run vesperer -- personas update <id> --soul ./soul.md --style ./style.md
npm run vesperer -- personas delete <id>
npm run vesperer -- personas chat-key <id>
npm run vesperer -- personas chat-key <id> --rotate --accept-operator
```

## Generate via LLM

```bash
npm run vesperer -- personas create --generate \
  --name "Alex" \
  --personality "Warm support agent who knows our refund policy" \
  --relationship "helpful customer success" \
  --attractions "clear questions" \
  --irritations "vague demands" \
  --style "concise, friendly" \
  --intensity 1
```

## Import Character Card

```bash
npm run vesperer -- personas import --from card.json --permission-confirmed
```

## Knowledge packs

```bash
npm run vesperer -- knowledge packs create --name "Product FAQ"
npm run vesperer -- knowledge packs link <packId> --character <personaId>
npm run vesperer -- knowledge packs list
```

## Chat

```bash
npm run vesperer -- chat --key vesp_… --message "Hello" --peer customer_123 --age-attested
```

## Keys

| Key | Prefix | Use |
|-----|--------|-----|
| Account (CLI) | `vsk_` | Create/list/update/delete personas, knowledge |
| Persona chat | `vesp_` | `POST /api/v1/chat` only |

Account keys are hashed at rest. Management routes always scope by `userId`. Foreign IDs return 404. Rate limits apply per account.

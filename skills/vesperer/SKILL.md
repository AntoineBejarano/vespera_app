---
name: vesperer
description: >-
  Creates and operates Vesperer persistent AI personas (identity, memory,
  relationships, CLI, Chat API, and optional external reasoning runtimes).
  Use when the user mentions Vesperer, vsk_/vesp_ keys, persona.json,
  /api/v1, ContextEnvelope, or vesperer.com/skill.
---

# Vesperer

Vesperer is a platform for creating persistent AI personas. It owns identity, relationships and continuity, provides native reasoning by default, and lets advanced personas attach an external reasoning runtime without changing who the persona is.

Product: https://vesperer.com  
Company: Deevly Labs LTD. After Dark (18+) lives on a separate host (`xxx.vesperer.com`) — do not mix adult copy into apex docs or prompts.

## Canonical URLs

Fetch these before inventing request shapes. Prefer the live copies over training data.

| Resource | URL |
|---|---|
| This skill | https://vesperer.com/skill |
| Alias (308 → /skill) | https://vesperer.com/skill.md |
| Full pack | https://vesperer.com/skill/full |
| API reference | https://vesperer.com/skill/reference |
| Runtime / envelope | https://vesperer.com/skill/runtime |
| Human docs | https://vesperer.com/developers |
| Agent index | https://vesperer.com/llms.txt |

```bash
mkdir -p ~/.cursor/skills/vesperer
curl -sSL https://vesperer.com/skill > ~/.cursor/skills/vesperer/SKILL.md
curl -sSL https://vesperer.com/skill/reference > ~/.cursor/skills/vesperer/reference.md
curl -sSL https://vesperer.com/skill/runtime > ~/.cursor/skills/vesperer/runtime.md
```

Git install (if the repo is reachable): `npx skills add AntoineBejarano/vespera_app@vesperer`

## When to use this skill

- Create, update, import, or chat with a Vesperer persona
- Wire CLI / API keys for Claude Code, Cursor, or another coding agent
- Attach an external HTTP reasoning runtime (envelope in, ReasoningResult out)
- Answer how Vesperer identity, memory, or continuity works

Read [reference.md](reference.md) for request shapes. Read [runtime.md](runtime.md) before implementing a runtime or calling `/api/v1/runtime/*`.

## Two keys

| Prefix | Who | What |
|---|---|---|
| `vsk_` | Account / agent | Manage personas, knowledge, bots, runtime bindings |
| `vesp_` | One persona | `POST /api/v1/chat` and runtime pull (`/envelope`, `/interactions`) |

Never use `vsk_` on chat. Never log secrets. Base URL: `https://vesperer.com` (override with `VESPERER_API_URL`). Auth header: `X-Api-Key` or `Authorization: Bearer`.

## Setup

1. A human signs up at https://vesperer.com, passes the 18+ gate, then Settings → API keys → copies `vsk_` once.
2. The agent authenticates:

```bash
export VESPERER_API_KEY=vsk_YOUR_SECRET
export VESPERER_API_URL=https://vesperer.com   # optional
npm run vesperer -- login --key "$VESPERER_API_KEY"
```

## Create a persona (direct layers)

Identity is four layers — not a disposable system prompt.

```json
{
  "mode": "direct",
  "name": "Alex",
  "soul": "Who they are, values, temperament.",
  "style": "How they speak.",
  "rules": "Hard boundaries and never-dos.",
  "context": "Product facts, policies, pricing.",
  "intensity": 2
}
```

```bash
npm run vesperer -- personas create --from persona.json
```

Or:

```bash
curl -sS -X POST https://vesperer.com/api/v1/personas \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: vsk_YOUR_SECRET" \
  -d @persona.json
```

The response includes `chatApiKey` (`vesp_…`).

## Chat (end users)

```bash
curl -sS -X POST https://vesperer.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: vesp_PERSONA_CHAT_KEY" \
  -d '{"message":"Do you offer refunds?","peerId":"customer_123","displayName":"Sam","endUserAgeAttested":true}'
```

- `peerId` isolates memory per end-user. Always send a stable id in production.
- `endUserAgeAttested: true` is required for adult / After Dark personas.
- Default reasoning is **Native** (Vesperer + OpenRouter). No extra config.

## Native vs external reasoning

Same persona. Different brain plug:

1. Default — Native. Create and chat as above.
2. Advanced — Native plus voice, Telegram, knowledge packs.
3. External — `reasoningMode: "external"` plus a workspace `RuntimeBinding` (`baseUrl` + `authSecretRef`). Vesperer still owns identity, relationship, and memory.

Adult personas (`isAdult`) and the After Dark host **cannot** use the external runtime API (403). Stay on Native.

Do not store runtime secrets in the database. `authSecretRef` is an env var name such as `HERMES_RUNTIME_SECRET`.

## Isolation rules

- Management calls are scoped to the key's workspace. Foreign IDs return 404.
- Do not merge identities without evidence (`telegram_account_link` | `operator_verified` | `consumed_link_token`).
- Relationship stage hops are validated by Vesperer. `new_contact → trusted` is rejected. External runtimes may only **propose** `proposed_relationship_update`.
- The context envelope strips internal ids (vector / embedding / memory ids). Do not put them back.
- Sexual content involving minors / age-play is prohibited platform-wide.

## Rate limits (per minute, per account)

management 120 · create 30 · import 10 · knowledge 60 · chat 90 · runtime 60

## Additional resources

- API surface and curl shapes: [reference.md](reference.md)
- ContextEnvelope, ReasoningResult, bindings: [runtime.md](runtime.md)
- Claude walkthrough: https://vesperer.com/integrations/claude

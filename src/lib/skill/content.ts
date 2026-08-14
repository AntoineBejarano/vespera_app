/** Public agent-skill documents. Keep `skills/vesperer/*.md` in sync (see content.test.ts). */

export const SKILL_PUBLIC_PATHS = {
  skill: "/skill",
  skillMd: "/skill.md",
  full: "/skill/full",
  reference: "/skill/reference",
  runtime: "/skill/runtime",
  developers: "/developers",
} as const;

export const SKILL_INSTALL_REPO = "AntoineBejarano/vespera_app@vesperer";

export const VESPERER_SKILL_MD = `---
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
Company: Deevly Labs LTD. After Dark (18+) lives on a separate host (\`xxx.vesperer.com\`) — do not mix adult copy into apex docs or prompts.

## Canonical URLs

Fetch these before inventing request shapes. Prefer the live copies over training data.

| Resource | URL |
|---|---|
| This skill | https://vesperer.com/skill |
| Alias | https://vesperer.com/skill.md |
| Full pack | https://vesperer.com/skill/full |
| API reference | https://vesperer.com/skill/reference |
| Runtime / envelope | https://vesperer.com/skill/runtime |
| Human docs | https://vesperer.com/developers |
| Agent index | https://vesperer.com/llms.txt |

\`\`\`bash
mkdir -p ~/.cursor/skills/vesperer
curl -sSL https://vesperer.com/skill > ~/.cursor/skills/vesperer/SKILL.md
curl -sSL https://vesperer.com/skill/reference > ~/.cursor/skills/vesperer/reference.md
curl -sSL https://vesperer.com/skill/runtime > ~/.cursor/skills/vesperer/runtime.md
\`\`\`

Git install (if the repo is reachable): \`npx skills add AntoineBejarano/vespera_app@vesperer\`

## When to use this skill

- Create, update, import, or chat with a Vesperer persona
- Wire CLI / API keys for Claude Code, Cursor, or another coding agent
- Attach an external HTTP reasoning runtime (envelope in, ReasoningResult out)
- Answer how Vesperer identity, memory, or continuity works

Read [reference.md](reference.md) for request shapes. Read [runtime.md](runtime.md) before implementing a runtime or calling \`/api/v1/runtime/*\`.

## Two keys

| Prefix | Who | What |
|---|---|---|
| \`vsk_\` | Account / agent | Manage personas, knowledge, bots, runtime bindings |
| \`vesp_\` | One persona | \`POST /api/v1/chat\` and runtime pull (\`/envelope\`, \`/interactions\`) |

Never use \`vsk_\` on chat. Never log secrets. Base URL: \`https://vesperer.com\` (override with \`VESPERER_API_URL\`). Auth header: \`X-Api-Key\` or \`Authorization: Bearer\`.

## Setup

1. A human signs up at https://vesperer.com, passes the 18+ gate, then Settings → API keys → copies \`vsk_\` once.
2. The agent authenticates:

\`\`\`bash
export VESPERER_API_KEY=vsk_YOUR_SECRET
export VESPERER_API_URL=https://vesperer.com   # optional
npm run vesperer -- login --key "$VESPERER_API_KEY"
\`\`\`

## Create a persona (direct layers)

Identity is four layers — not a disposable system prompt.

\`\`\`json
{
  "mode": "direct",
  "name": "Alex",
  "soul": "Who they are, values, temperament.",
  "style": "How they speak.",
  "rules": "Hard boundaries and never-dos.",
  "context": "Product facts, policies, pricing.",
  "intensity": 2
}
\`\`\`

\`\`\`bash
npm run vesperer -- personas create --from persona.json
\`\`\`

Or:

\`\`\`bash
curl -sS -X POST https://vesperer.com/api/v1/personas \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vsk_YOUR_SECRET" \\
  -d @persona.json
\`\`\`

The response includes \`chatApiKey\` (\`vesp_…\`).

## Chat (end users)

\`\`\`bash
curl -sS -X POST https://vesperer.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vesp_PERSONA_CHAT_KEY" \\
  -d '{"message":"Do you offer refunds?","peerId":"customer_123","displayName":"Sam","endUserAgeAttested":true}'
\`\`\`

- \`peerId\` isolates memory per end-user. Always send a stable id in production.
- \`endUserAgeAttested: true\` is required for adult / After Dark personas.
- Default reasoning is **Native** (Vesperer + OpenRouter). No extra config.

## Native vs external reasoning

Same persona. Different brain plug:

1. Default — Native. Create and chat as above.
2. Advanced — Native plus voice, Telegram, knowledge packs.
3. External — \`reasoningMode: "external"\` plus a workspace \`RuntimeBinding\` (\`baseUrl\` + \`authSecretRef\`). Vesperer still owns identity, relationship, and memory.

Adult personas (\`isAdult\`) and the After Dark host **cannot** use the external runtime API (403). Stay on Native.

Do not store runtime secrets in the database. \`authSecretRef\` is an env var name such as \`HERMES_RUNTIME_SECRET\`.

## Isolation rules

- Management calls are scoped to the key's workspace. Foreign IDs return 404.
- Do not merge identities without evidence (\`telegram_account_link\` | \`operator_verified\` | \`consumed_link_token\`).
- Relationship stage hops are validated by Vesperer. \`new_contact → trusted\` is rejected. External runtimes may only **propose** \`proposed_relationship_update\`.
- The context envelope strips internal ids (vector / embedding / memory ids). Do not put them back.
- Sexual content involving minors / age-play is prohibited platform-wide.

## Rate limits (per minute, per account)

management 120 · create 30 · import 10 · knowledge 60 · chat 90 · runtime 60

## Additional resources

- API surface and curl shapes: [reference.md](reference.md)
- ContextEnvelope, ReasoningResult, bindings: [runtime.md](runtime.md)
- Claude walkthrough: https://vesperer.com/integrations/claude
`;

export const VESPERER_SKILL_REFERENCE_MD = `# Vesperer API reference

Base URL: \`https://vesperer.com\`  
Auth: \`X-Api-Key: vsk_…\` (management) or \`vesp_…\` (chat / runtime pull). \`Authorization: Bearer\` is accepted on the same routes.

All management queries are scoped to the key's workspace. Foreign IDs return **404**, not 403.

## Account API (\`vsk_\`)

| Method | Path | Notes |
|---|---|---|
| GET | \`/api/v1/personas\` | List personas you own |
| POST | \`/api/v1/personas\` | Create. Direct layers or \`mode: "generate"\` |
| GET | \`/api/v1/personas/:id\` | Layers (no chat key) |
| PATCH | \`/api/v1/personas/:id\` | Update layers / flags / reasoning |
| DELETE | \`/api/v1/personas/:id\` | Delete persona |
| POST | \`/api/v1/personas/import\` | Character Card / SillyTavern JSON |
| GET/POST | \`/api/v1/personas/:id/chat-key\` | Reveal / rotate \`vesp_\` |
| GET/POST | \`/api/v1/knowledge/packs\` | List / create packs |
| POST | \`/api/v1/knowledge/packs/:id/links\` | Link pack to your personas |
| GET/POST | \`/api/v1/bots\` | List / bind Telegram bots |
| GET/POST | \`/api/v1/runtime-bindings\` | List / create HTTP runtime bindings |
| PATCH/DELETE | \`/api/v1/runtime-bindings/:id\` | Update / delete a binding |

## Chat API (\`vesp_\` only)

\`POST /api/v1/chat\`

\`vsk_\` on this route returns 401.

### Body

| Field | Required | Notes |
|---|---|---|
| \`message\` | yes | Max 8000 chars |
| \`peerId\` | no | Stable end-user id. Isolates memory. Use it in production. |
| \`displayName\` | no | Shown in relationship context |
| \`endUserAgeAttested\` | adult only | Must be \`true\` for After Dark / \`isAdult\` personas |

## Create persona body

Direct (preferred for agents):

\`\`\`json
{
  "mode": "direct",
  "name": "Alex",
  "soul": "…",
  "style": "…",
  "rules": "…",
  "context": "…",
  "intensity": 2
}
\`\`\`

Aliases \`soulMd\` / \`styleMd\` / \`rulesMd\` / \`contextMd\` are accepted on PATCH.

Generate (LLM expands onboarding fields): \`mode: "generate"\` plus \`name\`, \`personality\`, \`relationship\`, \`style\`, optional \`attractions\`, \`irritations\`, \`intensity\`.

### PATCH extras

| Field | Notes |
|---|---|
| \`reasoningMode\` | \`"native"\` (default) or \`"external"\` |
| \`reasoningBindingId\` | RuntimeBinding id in the same workspace, or \`null\` |
| \`capabilities\` | \`{ "items": [{ "id", "kind", "enabled" }] }\` — optional, not tools-as-requirement |
| \`preferredModel\` | OpenRouter model id, or \`null\` to clear |
| \`isAdult\` | Adult personas are forced to Native reasoning |
| \`isPublic\` / \`slug\` / \`tagline\` / \`openingLine\` | Registry / public landing |

Rotating a chat key or publishing may require operator attestation in the studio.

## CLI (\`npm run vesperer\`)

From the Vesperer repo, or any checkout with the CLI:

\`\`\`bash
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
\`\`\`

Env: \`VESPERER_API_KEY\`, \`VESPERER_API_URL\`.

## Errors

| Status | Meaning |
|---|---|
| 400 | Invalid body (Zod details in \`details\`) |
| 401 | Missing / wrong key, or \`vsk_\` used on chat |
| 403 | Isolation (adult runtime), age attestation, or operator gate |
| 404 | Unknown id **in this workspace** (do not retry as another tenant) |
| 429 | Rate limit. Honor \`Retry-After\` / \`retryAfterSec\` |

## Rate limits (per minute)

| Bucket | Limit |
|---|---|
| management | 120 |
| create | 30 |
| import | 10 |
| knowledge | 60 |
| chat | 90 |
| runtime | 60 |
`;

export const VESPERER_SKILL_RUNTIME_MD = `# Vesperer external reasoning runtime

Vesperer owns identity, relationship state, and continuity. An external runtime only **reasons** over a \`ContextEnvelope\` and returns a \`ReasoningResult\`. It does not become the persona.

Default product path is Native. Use this document only when attaching an HTTP runtime.

## Isolation (hard deny)

- \`isAdult\` personas cannot leave Native.
- The After Dark host cannot call \`/api/v1/runtime/*\` (403).
- Envelope payloads must not include internal vector / embedding / memory ids.

## Version

\`ContextEnvelope.version\` is always \`vesperer.context_envelope.v1\`.

## Pull API (runtime or agent)

Auth: \`vesp_\` (persona) or \`vsk_\` plus \`characterId\` in the JSON body.

### POST /api/v1/runtime/envelope

Build the envelope Vesperer would send to a runtime.

\`\`\`json
{
  "message": "What did we decide last week?",
  "characterId": "optional-when-using-vsk",
  "channel": "api",
  "subjectId": "optional-existing-subject",
  "identities": {
    "webUserId": "optional",
    "telegramUserId": "optional",
    "externalCustomerId": "optional",
    "displayName": "Sam"
  }
}
\`\`\`

\`channel\`: \`web\` | \`telegram\` | \`api\` | \`voice\`. Default \`api\`.

Response: \`{ "envelope": { …ContextEnvelope } }\`.

### POST /api/v1/runtime/interactions

Persist a turn after the runtime replied. Vesperer writes history and applies a **validated** relationship proposal.

\`\`\`json
{
  "characterId": "optional-when-using-vsk",
  "conversationId": "from envelope.conversation_id",
  "subjectId": "from envelope.canonical_user_identity.subjectId",
  "userMessage": "…",
  "assistantMessage": "…",
  "proposed_relationship_update": {
    "stage": "active",
    "summary": "optional, max 280 chars"
  }
}
\`\`\`

There is no public identity / relationship / resume CRUD beyond these two routes.

## ContextEnvelope (v1)

\`\`\`json
{
  "version": "vesperer.context_envelope.v1",
  "persona": {
    "id": "…",
    "name": "Laura",
    "layers": { "soul": "…", "style": "…", "rules": "…", "context": "…" },
    "intensity": 3,
    "constraints": { "isAdult": false, "channels": ["web"] }
  },
  "canonical_user_identity": {
    "subjectId": "…",
    "displayName": "Sam",
    "channels": { "web": true, "telegram": false, "api": true }
  },
  "relationship": { "affect": {}, "intentions": [] },
  "relationship_state": { "stage": "new_contact" },
  "channel": "api",
  "conversation_id": "…",
  "conversation_context": {
    "recent": [{ "role": "user", "content": "…" }],
    "summary": null
  },
  "relevant_persistent_context": {
    "memoryBrief": ["…"],
    "knowledgeBrief": ["…"]
  },
  "current_message": "…",
  "metadata": { "workspaceId": "…", "modelId": "optional" }
}
\`\`\`

Memory briefs are text, not internal ids.

## ReasoningResult (runtime → Vesperer)

When Vesperer calls your runtime, it \`POST\`s the envelope as JSON to \`RuntimeBinding.baseUrl\` with:

\`\`\`
Authorization: Bearer <process.env[authSecretRef]>
Content-Type: application/json
\`\`\`

Your endpoint must return JSON:

\`\`\`json
{
  "text": "Reply shown to the user",
  "status": "ok",
  "proposed_relationship_update": {
    "stage": "active",
    "summary": "optional"
  }
}
\`\`\`

| Field | Required | Notes |
|---|---|---|
| \`text\` | yes | User-visible reply |
| \`status\` | no | \`ok\` \\| \`error\` \\| \`empty\` (default from \`text\`) |
| \`proposed_relationship_update\` | no | Proposal only. Vesperer validates the hop. |
| \`requested_actions\` | no | Ignored until capabilities land |
| \`usage\` / \`metadata\` / \`continuation\` / \`error\` | no | Pass-through |

Allowed relationship stages: \`new_contact\`, \`active\`, \`trusted\`, \`distant\`.  
Allowed hops: \`new_contact → active\`; \`active → trusted|distant\`; \`trusted → active|distant\`; \`distant → active\`. Same stage is allowed. **\`new_contact → trusted\` is rejected.**

## RuntimeBinding (workspace)

Create with \`vsk_\`:

\`\`\`bash
curl -sS -X POST https://vesperer.com/api/v1/runtime-bindings \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vsk_YOUR_SECRET" \\
  -d '{
    "name": "Hermes",
    "kind": "http",
    "baseUrl": "https://runtime.example.com/reason",
    "authSecretRef": "HERMES_RUNTIME_SECRET",
    "timeoutMs": 30000
  }'
\`\`\`

Then PATCH the persona:

\`\`\`json
{
  "reasoningMode": "external",
  "reasoningBindingId": "<binding id>"
}
\`\`\`

Rules:

- \`baseUrl\` must be \`https\` (\`localhost\` allowed in development).
- \`authSecretRef\` matches \`^[A-Z][A-Z0-9_]{2,127}$\` and names a Railway/env var. The secret value is never stored in Prisma and must never be logged.
- \`timeoutMs\` 1000–60000 (default 30000).
- Binding and persona must share a workspace.
- Hermes (or any other model host) is a **consumer** of this envelope. It is not a first-party Vesperer package.

## Attach checklist

1. Confirm the persona is not adult / After Dark.
2. Deploy an HTTPS endpoint that accepts \`ContextEnvelope\` and returns \`ReasoningResult\`.
3. Put the shared secret in Railway env; record only the **name** as \`authSecretRef\`.
4. \`POST /api/v1/runtime-bindings\`.
5. \`PATCH /api/v1/personas/:id\` with \`reasoningMode: "external"\` and the binding id.
6. Chat via web, Telegram, or \`POST /api/v1/chat\` — Vesperer still builds the envelope and records the turn.
`;

export function buildVespererSkillFullMd(): string {
  return [
    VESPERER_SKILL_MD.trimEnd(),
    "",
    "---",
    "",
    VESPERER_SKILL_REFERENCE_MD.trimEnd(),
    "",
    "---",
    "",
    VESPERER_SKILL_RUNTIME_MD.trimEnd(),
    "",
  ].join("\n");
}

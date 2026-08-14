# Vesperer external reasoning runtime

Vesperer owns identity, relationship state, and continuity. An external runtime only **reasons** over a `ContextEnvelope` and returns a `ReasoningResult`. It does not become the persona.

Default product path is Native. Use this document only when attaching an HTTP runtime.

## Isolation (hard deny)

- `isAdult` personas cannot leave Native.
- The After Dark host cannot call `/api/v1/runtime/*` (403).
- Envelope payloads must not include internal vector / embedding / memory ids.

## Version

`ContextEnvelope.version` is always `vesperer.context_envelope.v1`.

## Pull API (runtime or agent)

Auth: `vesp_` (persona) or `vsk_` plus `characterId` in the JSON body.

### POST /api/v1/runtime/envelope

Build the envelope Vesperer would send to a runtime.

```json
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
```

`channel`: `web` | `telegram` | `api` | `voice`. Default `api`.

Response: `{ "envelope": { …ContextEnvelope } }`.

### POST /api/v1/runtime/interactions

Persist a turn after the runtime replied. Vesperer writes history and applies a **validated** relationship proposal.

```json
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
```

There is no public identity / relationship / resume CRUD beyond these two routes.

## ContextEnvelope (v1)

```json
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
```

Memory briefs are text, not internal ids.

## ReasoningResult (runtime → Vesperer)

When Vesperer calls your runtime, it `POST`s the envelope as JSON to `RuntimeBinding.baseUrl` with:

```
Authorization: Bearer <process.env[authSecretRef]>
Content-Type: application/json
```

Your endpoint must return JSON:

```json
{
  "text": "Reply shown to the user",
  "status": "ok",
  "proposed_relationship_update": {
    "stage": "active",
    "summary": "optional"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `text` | yes | User-visible reply |
| `status` | no | `ok` \| `error` \| `empty` (default from `text`) |
| `proposed_relationship_update` | no | Proposal only. Vesperer validates the hop. |
| `requested_actions` | no | Ignored until capabilities land |
| `usage` / `metadata` / `continuation` / `error` | no | Pass-through |

Allowed relationship stages: `new_contact`, `active`, `trusted`, `distant`.  
Allowed hops: `new_contact → active`; `active → trusted|distant`; `trusted → active|distant`; `distant → active`. Same stage is allowed. **`new_contact → trusted` is rejected.**

## RuntimeBinding (workspace)

Create with `vsk_`:

```bash
curl -sS -X POST https://vesperer.com/api/v1/runtime-bindings \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: vsk_YOUR_SECRET" \
  -d '{
    "name": "Hermes",
    "kind": "http",
    "baseUrl": "https://runtime.example.com/reason",
    "authSecretRef": "HERMES_RUNTIME_SECRET",
    "timeoutMs": 30000
  }'
```

Then PATCH the persona:

```json
{
  "reasoningMode": "external",
  "reasoningBindingId": "<binding id>"
}
```

Rules:

- `baseUrl` must be `https` (`localhost` allowed in development).
- `authSecretRef` matches `^[A-Z][A-Z0-9_]{2,127}$` and names a Railway/env var. The secret value is never stored in Prisma and must never be logged.
- `timeoutMs` 1000–60000 (default 30000).
- Binding and persona must share a workspace.
- Hermes (or any other model host) is a **consumer** of this envelope. It is not a first-party Vesperer package.

## Attach checklist

1. Confirm the persona is not adult / After Dark.
2. Deploy an HTTPS endpoint that accepts `ContextEnvelope` and returns `ReasoningResult`.
3. Put the shared secret in Railway env; record only the **name** as `authSecretRef`.
4. `POST /api/v1/runtime-bindings`.
5. `PATCH /api/v1/personas/:id` with `reasoningMode: "external"` and the binding id.
6. Chat via web, Telegram, or `POST /api/v1/chat` — Vesperer still builds the envelope and records the turn.

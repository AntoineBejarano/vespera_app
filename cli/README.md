# vesperer CLI

Create and list Vesperer personas with an **account API key** (`vsk_…`). Designed so AI agents can provision characters without a browser.

## Setup

1. Sign up at [vesperer.com](https://vesperer.com)
2. Settings → **API keys** → Create key (copy the `vsk_…` secret once)
3. Accept platform operator attestation in Personas if prompted

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
```

The response includes a **chat** API key (`vesp_…`) for `/api/v1/chat`.

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

## List

```bash
npm run vesperer -- personas list
```

## Keys

| Key | Prefix | Use |
|-----|--------|-----|
| Account (CLI) | `vsk_` | Create/list personas |
| Persona chat | `vesp_` | `POST /api/v1/chat` only |

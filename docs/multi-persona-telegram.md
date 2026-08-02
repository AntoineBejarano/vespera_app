# Multi-persona chat (Telegram-group-first)

## Mental model

Imagine creating a **Telegram group** and adding several bots — one bot per persona.

- **If Telegram lets you put several bots in one group** (it does): use that. No need for a special “multi-person chat” product surface in Vesperer for v1. The group *is* the multi-persona room.
- **If multi-bot were blocked or insufficient**: fall back to a **single thread / single bot** where several minds speak and are orchestrated (who replies when, speaker labels, optional @addressing).

Do not invent a parallel multi-agent web UX that diverges from Telegram group semantics until the orchestrated fallback is intentional product work.

## Preferred path (today)

1. Personas live in a **workspace** (shared studio).
2. Each persona gets its own Telegram bot (Agency → connect bot).
3. BotFather: disable **privacy mode** (`/setprivacy` → Disable) so bots see ordinary group messages, not only commands/@mentions.
4. Create a Telegram group; add the bots; chat as usual.

Telegram allows multiple bots in one group. That is the v1 multi-persona story.

## Fallback (next, only if needed)

Single-thread orchestration:

- One inbound channel (web chat or one Telegram bot).
- Router chooses which persona(s) speak each turn.
- Persist speaker labels on messages.
- Optional: @name addressing.

## Vesperer mapping

| Piece | Model |
|-------|--------|
| Workspace | Shared studio (people + personas + packs) |
| Persona | `Character` + optional `TelegramBot` |
| Multi-persona room (v1) | External Telegram group (no special DB row) |
| Orchestrated thread | Future: `Conversation` with multiple character participants |
